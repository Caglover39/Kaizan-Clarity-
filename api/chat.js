const https = require('https');

function callClaude(apiKey, bodyString) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyString),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve({ statusCode: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    req.write(bodyString);
    req.end();
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'ANTHROPIC_API_KEY not set in Vercel environment variables.' }
    });
  }

  try {
    // Handle body — Vercel may parse it automatically or leave as stream
    let bodyString;
    if (typeof req.body === 'string') {
      bodyString = req.body;
    } else if (req.body && typeof req.body === 'object') {
      bodyString = JSON.stringify(req.body);
    } else {
      const chunks = [];
      for await (const chunk of req) { chunks.push(chunk); }
      bodyString = Buffer.concat(chunks).toString();
    }

    const result = await callClaude(apiKey, bodyString);
    return res.status(result.statusCode).send(result.body);

  } catch (error) {
    return res.status(500).json({ error: { message: error.message } });
  }
};
