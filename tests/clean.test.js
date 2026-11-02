const fs = require('fs');
const path = require('path');
const { cleanSalesRows, normalizeDate, dedupeRows } = require('../lib/clean');

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

describe('normalizeDate', () => {
  it('accepts ISO and US formats', () => {
    expect(normalizeDate('2025-10-06').normalized).toBe('2025-10-06');
    expect(normalizeDate('10/07/2025').normalized).toBe('2025-10-07');
  });

  it('rejects garbage', () => {
    expect(normalizeDate('invalid-date').valid).toBe(false);
  });
});

describe('dedupeRows', () => {
  it('keeps first duplicate only', () => {
    const rows = [
      { date: '2025-10-08', product: 'A', region: 'E', amount: '1', customer: 'X' },
      { date: '2025-10-08', product: 'A', region: 'E', amount: '1', customer: 'X' },
    ];
    const { unique, duplicateIndices } = dedupeRows(rows, [
      'date',
      'product',
      'region',
      'customer',
      'amount',
    ]);
    expect(unique).toHaveLength(1);
    expect(duplicateIndices).toEqual([1]);
  });
});

describe('cleanSalesRows', () => {
  it('cleans sample CSV: trims, dedupes, flags invalid', () => {
    const raw = loadSampleRows();
    const result = cleanSalesRows(raw);

    expect(result.duplicatesRemoved).toBe(1);
    expect(result.invalid.length).toBeGreaterThanOrEqual(3);

    const trimmed = result.cleaned.find((r) => r.customer === 'Beta LLC');
    expect(trimmed).toBeDefined();
    expect(trimmed.amount).toBe('850');

    const dupProduct = result.cleaned.filter(
      (r) => r.product === 'Gadget Lite' && r.region === 'East' && r.date === '2025-10-08'
    );
    expect(dupProduct).toHaveLength(1);
  });
});
