/**
 * Google Apps Script — receives a lead from the Cloudflare Function
 * and appends it as a row in your Google Sheet.
 *
 * SETUP (see whatsapp-setup.md for screenshots-level detail):
 * 1. Create a Google Sheet. In row 1 add headers:
 *    submittedAt | cover | company | email | phone | industry | employees | sumInsured | estimate | page
 * 2. Extensions → Apps Script. Delete any code, paste THIS file. Save.
 * 3. Deploy → New deployment → type "Web app".
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    Copy the Web app URL → put it in Cloudflare env var SHEET_WEBHOOK_URL.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.cover || '',
      data.company || '',
      data.email || '',
      data.phone || '',
      data.industry || '',
      data.employees || '',
      data.sumInsured || '',
      data.estimate || '',
      data.page || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
