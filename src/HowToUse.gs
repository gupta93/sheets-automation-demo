/**
 * Generates a friendly “How to use” tab for non-technical users.
 */

function refreshHowToUseTab() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet_(ss, TAB_HOW_TO);
  sheet.clear();

  var lines = [
    ['How to use this sales sheet automation'],
    [''],
    ['What it does'],
    [
      'This spreadsheet can clean your raw sales list, remove duplicates, flag bad rows, and build a weekly summary with week-over-week changes.',
    ],
    [''],
    ['Quick start'],
    ['1. Put your data on the “Raw” tab (same column headers as the sample).'],
    ['2. Click Sales automation → Run clean & weekly summary.'],
    ['3. Check “Cleaned”, “Invalid Rows”, and “Weekly Summary”.'],
    [''],
    ['Sample data'],
    [
      'Import the file data/sample_sales.csv from the GitHub project, or copy/paste those rows into Raw.',
    ],
    [''],
    ['Weekly automatic run'],
    [
      'Choose Sales automation → Install weekly trigger (Mondays 8am) to refresh every Monday morning.',
    ],
    [''],
    ['Email (optional, off by default)'],
    [
      'In Extensions → Apps Script, run setEmailSummaryTo("your@email.com") once, then setEmailSummaryEnabled(true). Set false to turn off.',
    ],
    [''],
    ['Need help?'],
    [
      'See the README in the GitHub repository for step-by-step setup with clasp or copy-paste.',
    ],
  ];

  sheet.getRange(1, 1, lines.length, 1).setValues(lines);
  sheet.getRange(1, 1).setFontWeight('bold').setFontSize(14);
  sheet.setColumnWidth(1, 520);
}
