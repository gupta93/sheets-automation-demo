import { describe, it, expect } from 'vitest';
import {
  cleanSalesRows,
  cleanRow,
  normalizeDate,
  parseAmount,
  weekKey,
} from '../core/cleanRows.js';
import { buildWeeklySummary, weekOverWeekChange, latestTwoWeeks } from '../core/weeklySummary.js';
import { runSalesAutomation, rowsFromSheetValues } from '../core/pipeline.js';

describe('normalizeDate', () => {
  it('accepts ISO dates', () => {
    expect(normalizeDate('2025-10-06')).toEqual({ ok: true, iso: '2025-10-06' });
  });

  it('normalizes US slash dates', () => {
    expect(normalizeDate('10/6/2025')).toEqual({ ok: true, iso: '2025-10-06' });
  });

  it('rejects empty dates', () => {
    expect(normalizeDate('  ').ok).toBe(false);
  });
});

describe('parseAmount', () => {
  it('parses numbers and commas', () => {
    expect(parseAmount('1,234.5')).toEqual({ ok: true, amount: 1234.5 });
  });

  it('rejects negative amounts', () => {
    expect(parseAmount('-3').ok).toBe(false);
  });
});

describe('cleanSalesRows', () => {
  const sample = [
    {
      Date: ' 2025-10-06 ',
      Product: ' Widget ',
      Region: 'West',
      Amount: '100',
      Notes: '',
    },
    {
      Date: '10/6/2025',
      Product: 'Widget',
      Region: 'West',
      Amount: '100',
      Notes: 'duplicate',
    },
    {
      Date: '2025-10-07',
      Product: 'Gadget',
      Region: 'East',
      Amount: 'not-a-number',
      Notes: '',
    },
    {
      Date: '2025-09-29',
      Product: 'Widget',
      Region: 'North',
      Amount: '50',
      Notes: '',
    },
  ];

  it('trims, normalizes dates, dedupes, and flags invalid rows', () => {
    const result = cleanSalesRows(sample);
    expect(result.cleaned).toHaveLength(2);
    expect(result.cleaned[0].Product).toBe('Widget');
    expect(result.cleaned[0].Date).toBe('2025-10-06');
    expect(result.duplicateCount).toBe(1);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].Status).toMatch(/Invalid/);
  });
});

describe('buildWeeklySummary', () => {
  it('computes week-over-week change by product and region', () => {
    const rows = [
      { Date: '2025-09-29', Product: 'A', Region: 'West', Amount: 100, Status: 'OK' },
      { Date: '2025-10-06', Product: 'A', Region: 'West', Amount: 150, Status: 'OK' },
      { Date: '2025-10-06', Product: 'B', Region: 'East', Amount: 50, Status: 'OK' },
    ];
    const summary = buildWeeklySummary(rows);
    const dataRow = summary.rows.find((r) => r[1] === 'A' && r[2] === 'West');
    expect(dataRow).toBeDefined();
    expect(dataRow[3]).toBe(150);
    expect(dataRow[5]).toBe(100);
    expect(dataRow[6]).toBe(50);
    expect(dataRow[7]).toBe(50);
  });
});

describe('weekOverWeekChange', () => {
  it('handles zero prior week', () => {
    expect(weekOverWeekChange(10, 0)).toEqual({ change: 10, pct: null });
  });
});

describe('latestTwoWeeks', () => {
  it('returns two latest sorted keys', () => {
    expect(latestTwoWeeks(['2025-W39', '2025-W40', '2025-W41'])).toEqual({
      current: '2025-W41',
      previous: '2025-W40',
    });
  });
});

describe('runSalesAutomation (mocked sheets)', () => {
  it('writes raw, summary, and help; skips email by default', () => {
    const writes = { raw: null, summary: null, help: null };
    const rawSheet = [
      ['Date', 'Product', 'Region', 'Amount', 'Notes'],
      ['2025-10-06', 'Widget', 'West', '100', ''],
    ];

    const result = runSalesAutomation({
      readRawValues: () => rawSheet,
      writeRaw: (v) => {
        writes.raw = v;
      },
      writeSummary: (v) => {
        writes.summary = v;
      },
      writeHelp: (v) => {
        writes.help = v;
      },
      getProperty: () => null,
    });

    expect(result.validCount).toBe(1);
    expect(writes.raw[0]).toContain('Status');
    expect(writes.summary[2]).toContain('Sales total');
    expect(writes.help[0][0]).toMatch(/How to use/);
    expect(result.emailSent).toBe(false);
  });

  it('sends email when enabled and address set', () => {
    let sent = null;
    runSalesAutomation({
      readRawValues: () => [
        ['Date', 'Product', 'Region', 'Amount', 'Notes'],
        ['2025-10-06', 'A', 'West', '10', ''],
      ],
      writeRaw: () => {},
      writeSummary: () => {},
      writeHelp: () => {},
      getProperty: (key) =>
        key === 'EMAIL_SUMMARY_ENABLED' ? 'true' : key === 'EMAIL_TO' ? 'boss@example.com' : null,
      sendEmail: (subject, body) => {
        sent = { subject, body };
      },
    });
    expect(sent.subject).toBe('Weekly sales summary');
    expect(sent.body).toContain('Weekly sales summary');
  });
});

describe('rowsFromSheetValues', () => {
  it('skips blank lines', () => {
    const rows = rowsFromSheetValues([
      ['Date', 'Product', 'Region', 'Amount', 'Notes'],
      ['2025-10-06', 'A', 'W', '1', ''],
      ['', '', '', '', ''],
    ]);
    expect(rows).toHaveLength(1);
  });
});

describe('weekKey', () => {
  it('maps ISO date to ISO week label', () => {
    expect(weekKey('2025-10-06')).toMatch(/^2025-W\d{2}$/);
  });
});

describe('cleanRow', () => {
  it('marks row valid when all fields ok', () => {
    const r = cleanRow({
      Date: '2025-01-02',
      Product: 'P',
      Region: 'R',
      Amount: '9.9',
      Notes: 'x',
    });
    expect(r.valid).toBe(true);
  });
});
