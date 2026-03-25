const axios = require('axios');
const crypto = require('crypto');

const PIXEL_ID = process.env.META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;

async function sendCapiEvent(eventName, eventData) {
  const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: eventData.event_source_url,
        event_id: eventData.event_id,
        user_data: {
          em: eventData.email ? crypto.createHash('sha256').update(eventData.email).digest('hex') : undefined,
          ph: eventData.phone ? crypto.createHash('sha256').update(eventData.phone).digest('hex') : undefined,
          fn: eventData.firstName ? crypto.createHash('sha256').update(eventData.firstName).digest('hex') : undefined,
          ln: eventData.lastName ? crypto.createHash('sha256').update(eventData.lastName).digest('hex') : undefined,
          client_ip_address: eventData.ip_address,
          client_user_agent: eventData.user_agent,
          fbp: eventData.fbp,
          fbc: eventData.fbc,
        },
        custom_data: eventData.custom_data,
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE,
  };

  try {
    const response = await axios.post(url, payload, {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    });
    console.log('CAPI event sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending CAPI event:', error.response.data);
  }
}

module.exports = { sendCapiEvent };
