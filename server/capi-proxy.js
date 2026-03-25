/**
 * CAPI Proxy Server — Excellent Implementation
 *
 * A production-quality server-side proxy that forwards browser events to
 * Meta's Conversions API. Keeps the access token on the server, performs
 * SHA-256 hashing of PII, enriches payloads with client_ip_address and
 * client_user_agent, and supports event deduplication via event_id.
 *
 * Endpoints:
 *   POST /api/capi/event   — Send a single event
 *   POST /api/capi/batch   — Send multiple events (up to 1000)
 *   GET  /api/capi/health  — Health check
 *   GET  /api/capi/config  — Public configuration (no secrets)
 *
 * Environment variables:
 *   META_PIXEL_ID      — Your Meta Pixel ID
 *   META_ACCESS_TOKEN   — Conversions API system user token (never exposed to frontend)
 *   PORT               — Server port (default: 3001)
 *
 * Deploy to: Vercel, Railway, Render, Fly.io, or any Node.js host.
 */

const express = require("express");
const crypto = require("crypto");

const app = express();

// ─── Config ──────────────────────────────────────────────────────────────────
const PIXEL_ID = process.env.META_PIXEL_ID || "1684145446350033";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));

// CORS — restrict to configured origins (defaults to * for development)
app.use((req, res, next) => {
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*").split(",");
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * SHA-256 hash a value after normalizing (lowercase, trim).
 * Returns the hex digest. If value is already 64-char hex, assume pre-hashed.
 */
function hashValue(value) {
  if (!value) return "";
  if (/^[a-f0-9]{64}$/.test(value)) return value; // already hashed
  const normalized = value.toLowerCase().trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normalize and hash all PII fields in user_data.
 * Fields: em, ph, fn, ln, ct, st, zp, country, db, ge
 * Non-PII fields (fbp, fbc, external_id, client_ip_address, etc.) pass through.
 */
function hashUserData(userData) {
  const piiFields = ["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "db", "ge"];
  const hashed = {};

  for (const [key, value] of Object.entries(userData)) {
    if (piiFields.includes(key) && typeof value === "string" && value) {
      if (key === "ph") {
        // Normalize phone: strip non-digits before hashing
        const digits = value.replace(/\D/g, "");
        hashed[key] = hashValue(digits);
      } else {
        hashed[key] = hashValue(value);
      }
    } else if (Array.isArray(value)) {
      // Handle array fields like external_id
      hashed[key] = value.map((v) => (typeof v === "string" ? hashValue(v) : v));
    } else {
      // Non-PII fields pass through (fbc, fbp, client_ip_address, etc.)
      hashed[key] = value;
    }
  }

  return hashed;
}

/**
 * Extract the real client IP from proxy headers.
 */
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress || "0.0.0.0";
}

/**
 * Build a single event payload for the Conversions API.
 * Enriches with server-side signals: client_ip_address, client_user_agent.
 */
function buildEventPayload(event, req) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    event_name: event.event_name,
    event_time: event.event_time || now,
    action_source: event.action_source || "website",
    event_source_url: event.event_source_url || req.headers.referer || "",
  };

  // event_id for deduplication (must match the browser pixel's eventID)
  if (event.event_id) {
    payload.event_id = event.event_id;
  }

  // Build user_data with server-side enrichment
  const userData = event.user_data || {};
  userData.client_ip_address = getClientIp(req);
  userData.client_user_agent = req.headers["user-agent"] || "";

  // Hash all PII server-side
  payload.user_data = hashUserData(userData);

  // Pass through custom_data (value, currency, content_ids, etc.)
  if (event.custom_data) {
    payload.custom_data = event.custom_data;
  }

  // Data processing options (LDU / CCPA / GDPR compliance)
  if (event.data_processing_options) {
    payload.data_processing_options = event.data_processing_options;
    payload.data_processing_options_country = event.data_processing_options_country || 0;
    payload.data_processing_options_state = event.data_processing_options_state || 0;
  }

  // Opt-out flag
  if (event.opt_out !== undefined) {
    payload.opt_out = event.opt_out;
  }

  return payload;
}

/**
 * Send events to Meta's Conversions API via HTTPS POST.
 */
async function sendToConversionsApi(events) {
  if (!ACCESS_TOKEN) {
    return {
      success: false,
      error: "META_ACCESS_TOKEN not configured",
      events_received: events.length,
    };
  }

  const body = {
    data: events,
    access_token: ACCESS_TOKEN,
    // Uncomment for testing:
    // test_event_code: "TEST12345",
  };

  try {
    const response = await fetch(GRAPH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] API error:", JSON.stringify(result));
      return {
        success: false,
        error: result.error?.message || "Unknown API error",
        fbtrace_id: result.error?.fbtrace_id,
        events_received: events.length,
      };
    }

    console.log(
      `[CAPI] Sent ${events.length} event(s):`,
      events.map((e) => e.event_name).join(", ")
    );

    return {
      success: true,
      events_received: result.events_received || events.length,
      messages: result.messages || [],
      fbtrace_id: result.fbtrace_id,
    };
  } catch (err) {
    console.error("[CAPI] Network error:", err.message);
    return { success: false, error: err.message, events_received: 0 };
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** POST /api/capi/event — Send a single event */
app.post("/api/capi/event", async (req, res) => {
  try {
    const event = req.body;
    if (!event.event_name) {
      return res.status(400).json({ success: false, error: "event_name is required" });
    }
    const payload = buildEventPayload(event, req);
    const result = await sendToConversionsApi([payload]);
    return res.json(result);
  } catch (err) {
    console.error("[CAPI] Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/** POST /api/capi/batch — Send multiple events */
app.post("/api/capi/batch", async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: "events array is required" });
    }
    if (events.length > 1000) {
      return res.status(400).json({ success: false, error: "Maximum 1000 events per batch" });
    }
    const payloads = events.map((event) => buildEventPayload(event, req));
    const result = await sendToConversionsApi(payloads);
    return res.json(result);
  } catch (err) {
    console.error("[CAPI] Error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/** GET /api/capi/health — Health check */
app.get("/api/capi/health", (_req, res) => {
  return res.json({
    status: "ok",
    pixel_id: PIXEL_ID,
    has_access_token: !!ACCESS_TOKEN,
    graph_api_version: GRAPH_API_VERSION,
    timestamp: new Date().toISOString(),
    capabilities: [
      "server_side_hashing",
      "ip_extraction",
      "user_agent_extraction",
      "event_deduplication",
      "data_processing_options",
      "batch_events",
    ],
  });
});

/** GET /api/capi/config — Public configuration (no secrets) */
app.get("/api/capi/config", (_req, res) => {
  return res.json({
    pixel_id: PIXEL_ID,
    endpoint: "/api/capi/event",
    batch_endpoint: "/api/capi/batch",
    supported_events: [
      "PageView", "ViewContent", "AddToCart", "InitiateCheckout",
      "Purchase", "Lead", "CompleteRegistration", "Contact", "Search",
    ],
    features: {
      server_side_hashing: true,
      ip_enrichment: true,
      user_agent_enrichment: true,
      deduplication: true,
      data_processing_options: true,
    },
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[CAPI Proxy] Running on http://localhost:${PORT}`);
  console.log(`[CAPI Proxy] Pixel ID: ${PIXEL_ID}`);
  console.log(`[CAPI Proxy] Access token: ${ACCESS_TOKEN ? "configured" : "MISSING"}`);
});

module.exports = app; // For Vercel serverless
