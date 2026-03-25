/**
 * Vercel Serverless Function — CAPI Proxy (Batch Events)
 * POST /api/capi/batch
 */
const crypto = require("crypto");

const PIXEL_ID = process.env.META_PIXEL_ID || "1684145446350033";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`;

const ALLOWED_ORIGINS = [
  "https://mishaberman.github.io",
  "https://demoshop-fpx9kus8.manus.space",
  "https://misha-pixel-sites.manus.space",
];

function getCorsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
  if (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }
  return headers;
}

function hashValue(value) {
  if (!value) return "";
  if (/^[a-f0-9]{64}$/.test(value)) return value;
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function hashUserData(userData) {
  const piiFields = ["em", "ph", "fn", "ln", "ct", "st", "zp", "country", "db", "ge"];
  const hashed = {};
  for (const [key, value] of Object.entries(userData)) {
    if (piiFields.includes(key) && typeof value === "string" && value) {
      if (key === "ph") {
        hashed[key] = hashValue(value.replace(/\D/g, ""));
      } else {
        hashed[key] = hashValue(value);
      }
    } else if (Array.isArray(value)) {
      hashed[key] = value.map((v) => (typeof v === "string" ? hashValue(v) : v));
    } else {
      hashed[key] = value;
    }
  }
  return hashed;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return "0.0.0.0";
}

function buildEventPayload(event, req) {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    event_name: event.event_name,
    event_time: event.event_time || now,
    action_source: event.action_source || "website",
    event_source_url: event.event_source_url || req.headers.referer || "",
  };
  if (event.event_id) payload.event_id = event.event_id;

  const userData = event.user_data || {};
  userData.client_ip_address = getClientIp(req);
  userData.client_user_agent = req.headers["user-agent"] || "";
  payload.user_data = hashUserData(userData);

  if (event.custom_data) payload.custom_data = event.custom_data;
  if (event.data_processing_options) {
    payload.data_processing_options = event.data_processing_options;
    payload.data_processing_options_country = event.data_processing_options_country || 0;
    payload.data_processing_options_state = event.data_processing_options_state || 0;
  }
  if (event.opt_out !== undefined) payload.opt_out = event.opt_out;
  return payload;
}

async function sendToConversionsApi(events) {
  if (!ACCESS_TOKEN) {
    return { success: false, error: "META_ACCESS_TOKEN not configured" };
  }
  try {
    const response = await fetch(GRAPH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: events, access_token: ACCESS_TOKEN }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error?.message || "API error", fbtrace_id: result.error?.fbtrace_id };
    }
    return { success: true, events_received: result.events_received || events.length, fbtrace_id: result.fbtrace_id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req.headers.origin);
  for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

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
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
