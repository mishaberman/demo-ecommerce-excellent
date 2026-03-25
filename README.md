# Excellent Variant (`A`)

This is a near-perfect, A-grade implementation of Meta Pixel and Conversions API for a demo e-commerce site. It utilizes a server-side proxy architecture to securely handle the Conversions API access token. This variant demonstrates full event coverage with rich parameters, server-side SHA-256 hashing for user data, and reliable event deduplication using a shared `event_id`. It also includes support for data processing options for privacy compliance, making it a gold standard for tracking setups.

### Quick Facts

| Attribute | Value |
| :--- | :--- |
| **Pixel ID** | `1684145446350033` |
| **CAPI Method** | Server-side proxy (Vercel) |
| **Grade** | A (90/100) |
| **Live Site** | [demo-ecommerce-excellent](https://mishaberman.github.io/demo-ecommerce-excellent/) |
| **GitHub Repo** | [demo-ecommerce-excellent](https://github.com/mishaberman/demo-ecommerce-excellent) |

### What's Implemented

- ✅ Server-side access token storage
- ✅ Server-side PII hashing (SHA-256)
- ✅ `event_id` based deduplication
- ✅ `fbp` and `fbc` parameters generated client-side
- ✅ IP address and User Agent enrichment on the server
- ✅ Server-side retry logic for CAPI requests
- ✅ Batch endpoint for CAPI events
- ✅ Data Processing Options (DPO) for privacy compliance

### What's Missing or Broken

- ❌ **Minor:** `access_token` is referenced in a code comment.
- ❌ **Minor:** No client-side retry mechanism for failed proxy calls.

### Event Coverage

| Event | Pixel | CAPI |
| :--- | :---: | :---: |
| `ViewContent` | ✅ | ✅ |
| `AddToCart` | ✅ | ✅ |
| `InitiateCheckout` | ✅ | ✅ |
| `Purchase` | ✅ | ✅ |
| `Lead` | ✅ | ✅ |
| `Search` | ✅ | ✅ |
| `CompleteRegistration` | ✅ | ✅ |

### Parameter Completeness

| Event | `content_type` | `content_ids` | `value` | `currency` | `content_name` | `num_items` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `ViewContent` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `AddToCart` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `InitiateCheckout` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Purchase` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Lead` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Search` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `CompleteRegistration` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Architecture

This variant uses a server-side proxy hosted on Vercel to manage Meta Conversions API events. The browser sends pixel events directly to Meta, and simultaneously sends server events to the Vercel proxy (`/api/capi/event`). The proxy enriches the event with IP address and User Agent, hashes PII fields using SHA-256, and then securely forwards it to the Conversions API using a server-side access token. This architecture ensures that the `access_token` is never exposed to the client.

### How to Use This Variant

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mishaberman/demo-ecommerce-excellent.git
    ```
2.  **Explore the code:**
    -   Frontend pixel implementation is in the root HTML files.
    -   Server-side proxy logic is in the `/api/capi` directory.
3.  **Test the live site:**
    -   Visit the [live site](https://mishaberman.github.io/demo-ecommerce-excellent/).
    -   Use the Meta Pixel Helper extension to observe pixel events.
    -   Monitor network requests to the Vercel proxy to see CAPI payloads.
