# demo-ecommerce-excellent

## Overview
This variant demonstrates a **production-quality** Meta Pixel and Conversions API (CAPI) implementation. It represents the gold standard for e-commerce tracking, with full server-side event forwarding, SHA-256 PII hashing, event deduplication, data processing options, and comprehensive user data collection. This is part of a collection of demo e-commerce sites that showcase different levels of Meta Pixel and CAPI implementation quality.

**Live Site:** https://mishaberman.github.io/demo-ecommerce-excellent/
**Quality Grade:** A+

## Architecture

```
┌──────────────┐     fbq() events      ┌──────────────────┐
│   Browser    │ ──────────────────────>│   Meta Pixel     │
│  (React SPA) │                        │   (Client-Side)  │
│              │     POST /api/capi/*   └──────────────────┘
│              │ ──────────────────────>┌──────────────────┐
└──────────────┘                        │  CAPI Proxy      │
                                        │  (Express.js)    │
                                        │  - PII hashing   │
                                        │  - IP enrichment │
                                        │  - Deduplication │
                                        │  - LDU support   │
                                        └───────┬──────────┘
                                                │ POST graph.facebook.com
                                                ▼
                                        ┌──────────────────┐
                                        │  Meta Conversions│
                                        │  API (Server)    │
                                        └──────────────────┘
```

### Frontend (`src/`)
- Vite + React + TypeScript SPA deployed to GitHub Pages
- Fires `fbq()` pixel events with `eventID` for deduplication
- Sends matching events to the CAPI proxy server with the same `event_id`
- Generates synthetic `_fbp` cookie if not present (param builder pattern)
- Extracts `fbc` from `fbclid` URL parameter (param builder pattern)

### Backend (`server/`)
- Express.js CAPI proxy server
- Endpoints: `POST /api/capi/event`, `POST /api/capi/batch`, `GET /api/capi/health`, `GET /api/capi/config`
- SHA-256 hashes all PII fields (em, ph, fn, ln, ct, st, zp, country, db, ge)
- Normalizes phone numbers (strips non-digits) before hashing
- Enriches payloads with `client_ip_address` (from X-Forwarded-For) and `client_user_agent`
- Supports `data_processing_options` for LDU/CCPA compliance
- Batch endpoint supports up to 1000 events per request
- Access token stored securely in environment variables, never exposed to frontend

## Meta Pixel Setup

### Base Pixel Code
- **Pixel ID:** `1684145446350033`
- **Location:** The base pixel code is loaded in the `<head>` tag of `index.html`.
- **Noscript Fallback:** Included for users with JavaScript disabled.

### Advanced Matching
- **User Data:** Comprehensive user data is collected including email (`em`), phone (`ph`), first name (`fn`), last name (`ln`), city (`ct`), state (`st`), zip code (`zp`), and `external_id`.
- **Implementation:** User data is passed both via client-side `fbq('init', ...)` and server-side CAPI payload.

### Parameter Builder Patterns
- **Synthetic `_fbp`:** If the `_fbp` cookie is not present, the frontend generates a synthetic `fbp` value in the format `fb.1.{timestamp}.{random}` and includes it in CAPI payloads.
- **`fbc` from `fbclid`:** The frontend extracts the `fbclid` parameter from the URL and constructs an `fbc` value in the format `fb.1.{timestamp}.{fbclid}`, ensuring click attribution is preserved even when cookies are blocked.

## Conversions API (CAPI) Setup

### Method
**Server-Side Proxy** — Events are sent from the browser to an Express.js backend, which enriches, hashes, and forwards them to Meta's Conversions API via HTTPS POST to `graph.facebook.com`.

### Server Code Location
- **Main proxy:** `server/capi-proxy.js` — Standalone Express server with all CAPI logic
- **Vercel function:** `server/api/capi/event.js` — Serverless function version for Vercel deployment
- **Package:** `server/package.json` — Dependencies and scripts

