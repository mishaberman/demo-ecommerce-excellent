/**
 * Vercel Serverless Function — CAPI Proxy Health Check
 * GET /api/capi/health
 */
const PIXEL_ID = process.env.META_PIXEL_ID || "1684145446350033";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const GRAPH_API_VERSION = "v21.0";

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

module.exports = async function handler(req, res) {
  const corsHeaders = getCorsHeaders(req.headers.origin);
  for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);

  if (req.method === "OPTIONS") return res.status(200).end();

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
};
