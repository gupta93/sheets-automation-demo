/**
 * Read/write spreadsheet tabs (Google APIs only here).
 */

function readRawTab_(ss) {
  var sheet = ss.getSheetByName(TAB_RAW);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (h) {
    return String(h).trim().toLowerCase();
  });

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      obj[headers[c]] = values[i][c];
    }
    rows.push(obj);
  }
  return rows;
}

function writeCleanedTab_(ss, cleaned) {
  var sheet = getOrCreateSheet_(ss, TAB_CLEANED);
  sheet.clear();
  var header = ['Date', 'Product', 'Region', 'Amount', 'Customer'];
  var data = [header];
  cleaned.forEach(function (r) {
    data.push([r.date, r.product, r.region, r.amount, r.customer]);
  });
  if (data.length === 1) data.push(['', '', '', '', '']);
  sheet.getRange(1, 1, data.length, header.length).setValues(data);
  sheet.setFrozenRows(1);
  formatDataSheet_(sheet);
}

function writeInvalidTab_(ss, invalid) {
  var sheet = getOrCreateSheet_(ss, TAB_INVALID);
  sheet.clear();
  var header = ['Date', 'Product', 'Region', 'Amount', 'Customer', 'Issues'];
  var data = [header];
  invalid.forEach(function (r) {
    data.push([
      r.date,
      r.product,
      r.region,
      r.amount,
      r.customer,
      (r.reasons || []).join('; '),
    ]);
  });
  if (data.length === 1) data.push(['', '', '', '', '', '']);
  sheet.getRange(1, 1, data.length, header.length).setValues(data);
  sheet.setFrozenRows(1);
  formatDataSheet_(sheet);
}

function writeSummaryTab_(ss, summaryRows) {
  var sheet = getOrCreateSheet_(ss, TAB_SUMMARY);
  sheet.clear();
  var header = [
    'Week start (Mon)',
    'Product',
    'Region',
    'Total amount',
    'Order count',
    'Previous week total',
    'WoW change ($)',
    'WoW change (%)',
  ];
  var data = [header];
  summaryRows.forEach(function (r) {
    data.push([
      r.weekStart,
      r.product,
      r.region,
      r.totalAmount,
      r.orderCount,
      r.previousWeekAmount,
      r.wowChange,
      r.wowPercent,
    ]);
  });
  if (data.length === 1) data.push(['', '', '', '', '', '', '', '']);
  sheet.getRange(1, 1, data.length, header.length).setValues(data);
  sheet.setFrozenRows(1);
  formatDataSheet_(sheet);
}

function getOrCreateSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function formatDataSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return;
  sheet.getRange(1, 1, 1, lastCol).setFontWeight('bold');
  sheet.autoResizeColumns(1, lastCol);
}
