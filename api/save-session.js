const https = require('https');

function supabaseRequest(supabaseUrl, serviceKey, method, path, body, extraHeaders) {
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
        ...(extraHeaders || {}),
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

    const { email, sessionId, appName, appSlug, chatHistory, status } = body;
    if (!email || !chatHistory) return res.status(400).json({ error: 'email and chatHistory required' });

    let result;

    if (sessionId) {
      // Update existing session
      result = await supabaseRequest(
        supabaseUrl, serviceKey,
        'PATCH',
        `/sessions?id=eq.${sessionId}`,
        {
          chat_history: chatHistory,
          status: status || 'in_progress',
          ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        },
        { 'Prefer': 'return=representation' }
      );
    } else {
      // Insert new session
      result = await supabaseRequest(
        supabaseUrl, serviceKey,
        'POST',
        '/sessions',
        {
          user_email: email,
          app_name:  appName  || 'Kaizan Clarity',
          app_slug:  appSlug  || 'clarity',
          chat_history: chatHistory,
          status: status || 'in_progress',
        },
        { 'Prefer': 'return=representation' }
      );
    }

    if (result.statusCode >= 200 && result.statusCode < 300) {
      const saved = Array.isArray(result.body) ? result.body[0] : result.body;
      return res.status(200).json({ success: true, sessionId: saved?.id || sessionId });
    } else {
      console.error('Supabase save error:', result.body);
      return res.status(500).json({ error: 'Failed to save session' });
    }
  } catch(e) {
    console.error('save-session error:', e);
    return res.status(500).json({ error: e.message });
  }
};
