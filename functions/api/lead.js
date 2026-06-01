// Cloudflare Pages Function — runs at POST /api/lead
// Receives a lead from the quote form, appends it to a Google Sheet,
// and sends a WhatsApp notification to your team via Meta's Cloud API.
//
// Configure these as Environment Variables in the Cloudflare Pages dashboard
// (Settings → Environment variables). NONE of them live in this file:
//   SHEET_WEBHOOK_URL   - the Google Apps Script web-app URL (see whatsapp-setup.md)
//   WA_TOKEN            - Meta WhatsApp Cloud API permanent access token
//   WA_PHONE_ID         - your WhatsApp Business phone number ID (from Meta)
//   WA_TO               - destination number(s) in intl format, comma-separated, e.g. 6281234567890
//   WA_TEMPLATE         - (optional) approved template name; if set, sends a template message

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  let lead;
  try {
    lead = await request.json();
  } catch (e) {
    return json({ ok: false, error: 'Invalid JSON' }, 400, cors);
  }

  // --- Basic validation / spam guard ---
  if (!lead || (!lead.email && !lead.phone)) {
    return json({ ok: false, error: 'Email or phone required' }, 422, cors);
  }

  const safe = (s) => String(s == null ? '' : s).slice(0, 300);
  const data = {
    submittedAt: safe(lead.submittedAt) || new Date().toISOString(),
    cover: safe(lead.cover),
    company: safe(lead.company),
    email: safe(lead.email),
    phone: safe(lead.phone),
    industry: safe(lead.industry),
    employees: safe(lead.employees),
    sumInsured: safe(lead.sumInsured),
    estimate: safe(lead.estimate),
    page: safe(lead.page)
  };

  const results = { sheet: null, whatsapp: null };

  // --- 1) Append to Google Sheet (via Apps Script web app) ---
  if (env.SHEET_WEBHOOK_URL) {
    try {
      const r = await fetch(env.SHEET_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      results.sheet = r.ok ? 'ok' : ('http ' + r.status);
    } catch (e) {
      results.sheet = 'error: ' + e.message;
    }
  } else {
    results.sheet = 'skipped (SHEET_WEBHOOK_URL not set)';
  }

  // --- 2) Send WhatsApp notification via Meta Cloud API ---
  if (env.WA_TOKEN && env.WA_PHONE_ID && env.WA_TO) {
    const recipients = env.WA_TO.split(',').map((s) => s.trim()).filter(Boolean);
    const summary =
      `🐳 New Insurewise lead\n` +
      `Cover: ${data.cover}\n` +
      `Company: ${data.company || '-'}\n` +
      `Email: ${data.email || '-'}\n` +
      `Phone: ${data.phone || '-'}\n` +
      `Industry: ${data.industry}\n` +
      `Employees: ${data.employees}\n` +
      `Sum insured: ${data.sumInsured}\n` +
      `Est. premium: ${data.estimate}`;

    results.whatsapp = [];
    for (const to of recipients) {
      const body = env.WA_TEMPLATE
        ? {
            messaging_product: 'whatsapp',
            to,
            type: 'template',
            template: {
              name: env.WA_TEMPLATE,
              language: { code: 'en' },
              components: [
                { type: 'body', parameters: [
                  { type: 'text', text: data.cover || '-' },
                  { type: 'text', text: data.company || '-' },
                  { type: 'text', text: (data.email || data.phone || '-') }
                ] }
              ]
            }
          }
        : {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: summary }
          };
      try {
        const r = await fetch(`https://graph.facebook.com/v21.0/${env.WA_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.WA_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        results.whatsapp.push(r.ok ? ('ok:' + to) : ('http ' + r.status + ':' + to));
      } catch (e) {
        results.whatsapp.push('error:' + e.message);
      }
    }
  } else {
    results.whatsapp = 'skipped (WA_* env vars not set)';
  }

  return json({ ok: true, results }, 200, cors);
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, extra || {})
  });
}
