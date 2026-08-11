const https = require('https');

function resendRequest(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  try {
    let body;
    if (typeof req.body === 'object') {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      body = JSON.parse(Buffer.concat(chunks).toString());
    }

    const { subject, message, testerName, testerEmail } = body;

    const result = await resendRequest(apiKey, {
      from: 'carol@kaizanaistudios.com',
      to:   'carol@kaizanaistudios.com',
      subject: subject || `Kaizan Clarity Beta Feedback — ${testerName || 'Anonymous'}`,
      text: message,
      reply_to: testerEmail || 'carol@kaizanaistudios.com',
    });

    if (result.statusCode >= 200 && result.statusCode < 300) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Resend error:', result.body);
      return res.status(result.statusCode).json({ error: result.body });
    }
  } catch (e) {
    console.error('submit-feedback error:', e);
    return res.status(500).json({ error: e.message });
  }
};
