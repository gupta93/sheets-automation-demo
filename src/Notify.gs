/**
 * User-visible messages: UI when opened from the sheet, Logger when run headless (e.g. time trigger).
 */

function notifyUser_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (_err) {
    Logger.log(message);
  }
}
