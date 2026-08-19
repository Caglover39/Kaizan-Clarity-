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

    const { email, prd, sequence, integration, timestamp, appName, appSlug } = body;

    if (!email) return res.status(400).json({ error: 'Email address required' });

    // Use app name for filenames — fall back to 'my-app' if not provided
    const slug    = appSlug  || 'my-app';
    const display = appName  || 'Your App';

    const attachments = [];
    if (prd)         attachments.push({ filename: `${slug}-prd.txt`,                        content: Buffer.from(prd).toString('base64') });
    if (sequence)    attachments.push({ filename: `${slug}-prompt-build-sequence.txt`,       content: Buffer.from(sequence).toString('base64') });
    if (integration) attachments.push({ filename: `${slug}-tech-api-integration-guide.txt`, content: Buffer.from(integration).toString('base64') });

    // 1 — Send documents to tester
    const testerResult = await resendRequest(apiKey, {
      from: 'carol@kaizanaistudios.com',
      to:   email,
      subject: `Your ${display} Documents Are Ready — Kaizan Clarity`,
      text: `Hi there,\n\nYour Kaizan Clarity documents for ${display} are attached to this email:\n\n• Product Requirements Document (PRD)\n• Prompt Build Sequence (includes your Viability Assessment)\n• Tech/API Integration Guide\n\nPaste the prompts from your Prompt Build Sequence into Lovable one at a time, in order. Use your Tech/API Integration Guide when you reach integrations like Stripe or Supabase.\n\nIf you have any questions, reply to this email.\n\nBest,\nCarol\nFounder, Kaizan AI Studios\nkaizanaistudios.com`,
      attachments,
    });

    // 2 — Send confirmation to Carol
    const sessionTime = timestamp || new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    await resendRequest(apiKey, {
      from: 'carol@kaizanaistudios.com',
      to:   'caglover39@gmail.com',
      subject: `Kaizan Clarity — Session Completed by ${email}`,
      text: `A beta tester just completed a Kaizan Clarity session.\n\nEmail: ${email}\nApp: ${display}\nCompleted: ${sessionTime}\n\nDocuments were automatically sent to their email.`,
    });

    if (testerResult.statusCode >= 200 && testerResult.statusCode < 300) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Resend error:', testerResult.body);
      return res.status(testerResult.statusCode).json({ error: testerResult.body });
    }
  } catch (e) {
    console.error('send-documents error:', e);
    return res.status(500).json({ error: e.message });
  }
};
