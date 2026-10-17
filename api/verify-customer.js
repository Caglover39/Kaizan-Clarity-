const https = require('https');

function supabaseRequest(supabaseUrl, serviceKey, method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: url.hostname,
      path: `/rest/v1${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(responseData) }); }
        catch(e) { resolve({ statusCode: res.statusCode, body: responseData }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase not configured' });

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
    if (!email) return res.status(400).json({ error: 'email required' });

    const result = await supabaseRequest(
      supabaseUrl, serviceKey,
      'GET',
      `/users?email=eq.${encodeURIComponent(email)}&select=email,paid_at,stripe_session_id`,
      null
    );

    if (result.statusCode !== 200) {
      console.error('Supabase error:', result.body);
      return res.status(500).json({ error: 'Database error' });
    }

    const users = Array.isArray(result.body) ? result.body : [];
    if (users.length === 0) {
      return res.status(200).json({ paid: false });
    }

    const user = users[0];
    return res.status(200).json({
      paid: !!user.paid_at,
      paidAt: user.paid_at,
      email: user.email,
    });
  } catch(e) {
    console.error('verify-customer error:', e);
    return res.status(500).json({ error: e.message });
  }
};
