/**
 * Vercel Serverless Function — POST /api/capi/event
 * Forwards a single event to Meta's Conversions API.
 */
const crypto = require("crypto");

const PIXEL_ID = process.env.META_PIXEL_ID || "1684145446350033";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`;

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
      hashed[key] = key === "ph" ? hashValue(value.replace(/\D/g, "")) : hashValue(value);
    } else if (Array.isArray(value)) {
      hashed[key] = value.map((v) => (typeof v === "string" ? hashValue(v) : v));
    } else {
      hashed[key] = value;
    }
  }
  return hashed;
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const event = req.body;
    if (!event.event_name) {
      return res.status(400).json({ success: false, error: "event_name is required" });
    }

    const now = Math.floor(Date.now() / 1000);
    const userData = event.user_data || {};
    userData.client_ip_address = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "";
    userData.client_user_agent = req.headers["user-agent"] || "";

    const payload = {
      event_name: event.event_name,
      event_time: event.event_time || now,
      action_source: event.action_source || "website",
      event_source_url: event.event_source_url || req.headers.referer || "",
      user_data: hashUserData(userData),
    };
    if (event.event_id) payload.event_id = event.event_id;
    if (event.custom_data) payload.custom_data = event.custom_data;
    if (event.data_processing_options) {
      payload.data_processing_options = event.data_processing_options;
      payload.data_processing_options_country = event.data_processing_options_country || 0;
      payload.data_processing_options_state = event.data_processing_options_state || 0;
    }

    const response = await fetch(GRAPH_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: [payload], access_token: ACCESS_TOKEN }),
    });
    const result = await response.json();

    if (!response.ok) {
      return res.status(502).json({ success: false, error: result.error?.message || "API error" });
    }
    return res.json({ success: true, events_received: result.events_received || 1 });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};
