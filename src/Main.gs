/**
 * Menu, triggers, and orchestration.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Sales automation')
    .addItem('Run clean & weekly summary', 'runCleanAndSummary')
    .addItem('Refresh “How to use” tab', 'refreshHowToUseTab')
    .addSeparator()
    .addItem('Install weekly trigger (Mondays 8am)', 'installWeeklyTrigger')
    .addItem('Remove weekly trigger', 'removeWeeklyTrigger')
    .addToUi();
}

function runCleanAndSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rawRows = readRawTab_(ss);
  if (rawRows.length === 0) {
    SpreadsheetApp.getUi().alert(
      'No data rows found on the “' +
        TAB_RAW +
        '” tab. Import sample CSV or add headers plus data.'
    );
    return;
  }

  var result = cleanSalesRows(rawRows);
  writeCleanedTab_(ss, result.cleaned);
  writeInvalidTab_(ss, result.invalid);

  var weekStart = latestWeekStart(result.cleaned);
  if (!weekStart) {
    SpreadsheetApp.getUi().alert('No valid dates after cleaning.');
    return;
  }

  var summaryRows = buildWeeklySummaryRows(result.cleaned, weekStart);
  writeSummaryTab_(ss, summaryRows);

  refreshHowToUseTab();

  maybeEmailSummary_(ss.getName(), summaryRows);

  SpreadsheetApp.getUi().alert(
    'Done. Cleaned ' +
      result.cleaned.length +
      ' row(s), flagged ' +
      result.invalid.length +
      ' invalid, removed ' +
      result.duplicatesRemoved +
      ' duplicate(s). Summary week starting ' +
      weekStart +
      '.'
  );
}

function installWeeklyTrigger() {
  removeWeeklyTrigger();
  ScriptApp.newTrigger('runCleanAndSummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
  SpreadsheetApp.getUi().alert(
    'Weekly trigger installed: every Monday at 8:00 AM (spreadsheet time zone).'
  );
}

function removeWeeklyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (t) {
    if (t.getHandlerFunction() === 'runCleanAndSummary') {
      ScriptApp.deleteTrigger(t);
    }
  });
}
