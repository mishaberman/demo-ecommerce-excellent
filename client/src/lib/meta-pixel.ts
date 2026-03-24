/**
 * Meta Pixel & Conversions API Helper — EXCELLENT Implementation
 * 
 * Near-best-practice implementation with:
 * - Real pixel ID with advanced matching
 * - event_id for pixel/CAPI deduplication
 * - Server-side CAPI via backend proxy (access token NOT exposed client-side)
 * - fbc/fbp cookie capture sent to server for enrichment
 * - Complete event parameters
 * - data_processing_options for compliance
 * - Search event implemented
 * - Server handles: SHA-256 hashing, IP extraction, user agent injection
 * 
 * CAPI METHOD: Server-Side Proxy
 *   Frontend sends raw PII + event data to backend CAPI proxy.
 *   Backend handles hashing, IP/UA enrichment, and forwards to Meta Graph API.
 *   Access token is stored server-side only — never exposed to the browser.
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = '1684145446350033';

// CAPI Backend Proxy URL — access token is stored server-side only
const CAPI_PROXY_URL = 'https://demoshop-fpx9kus8.manus.space/api/capi/event';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateEventId(): string {
  // Use crypto.randomUUID when available for stronger uniqueness
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'eid_' + crypto.randomUUID();
  }
  return 'eid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

let _userData: {
  em?: string; ph?: string; fn?: string; ln?: string;
  ct?: string; st?: string; zp?: string; external_id?: string;
} = {};

export function setUserData(data: {
  email?: string; phone?: string; firstName?: string; lastName?: string;
  city?: string; state?: string; zipCode?: string; externalId?: string;
}) {
  if (data.email) _userData.em = data.email;
  if (data.phone) _userData.ph = data.phone;
  if (data.firstName) _userData.fn = data.firstName;
  if (data.lastName) _userData.ln = data.lastName;
  if (data.city) _userData.ct = data.city;
  if (data.state) _userData.st = data.state;
  if (data.zipCode) _userData.zp = data.zipCode;
  if (data.externalId) _userData.external_id = data.externalId;
}

// ============================================================
// PIXEL EVENTS
// ============================================================

export function trackPixelEvent(eventName: string, params?: Record<string, unknown>): string {
  const eventId = generateEventId();
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params, { eventID: eventId });
    console.log(`[Meta Pixel] Tracked: ${eventName} (event_id: ${eventId})`, params);
  }
  return eventId;
}

export function trackCustomEvent(eventName: string, params?: Record<string, unknown>): string {
  const eventId = generateEventId();
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, params, { eventID: eventId });
    console.log(`[Meta Pixel] Custom tracked: ${eventName} (event_id: ${eventId})`, params);
  }
  return eventId;
}

export function trackViewContent(productId: string, productName: string, value: number, currency: string, category?: string) {
  const params = {
    content_ids: [productId], content_type: 'product', content_name: productName,
    content_category: category || 'Uncategorized', value, currency,
  };
  const eventId = trackPixelEvent('ViewContent', params);
  sendCAPIEvent('ViewContent', params, eventId);
}

export function trackAddToCart(productId: string, productName: string, value: number, currency: string, quantity: number) {
  const params = {
    content_ids: [productId], content_type: 'product', content_name: productName,
    value, currency, num_items: quantity,
  };
  const eventId = trackPixelEvent('AddToCart', params);
  sendCAPIEvent('AddToCart', params, eventId);
}

export function trackInitiateCheckout(value: number, currency: string, numItems: number, contentIds?: string[]) {
  const params = {
    value, currency, num_items: numItems,
    content_ids: contentIds || [], content_type: 'product',
  };
  const eventId = trackPixelEvent('InitiateCheckout', params);
  sendCAPIEvent('InitiateCheckout', params, eventId);
}

export function trackPurchase(value: number, currency: string, contentIds: string[], numItems?: number) {
  const params = {
    value, currency, content_ids: contentIds,
    content_type: 'product', num_items: numItems || contentIds.length,
  };
  const eventId = trackPixelEvent('Purchase', params);
  sendCAPIEvent('Purchase', params, eventId);
}

export function trackLead(formType?: string, value?: number, currency?: string) {
  const params = { content_name: formType || 'lead_form', value: value || 0, currency: currency || 'USD' };
  const eventId = trackPixelEvent('Lead', params);
  sendCAPIEvent('Lead', params, eventId);
}

export function trackCompleteRegistration(method?: string, value?: number, currency?: string) {
  const params = { content_name: 'registration', status: method || 'complete', value: value || 0, currency: currency || 'USD' };
  const eventId = trackPixelEvent('CompleteRegistration', params);
  sendCAPIEvent('CompleteRegistration', params, eventId);
}

export function trackContact(formType?: string) {
  const params = { content_name: formType || 'contact_form' };
  const eventId = trackPixelEvent('Contact', params);
  sendCAPIEvent('Contact', params, eventId);
}

export function trackSearch(searchString: string, contentIds?: string[], value?: number, currency?: string) {
  const params = {
    search_string: searchString, content_ids: contentIds || [],
    content_type: 'product', value: value || 0, currency: currency || 'USD',
  };
  const eventId = trackPixelEvent('Search', params);
  sendCAPIEvent('Search', params, eventId);
}

// ============================================================
// CONVERSIONS API — Server-Side Proxy
// ============================================================

interface CAPIEventData { [key: string]: unknown; }

/**
 * Send event to the backend CAPI proxy server.
 * 
 * The backend handles:
 * - SHA-256 hashing of all PII (em, ph, fn, ln, ct, st, zp)
 * - Injection of client_ip_address from request headers
 * - Injection of client_user_agent from request headers
 * - Secure storage of access_token (never exposed to browser)
 * - Forwarding to Meta Graph API
 * 
 * The frontend sends:
 * - Raw (unhashed) PII for server-side hashing
 * - fbc/fbp cookies for identity matching
 * - event_id for deduplication with pixel events
 * - data_processing_options for CCPA/GDPR compliance
 */
async function sendCAPIEvent(eventName: string, eventData: CAPIEventData, eventId: string) {
  // Build user_data with raw PII — server will hash it
  const userData: Record<string, unknown> = {
    // fbc and fbp cookies for identity matching
    fbc: getCookie('_fbc') || undefined,
    fbp: getCookie('_fbp') || undefined,
  };

  // Send raw PII — the server will normalize and SHA-256 hash these
  if (_userData.em) userData.em = _userData.em;
  if (_userData.ph) userData.ph = _userData.ph;
  if (_userData.fn) userData.fn = _userData.fn;
  if (_userData.ln) userData.ln = _userData.ln;
  if (_userData.ct) userData.ct = _userData.ct;
  if (_userData.st) userData.st = _userData.st;
  if (_userData.zp) userData.zp = _userData.zp;
  if (_userData.external_id) userData.external_id = _userData.external_id;

  // Remove undefined values
  Object.keys(userData).forEach(key => { if (userData[key] === undefined) delete userData[key]; });

  const payload = {
    event_name: eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: window.location.href,
    user_data: userData,
    custom_data: eventData,
    // CCPA/GDPR compliance — empty array means no restrictions
    data_processing_options: [],
    data_processing_options_country: 0,
    data_processing_options_state: 0,
  };

  try {
    const response = await fetch(CAPI_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log(`[CAPI Server] Sent ${eventName} (event_id: ${eventId}):`, result);
  } catch (err) {
    console.error(`[CAPI Server] Failed to send ${eventName}:`, err);
  }
}
