/**
 * Spreadsheet menu, triggers, and thin adapters over SpreadsheetApp.
 * Business logic lives in SalesAutomation.bundle.js (built from /core).
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(SalesAutomation.MENU_NAME)
    .addItem(SalesAutomation.MENU_ITEM_RUN, 'runSalesAutomationFromSheet')
    .addSeparator()
    .addItem('Install weekly trigger (Monday 8am)', 'installWeeklyTrigger')
    .addToUi();
}

function runSalesAutomationFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = runSalesAutomationWithSpreadsheet_(ss);
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Valid: ' +
      result.validCount +
      ', invalid: ' +
      result.invalidCount +
      ', duplicates removed: ' +
      result.duplicateCount,
    'Sales Automation',
    8,
  );
}

/** Entry point for time-driven triggers. */
function runSalesAutomation() {
  runSalesAutomationWithSpreadsheet_(SpreadsheetApp.getActiveSpreadsheet());
}

function installWeeklyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'runSalesAutomation') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  ScriptApp.newTrigger('runSalesAutomation')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
  SpreadsheetApp.getUi().alert('Weekly trigger installed for Monday at 8:00 (spreadsheet time zone).');
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 */
function runSalesAutomationWithSpreadsheet_(ss) {
  ensureRawSheet_(ss);
  const props = PropertiesService.getScriptProperties();

  return SalesAutomation.runSalesAutomation({
    readRawValues: function () {
      return ss.getSheetByName(SalesAutomation.SHEET_NAMES.RAW).getDataRange().getValues();
    },
    writeRaw: function (values) {
      writeSheetValues_(getOrCreateSheet_(ss, SalesAutomation.SHEET_NAMES.RAW), values);
    },
    writeSummary: function (values) {
      writeSheetValues_(getOrCreateSheet_(ss, SalesAutomation.SHEET_NAMES.SUMMARY), values);
    },
    writeHelp: function (values) {
      writeSheetValues_(getOrCreateSheet_(ss, SalesAutomation.SHEET_NAMES.HELP), values);
    },
    sendEmail: function (subject, body) {
      MailApp.sendEmail(props.getProperty(SalesAutomation.PROP_EMAIL_TO), subject, body);
    },
    getProperty: function (key) {
      return props.getProperty(key);
    },
  });
}

function ensureRawSheet_(ss) {
  const raw = getOrCreateSheet_(ss, SalesAutomation.SHEET_NAMES.RAW);
  const firstRow = raw.getRange(1, 1, 1, SalesAutomation.RAW_HEADERS.length).getValues()[0];
  const needsHeader = firstRow.every(function (cell) {
    return String(cell).trim() === '';
  });
  if (needsHeader) {
    raw.getRange(1, 1, 1, SalesAutomation.RAW_HEADERS.length).setValues([SalesAutomation.RAW_HEADERS]);
  }
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {string} name
 */
function getOrCreateSheet_(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

/**
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {unknown[][]} values
 */
function writeSheetValues_(sheet, values) {
  sheet.clearContents();
  if (values.length === 0) return;
  sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  sheet.autoResizeColumns(1, values[0].length);
}
