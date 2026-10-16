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

function scoreBadgeColor(score) {
  if (score >= 75) return '#3ac97a';   // green
  if (score >= 60) return '#b9a8ff';   // accent purple
  return '#f9a84d';                    // amber
}

function scoreBadgeLabel(score) {
  if (score >= 75) return 'Strong Idea';
  if (score >= 60) return 'Solid Potential';
  return 'Needs Work';
}

function buildTextReport(data) {
  const { appName, overall, dimensions, keyInsight, strengths, risks } = data;
  const label = scoreBadgeLabel(overall);
  const divider = '─'.repeat(60);

  let txt = `KAIZAN CLARITY — VIABILITY ASSESSMENT\n${divider}\n\n`;
  txt += `App Idea:  ${appName || 'Your App Idea'}\n`;
  txt += `Score:     ${overall}/100  (${label})\n\n`;
  txt += `${divider}\nDIMENSION SCORES\n${divider}\n\n`;

  (dimensions || []).forEach(dim => {
    const bar = '█'.repeat(Math.round(dim.score / 5)) + '░'.repeat(20 - Math.round(dim.score / 5));
    txt += `${dim.name.padEnd(26)} ${String(dim.score).padStart(3)}/100\n`;
    txt += `[${bar}]\n`;
    txt += `${dim.insight}\n\n`;
  });

  txt += `${divider}\nKEY INSIGHT\n${divider}\n\n${keyInsight || ''}\n\n`;

  txt += `${divider}\nSTRENGTHS\n${divider}\n\n`;
  (strengths || []).forEach(s => { txt += `✓  ${s}\n`; });

  txt += `\n${divider}\nRISKS TO ADDRESS\n${divider}\n\n`;
  (risks || []).forEach(r => { txt += `△  ${r}\n`; });

  txt += `\n${divider}\nREADY TO BUILD?\n${divider}\n\n`;
  txt += `Get your complete 5-document build plan — PRD, Prompt Build Sequence,\n`;
  txt += `Tech Integration Guide, Niche Analysis, and Marketing Messaging.\n\n`;
  txt += `Unlock My Full Plan — $37\nhttps://www.kaizanclarity.com/#pricing\n\n`;
  txt += `${divider}\nKaizan Clarity · Kaizan AI Studios · kaizanclarity.com\n`;

  return txt;
}

