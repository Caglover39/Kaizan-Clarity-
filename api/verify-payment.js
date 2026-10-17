const https = require('https');

function stripeGet(secretKey, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.stripe.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
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
    req.end();
  });
}

function supabaseUpsertUser(supabaseUrl, serviceKey, email, stripeSessionId) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);
    const data = JSON.stringify({
      email,
      stripe_session_id: stripeSessionId,
      paid_at: new Date().toISOString(),
    });
    const options = {
      hostname: url.hostname,
      path: '/rest/v1/users',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' });

  const sessionId = req.query?.session_id || new URL(req.url, 'https://x').searchParams.get('session_id');
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return res.status(400).json({ error: 'Invalid session_id' });
  }

  try {
    const result = await stripeGet(secretKey, `/v1/checkout/sessions/${sessionId}`);

    if (result.statusCode !== 200) {
      console.error('Stripe verify error:', result.body);
      return res.status(result.statusCode).json({ error: result.body?.error?.message || 'Stripe error' });
    }

    const session = result.body;
    const paid    = session.payment_status === 'paid';
    const email   = session.customer_email || session.customer_details?.email || '';

    // Write paid user to Supabase (best-effort — don't fail if Supabase is down)
    if (paid && email) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
      if (supabaseUrl && serviceKey) {
        try {
          await supabaseUpsertUser(supabaseUrl, serviceKey, email, sessionId);
        } catch(dbErr) {
          console.error('Supabase upsert warning (non-fatal):', dbErr.message);
        }
      }
    }

    return res.status(200).json({ paid, email, sessionId });
  } catch(e) {
    console.error('verify-payment error:', e);
    return res.status(500).json({ error: e.message });
  }
};
