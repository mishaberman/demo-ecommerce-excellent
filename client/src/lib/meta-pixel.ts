/**
 * Meta Pixel & Conversions API Helper — EXCELLENT Implementation
 * 
 * Near-best-practice implementation with:
 * - Real pixel ID with advanced matching
 * - event_id for pixel/CAPI deduplication
 * - SHA-256 hashing of PII
 * - fbc/fbp cookie capture
 * - Complete event parameters
 * - data_processing_options for compliance
 * - Search event implemented
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

const PIXEL_ID = '1684145446350033';
const CAPI_ACCESS_TOKEN = 'EAAEDq1LHx1gBRPAEq5cUOKS5JrrvMif65SN8ysCUrX5t0SUZB3ETInM6Pt71VHea0bowwEehinD0oZAeSmIPWivziiVu0FuEIcsmgvT3fiqZADKQDiFgKdsugONbJXELgvLuQxHT0krELKt3DPhm0EyUa44iXu8uaZBZBddgVmEnFdNMBmsWmYJdOT17DTitYKwZDZD';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function generateEventId(): string {
  return 'eid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : undefined;
}

async function hashSHA256(value: string): Promise<string> {
  if (!value || value.trim() === '') return '';
  const normalized = value.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
// CONVERSIONS API
// ============================================================

interface CAPIEventData { [key: string]: unknown; }

async function sendCAPIEvent(eventName: string, eventData: CAPIEventData, eventId: string) {
  const userData: Record<string, unknown> = {
    client_user_agent: navigator.userAgent,
    fbc: getCookie('_fbc') || undefined,
    fbp: getCookie('_fbp') || undefined,
  };

  if (_userData.em) userData.em = [await hashSHA256(_userData.em)];
  if (_userData.ph) userData.ph = [await hashSHA256(_userData.ph)];
  if (_userData.fn) userData.fn = [await hashSHA256(_userData.fn)];
  if (_userData.ln) userData.ln = [await hashSHA256(_userData.ln)];
  if (_userData.ct) userData.ct = [await hashSHA256(_userData.ct)];
  if (_userData.st) userData.st = [await hashSHA256(_userData.st)];
  if (_userData.zp) userData.zp = [await hashSHA256(_userData.zp)];
  if (_userData.external_id) userData.external_id = [await hashSHA256(_userData.external_id)];

  Object.keys(userData).forEach(key => { if (userData[key] === undefined) delete userData[key]; });

  const payload = {
    data: [{
      event_name: eventName, event_time: Math.floor(Date.now() / 1000),
      event_id: eventId, action_source: 'website', event_source_url: window.location.href,
      user_data: userData, custom_data: eventData,
      data_processing_options: [], data_processing_options_country: 0, data_processing_options_state: 0,
    }],
    access_token: CAPI_ACCESS_TOKEN,
  };

  const capiEndpoint = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;

  try {
    const response = await fetch(capiEndpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    console.log(`[CAPI] Sent ${eventName} (event_id: ${eventId}):`, result);
  } catch (err) {
    console.error(`[CAPI] Failed to send ${eventName}:`, err);
  }
}
