const https = require('https');

function supabaseGet(supabaseUrl, serviceKey, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(supabaseUrl);
    const options = {
      hostname: url.hostname,
      path: `/rest/v1${path}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) return res.status(500).json({ error: 'Supabase not configured' });

  const email = req.query?.email || new URL(req.url, 'https://x').searchParams.get('email');
  if (!email) return res.status(400).json({ error: 'email query param required' });

  try {
    const result = await supabaseGet(
      supabaseUrl, serviceKey,
      `/sessions?user_email=eq.${encodeURIComponent(email)}&status=eq.in_progress&order=started_at.desc&limit=1&select=id,app_name,app_slug,chat_history,status,started_at`
    );

    if (result.statusCode !== 200) {
      console.error('Supabase load error:', result.body);
      return res.status(500).json({ error: 'Database error' });
    }

    const sessions = Array.isArray(result.body) ? result.body : [];
    return res.status(200).json({
      session: sessions.length > 0 ? sessions[0] : null,
    });
  } catch(e) {
    console.error('load-session error:', e);
    return res.status(500).json({ error: e.message });
  }
};
