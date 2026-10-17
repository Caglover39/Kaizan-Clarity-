const https = require('https');
const querystring = require('querystring');

const PRICE_ID      = 'price_1URbqk3qTL1QZkeFN5zLbI6s';
const SUCCESS_URL   = 'https://www.kaizanclarity.com/?clarity_session={CHECKOUT_SESSION_ID}';
const CANCEL_URL    = 'https://www.kaizanclarity.com/';

function stripeRequest(secretKey, method, path, params) {
  return new Promise((resolve, reject) => {
    const body = params ? querystring.stringify(params) : '';
    const options = {
      hostname: 'api.stripe.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ statusCode: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });

  try {
    let body;
    if (typeof req.body === 'object') {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString());
    }

    const { email } = body;

    const params = {
      mode:                        'payment',
      'line_items[0][price]':      PRICE_ID,
      'line_items[0][quantity]':   '1',
      success_url:                 SUCCESS_URL,
      cancel_url:                  CANCEL_URL,
      'payment_intent_data[description]': 'Kaizan Clarity — 5-Document Build Plan',
    };
    if (email) params.customer_email = email;

    const result = await stripeRequest(secretKey, 'POST', '/v1/checkout/sessions', params);

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return res.status(200).json({ url: result.body.url });
    } else {
      console.error('Stripe error:', result.body);
      return res.status(result.statusCode).json({ error: result.body?.error?.message || 'Stripe error' });
    }
  } catch(e) {
    console.error('create-checkout error:', e);
    return res.status(500).json({ error: e.message });
  }
};
