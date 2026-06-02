# Lead capture + WhatsApp setup (simple version)

No backend needed. Two independent pieces:

1. **WhatsApp** — a `wa.me` click-to-chat link. When a visitor finishes the quote,
   the "Continue on WhatsApp" button opens *their* WhatsApp with all their quote
   details pre-filled, sending to your business number. There's also a floating
   WhatsApp button on every page.
2. **Google Sheet** — every completed quote is logged as a row (optional but
   recommended, so you have leads even if they don't tap WhatsApp).

---

## Part 1 — WhatsApp (required, 1 line)

Open **`js/main.js`** and edit the number near the top:

```js
window.IW_WA_NUMBER = "62XXXXXXXXXXX";   // <-- your number
```

Format: international, **digits only**, no `+` or spaces.
Example: `+62 812-3456-7890` becomes `6281234567890`.

That's it. This powers both the floating button and the quote-page button.
(Until you replace the `X`s, the floating button stays hidden and the quote
button still appears but points to a placeholder.)

---

## Part 2 — Google Sheet (optional, ~5 min)

1. Create a new Google Sheet. In **row 1**, add these headers exactly:
   `submittedAt | cover | company | email | phone | industry | employees | sumInsured | estimate | page`
2. **Extensions → Apps Script**. Delete the sample code, paste the contents of
   `functions/google-apps-script.gs`, click **Save**.
3. **Deploy → New deployment** → gear icon → **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Click **Deploy**, authorise when asked, and **copy the Web app URL**
     (looks like `https://script.google.com/macros/s/AKfy.../exec`).
4. Open **`js/quote.js`** and paste that URL:

```js
var SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfy.../exec";
```

Done. Completed quotes now append to your sheet automatically.

---

## Test

1. Open the live site → **Get a quote** → complete all steps.
2. The result screen shows the estimate + a green **Continue on WhatsApp** button.
   Tapping it opens WhatsApp with the lead details pre-filled.
3. If you set up the sheet, a new row appears in it within a few seconds.

Nothing breaks for the visitor if the sheet isn't configured — they still get
their estimate and the WhatsApp button.

---

## Notes
- The `wa.me` link relies on the visitor tapping **send** in their WhatsApp.
  The Google Sheet captures the lead regardless, so you don't lose anyone who
  doesn't complete the chat.
- Want auto-replies or server-sent WhatsApp messages later? That needs Meta's
  Cloud API (a bigger setup) — ask and we can add it.
