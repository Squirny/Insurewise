# Lead capture + WhatsApp setup

This connects the quote form to a **Google Sheet** (every lead is logged) and a
**WhatsApp** notification to your team (via Meta's Cloud API).

How it flows:

```
Quote form  →  POST /api/lead  →  ① append row to Google Sheet
(browser)      (Cloudflare         ② send WhatsApp message to your team
                Pages Function)
```

You don't touch any code — you just create accounts and paste values into
**Cloudflare → your Pages project → Settings → Environment variables**.

---

## Part A — Google Sheet (lead log)

1. Create a new Google Sheet. In **row 1**, add these column headers exactly:
   `submittedAt | cover | company | email | phone | industry | employees | sumInsured | estimate | page`
2. **Extensions → Apps Script**. Delete the sample code, paste the contents of
   `functions/google-apps-script.gs`, and click **Save**.
3. **Deploy → New deployment**. Click the gear → choose **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Click **Deploy**, authorise when prompted, and **copy the Web app URL**
     (looks like `https://script.google.com/macros/s/AKfy.../exec`).
4. In Cloudflare, set env var **`SHEET_WEBHOOK_URL`** = that URL.

That alone makes leads land in your sheet. WhatsApp is Part B.

---

## Part B — WhatsApp Cloud API (team notification)

This is Meta's official API. The token must stay on the server (our Cloudflare
Function holds it), never in the website.

1. Go to **https://developers.facebook.com** → log in → **My Apps → Create App**
   → type **Business**.
2. In the app, add the **WhatsApp** product. Meta gives you a free **test
   phone number** to start (good enough to test notifications to yourself).
3. From the WhatsApp → **API Setup** page, copy:
   - **Phone number ID** → Cloudflare env var **`WA_PHONE_ID`**
   - **Temporary access token** → env var **`WA_TOKEN`** (for testing; see note below)
4. Add the team number(s) that should RECEIVE alerts:
   - On the API Setup page, under "To", add and verify each recipient number.
   - Put them in env var **`WA_TO`** in international format, no `+`,
     comma-separated. Example: `6281234567890,6289876543210`.
5. Save all env vars in Cloudflare and **redeploy** the Pages project.

### Going live (permanent)
- The temporary token expires in 24h. For production, create a **System User**
  in **business.facebook.com → Business settings → Users → System users**,
  generate a **permanent token** with `whatsapp_business_messaging` permission,
  and use that as `WA_TOKEN`.
- Add and **verify your real business phone number** in WhatsApp Manager.
- **Important rule:** WhatsApp only lets a business send *freeform* text to a
  user within 24h of that user messaging you first. Since YOUR team is the
  recipient and you control those numbers, the simple text alert works as long
  as your team has messaged the business number once. If that's unreliable,
  set env var **`WA_TEMPLATE`** to an **approved template name** and the
  function will send a template instead (templates can be sent anytime).
  Create templates in WhatsApp Manager → Message templates.

---

## Cloudflare environment variables — summary

| Variable | Required | Example | What it is |
|---|---|---|---|
| `SHEET_WEBHOOK_URL` | for Sheet | `https://script.google.com/macros/s/AK.../exec` | Apps Script web-app URL |
| `WA_TOKEN` | for WhatsApp | `EAAG...` | Meta Cloud API access token |
| `WA_PHONE_ID` | for WhatsApp | `123456789012345` | Your WhatsApp phone number ID |
| `WA_TO` | for WhatsApp | `6281234567890` | Who receives alerts (intl, no +) |
| `WA_TEMPLATE` | optional | `new_lead_alert` | Approved template name (if used) |

Set them under **Cloudflare Pages → your project → Settings → Environment
variables → Production** (and Preview if you want test deploys to work too).
After changing env vars, trigger a redeploy.

---

## Testing

1. Deploy the site with at least `SHEET_WEBHOOK_URL` set.
2. Open the live site → **Get a quote** → complete the form.
3. Check your Google Sheet — a new row should appear.
4. With the `WA_*` vars set, your team WhatsApp should get the alert too.
5. To debug, the endpoint returns JSON like
   `{"ok":true,"results":{"sheet":"ok","whatsapp":["ok:6281..."]}}`.
   You can inspect it in the browser dev-tools Network tab on the `/api/lead` call.

Nothing breaks for the visitor if these aren't configured yet — they still see
their estimate; the lead send just silently no-ops until the env vars exist.
