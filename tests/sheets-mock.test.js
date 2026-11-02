/**
 * Mock SpreadsheetApp-style orchestration using pure libs (no real Google APIs).
 */

const { cleanSalesRows } = require('../lib/clean');
const { buildWeeklySummaryRows, latestWeekStart } = require('../lib/summary');

function createMockSheetsService(initialRawRows) {
  const store = {
    Raw: initialRawRows,
    Cleaned: [],
    Invalid: [],
    Summary: [],
  };

  return {
    store,
    runPipeline() {
      const result = cleanSalesRows(store.Raw);
      store.Cleaned = result.cleaned;
      store.Invalid = result.invalid;
      const week = latestWeekStart(result.cleaned);
      store.Summary = week
        ? buildWeeklySummaryRows(result.cleaned, week)
        : [];
      return { ...result, weekStart: week };
    },
  };
}

describe('mocked Sheets pipeline', () => {
  it('writes cleaned, invalid, and summary from raw rows', () => {
    const raw = [
      {
        date: '2025-10-06',
        product: 'A',
        region: 'North',
        amount: '10',
        customer: 'X',
      },
      {
        date: '2025-10-06',
        product: 'A',
        region: 'North',
        amount: '10',
        customer: 'X',
      },
      { date: 'bad', product: 'B', region: 'South', amount: '5', customer: 'Y' },
    ];

    const mock = createMockSheetsService(raw);
    const out = mock.runPipeline();

    expect(out.cleaned).toHaveLength(1);
    expect(out.invalid).toHaveLength(1);
    expect(out.duplicatesRemoved).toBe(1);
    expect(mock.store.Summary.length).toBeGreaterThan(0);
  });
});