function buildHtmlEmail(data) {
  const { appName, overall, dimensions, keyInsight, strengths, risks } = data;
  const badgeColor = scoreBadgeColor(overall);
  const badgeLabel = scoreBadgeLabel(overall);

  const dimensionRows = (dimensions || []).map(dim => {
    const color = scoreBadgeColor(dim.score);
    const barWidth = Math.min(dim.score, 100);
    return `
      <tr>
        <td style="padding:0 0 18px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#e8e4f0;padding-bottom:6px;">${dim.name}</td>
              <td align="right" style="font-family:monospace;font-size:12px;font-weight:600;color:${color};padding-bottom:6px;">${dim.score}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding-bottom:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="${barWidth}%" height="4" style="background:${color};border-radius:2px;font-size:0;">&nbsp;</td>
                    <td width="${100 - barWidth}%" height="4" style="background:#2a2738;border-radius:2px;font-size:0;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#8c82a8;line-height:1.6;">${dim.insight}</td>
            </tr>
          </table>
        </td>
      </tr>`;
  }).join('');

  const strengthItems = (strengths || []).map(s =>
    `<tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#a8a4c0;line-height:1.6;padding:6px 0;border-bottom:1px solid #2a2738;">&#10003;&nbsp; ${s}</td></tr>`
  ).join('');

  const riskItems = (risks || []).map(r =>
    `<tr><td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#a8a4c0;line-height:1.6;padding:6px 0;border-bottom:1px solid #2a2738;">&#9651;&nbsp; ${r}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0c0b10;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0b10;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0" border="0">

      <!-- Header -->
      <tr><td style="padding-bottom:28px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size:16px;color:#b9a8ff;padding-right:8px;">&#10022;</td>
            <td style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;color:#e8e4f0;letter-spacing:-0.2px;">Kaizan Clarity</td>
          </tr>
        </table>
      </td></tr>

      <!-- Report card -->
      <tr><td style="background:#18162a;border:1px solid #2a2738;border-radius:12px;padding:36px 32px;">

        <!-- Eyebrow -->
        <p style="margin:0 0 8px;font-family:monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.12em;color:#b9a8ff;">Viability Assessment</p>

        <!-- App name -->
        <h1 style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#e8e4f0;line-height:1.3;">${appName || 'Your App Idea'}</h1>

        <!-- Score -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td style="font-family:Georgia,'Times New Roman',serif;font-size:64px;font-weight:400;color:#b9a8ff;line-height:1;padding-right:6px;">${overall}</td>
            <td style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#4a4568;line-height:1;vertical-align:bottom;padding-bottom:6px;">/100</td>
            <td style="vertical-align:bottom;padding-bottom:10px;padding-left:14px;">
              <span style="font-family:monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:${badgeColor};background:rgba(255,255,255,.06);padding:4px 10px;border-radius:4px;">${badgeLabel}</span>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr><td height="1" style="background:#2a2738;font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Dimensions -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${dimensionRows}
        </table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
          <tr><td height="1" style="background:#2a2738;font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Key Insight -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0c0b10;border-left:3px solid #b9a8ff;border-radius:4px;margin-bottom:28px;">
          <tr><td style="padding:14px 16px;">
            <p style="margin:0 0 6px;font-family:monospace;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#b9a8ff;">Key Insight</p>
            <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#e8e4f0;line-height:1.65;">${keyInsight || ''}</p>
          </td></tr>
        </table>

        <!-- Strengths + Risks (stacked for email) -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td style="padding-bottom:20px;">
              <p style="margin:0 0 10px;font-family:monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.1em;color:#3ac97a;">Strengths</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">${strengthItems}</table>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0 0 10px;font-family:monospace;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.1em;color:#f9a84d;">Risks to Address</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">${riskItems}</table>
            </td>
          </tr>
        </table>

        <!-- Divider -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr><td height="1" style="background:#2a2738;font-size:0;">&nbsp;</td></tr>
        </table>

        <!-- Upgrade CTA -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td align="center" style="padding-bottom:14px;">
            <p style="margin:0 0 6px;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#b9a8ff;">Ready to build?</p>
            <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#e8e4f0;line-height:1.3;">Get your complete 5-document build plan</p>
            <p style="margin:0 0 20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#8c82a8;line-height:1.65;">PRD &middot; Prompt Build Sequence &middot; Tech Integration Guide &middot; Niche Analysis &middot; Marketing Messaging</p>
            <a href="https://www.kaizanclarity.com/#pricing" style="display:inline-block;background:#b9a8ff;color:#0c0b10;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:100px;">Unlock My Full Plan &mdash; $37 &rarr;</a>
          </td></tr>
          <tr><td align="center">
            <p style="margin:12px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#4a4568;">One-time payment &middot; No subscription &middot; Yours to keep</p>
          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:24px;text-align:center;">
        <p style="margin:0;font-family:monospace;font-size:10px;color:#4a4568;">Kaizan Clarity &middot; Kaizan AI Studios &middot; <a href="https://www.kaizanclarity.com" style="color:#4a4568;">kaizanclarity.com</a></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
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

    const { email, scoreData } = body;
    if (!email)     return res.status(400).json({ error: 'Email address required' });
    if (!scoreData) return res.status(400).json({ error: 'scoreData required' });

    const appName = scoreData.appName || 'Your App Idea';
    const appSlug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Build attachment — fall back gracefully if text generation fails
    let attachments = [];
    try {
      attachments = [{
        filename: `${appSlug}-viability-score.txt`,
        content:  Buffer.from(buildTextReport(scoreData), 'utf8').toString('base64'),
      }];
    } catch (attachErr) {
      console.error('Attachment build failed, sending without it:', attachErr);
    }

    // 1 — Send score report to user
    const emailPayload = {
      from:    'carol@kaizanaistudios.com',
      to:      email,
      subject: `Your Viability Score for ${appName} — Kaizan Clarity`,
      html:    buildHtmlEmail(scoreData),
    };
    if (attachments.length > 0) emailPayload.attachments = attachments;

    const userResult = await resendRequest(apiKey, emailPayload);

    // 2 — Notify Carol
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' });
    await resendRequest(apiKey, {
      from: 'carol@kaizanaistudios.com',
      to:   'caglover39@gmail.com',
      subject: `Kaizan Clarity — Viability Score completed by ${email}`,
      text:    `A user just completed a Viability Score.\n\nEmail: ${email}\nApp: ${appName}\nScore: ${scoreData.overall}/100\nLabel: ${scoreData.overall >= 75 ? 'Strong Idea' : scoreData.overall >= 60 ? 'Solid Potential' : 'Needs Work'}\nCompleted: ${timestamp}`,
    });

    if (userResult.statusCode >= 200 && userResult.statusCode < 300) {
      return res.status(200).json({ success: true });
    } else {
      console.error('Resend error:', userResult.body);
      return res.status(userResult.statusCode).json({ error: userResult.body });
    }
  } catch (e) {
    console.error('send-viability error:', e);
    return res.status(500).json({ error: e.message });
  }
};