### Implementation Details
- **Event Transmission:** Browser → `POST /api/capi/event` → Express proxy → `POST graph.facebook.com/v21.0/{pixel_id}/events`
- **Access Token:** Stored in `META_ACCESS_TOKEN` environment variable, never in client-side code
- **PII Hashing:** All PII fields are normalized (lowercase, trim) and SHA-256 hashed server-side
- **Phone Normalization:** Phone numbers are stripped of non-digit characters before hashing
- **IP Enrichment:** `client_ip_address` extracted from `X-Forwarded-For` header
- **User Agent:** `client_user_agent` extracted from `User-Agent` header
- **Data Processing Options:** Supports `data_processing_options`, `data_processing_options_country`, `data_processing_options_state` for LDU/CCPA/GDPR compliance
- **Batch Support:** `POST /api/capi/batch` accepts up to 1000 events in a single request

## Events Tracked

| Event Name           | Pixel | CAPI | Parameters Sent                                              | event_id |
|----------------------|-------|------|--------------------------------------------------------------|----------|
| PageView             | Yes   | Yes  | (none)                                                       | Yes      |
| ViewContent          | Yes   | Yes  | `content_ids`, `content_type`, `content_name`, `value`, `currency` | Yes      |
| AddToCart            | Yes   | Yes  | `content_ids`, `content_type`, `content_name`, `value`, `currency` | Yes      |
| InitiateCheckout     | Yes   | Yes  | `content_ids`, `content_type`, `content_name`, `value`, `currency`, `num_items` | Yes      |
| Purchase             | Yes   | Yes  | `content_ids`, `content_type`, `content_name`, `value`, `currency`, `num_items` | Yes      |
| Lead                 | Yes   | Yes  | `content_name`, `value`, `currency`                            | Yes      |
| CompleteRegistration | Yes   | Yes  | `content_name`, `value`, `currency`                            | Yes      |
| Contact              | Yes   | Yes  | `content_name`, `value`, `currency`                            | Yes      |
| Search               | Yes   | Yes  | `search_string`                                              | Yes      |

## Event Deduplication
- **`event_id`:** Every event is assigned a unique `event_id` (UUID) that is sent with both the browser pixel (`eventID` parameter in `fbq()`) and the server-side CAPI payload (`event_id` field).
- **Deduplication Status:** Full deduplication is implemented. Meta will automatically deduplicate events that share the same `event_name` + `event_id` combination within a 48-hour window.

## User Data Parameters (EMQ)

| Parameter            | Collected | Hashed | Source                          |
|----------------------|-----------|--------|---------------------------------|
| `em` (email)         | Yes       | SHA-256| Form submissions, checkout      |
| `ph` (phone)         | Yes       | SHA-256| Form submissions, checkout      |
| `fn` (first name)    | Yes       | SHA-256| Registration, checkout          |
| `ln` (last name)     | Yes       | SHA-256| Registration, checkout          |
| `ct` (city)          | Yes       | SHA-256| Checkout address                |
| `st` (state)         | Yes       | SHA-256| Checkout address                |
| `zp` (zip code)      | Yes       | SHA-256| Checkout address                |
| `external_id`        | Yes       | SHA-256| User session ID                 |
| `fbp`                | Yes       | No     | `_fbp` cookie or synthetic      |
| `fbc`                | Yes       | No     | `_fbc` cookie or from `fbclid`  |
| `client_ip_address`  | Yes       | No     | Server-side (X-Forwarded-For)   |
| `client_user_agent`  | Yes       | No     | Server-side (User-Agent header) |

## Deployment

### Frontend (GitHub Pages)
The frontend is automatically deployed to GitHub Pages via the `gh-pages` branch.

### Backend (Self-Hosted)
The CAPI proxy server can be deployed to any Node.js hosting platform:

```bash
cd server
npm install
META_PIXEL_ID=your_pixel_id META_ACCESS_TOKEN=your_token node capi-proxy.js
```

Or deploy to Vercel using the serverless function in `server/api/capi/event.js`.

## Security Considerations
- **Access Token:** Securely stored in environment variables, never exposed to client-side code
- **PII Hashing:** All PII is SHA-256 hashed server-side before transmission to Meta
- **CORS:** Configured to allow cross-origin requests from the GitHub Pages frontend
- **No Hardcoded Secrets:** No tokens or keys are committed to the repository

---
*This variant is part of the [Meta Pixel Quality Variants](https://github.com/mishaberman) collection for testing and educational purposes.*
