const fs = require('fs');
const path = require('path');
const { cleanSalesRows } = require('../lib/clean');
const {
  weekStartMonday,
  buildWeeklySummaryRows,
  weekOverWeekChange,
  formatSummaryEmailBody,
  latestWeekStart,
} = require('../lib/summary');

function loadSampleRows() {
  const csv = fs.readFileSync(
    path.join(__dirname, '..', 'data', 'sample_sales.csv'),
    'utf8'
  );
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = parts[i] ?? '';
    });
    return obj;
  });
}

describe('weekStartMonday', () => {
  it('returns Monday for mid-week date', () => {
    expect(weekStartMonday('2025-10-08')).toBe('2025-10-06');
  });
});

describe('weekOverWeekChange', () => {
  it('computes delta and percent', () => {
    expect(weekOverWeekChange(110, 100)).toEqual({ change: 10, percent: 10 });
    expect(weekOverWeekChange(100, 0).percent).toBeNull();
  });
});

describe('buildWeeklySummaryRows', () => {
  it('aggregates latest week from cleaned sample data', () => {
    const cleaned = cleanSalesRows(loadSampleRows()).cleaned;
    const week = latestWeekStart(cleaned);
    expect(week).toBe('2025-10-13');

    const rows = buildWeeklySummaryRows(cleaned, week);
    expect(rows.length).toBeGreaterThan(0);

    const widgetNorth = rows.find(
      (r) => r.product === 'Widget Pro' && r.region === 'North'
    );
    expect(widgetNorth).toBeDefined();
    expect(widgetNorth.totalAmount).toBe(500);
    expect(widgetNorth.orderCount).toBe(1);
    expect(widgetNorth.previousWeekAmount).toBe(1500);
    expect(widgetNorth.wowChange).toBe(-1000);
  });

  it('formats email body', () => {
    const cleaned = cleanSalesRows(loadSampleRows()).cleaned;
    const week = latestWeekStart(cleaned);
    const rows = buildWeeklySummaryRows(cleaned, week);
    const body = formatSummaryEmailBody(rows, 'Demo Sheet');
    expect(body).toContain('Weekly sales summary');
    expect(body).toContain('Widget Pro');
  });
});
