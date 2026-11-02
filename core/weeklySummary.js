import { weekKey } from './cleanRows.js';

/**
 * @typedef {{ product: string, region: string, total: number, count: number }} GroupTotal
 */

/**
 * @param {Record<string, unknown>[]} validRows — cleaned rows with numeric Amount
 * @returns {Map<string, GroupTotal[]>} weekKey -> totals
 */
export function totalsByWeek(validRows) {
  /** @type {Map<string, Map<string, GroupTotal>>} */
  const byWeek = new Map();

  for (const row of validRows) {
    const wk = weekKey(String(row.Date));
    if (!byWeek.has(wk)) byWeek.set(wk, new Map());
    const bucket = byWeek.get(wk);
    const key = `${row.Product}|${row.Region}`;
    if (!bucket.has(key)) {
      bucket.set(key, {
        product: String(row.Product),
        region: String(row.Region),
        total: 0,
        count: 0,
      });
    }
    const g = bucket.get(key);
    g.total += Number(row.Amount);
    g.count += 1;
  }

  /** @type {Map<string, GroupTotal[]>} */
  const out = new Map();
  for (const [wk, map] of byWeek) {
    out.set(
      wk,
      [...map.values()].sort(
        (a, b) => a.product.localeCompare(b.product) || a.region.localeCompare(b.region),
      ),
    );
  }
  return out;
}

/**
 * Pick the two most recent week keys present in data.
 * @param {string[]} weekKeys
 */
export function latestTwoWeeks(weekKeys) {
  const sorted = [...new Set(weekKeys)].sort();
  if (sorted.length === 0) return { current: null, previous: null };
  if (sorted.length === 1) return { current: sorted[sorted.length - 1], previous: null };
  return { current: sorted[sorted.length - 1], previous: sorted[sorted.length - 2] };
}

/**
 * @param {number | null} current
 * @param {number | null} previous
 * @returns {{ change: number | null, pct: number | null }}
 */
export function weekOverWeekChange(current, previous) {
  if (current === null || previous === null) return { change: null, pct: null };
  const change = current - previous;
  if (previous === 0) return { change, pct: current === 0 ? 0 : null };
  return { change, pct: Math.round((change / previous) * 1000) / 10 };
}

/**
 * Build flat rows for the Weekly Summary sheet.
 * @param {Record<string, unknown>[]} validRows
 * @returns {{
 *   title: string,
 *   headers: string[],
 *   rows: (string | number)[][],
 *   emailLines: string[],
 * }}
 */
export function buildWeeklySummary(validRows) {
  const byWeek = totalsByWeek(validRows);
  const weeks = [...byWeek.keys()];
  const { current, previous } = latestTwoWeeks(weeks);

  const headers = [
    'Week',
    'Product',
    'Region',
    'Sales total',
    'Order count',
    'Prior week total',
    'Change ($)',
    'Change (%)',
  ];

  /** @type {(string | number)[][]} */
  const rows = [];
  const emailLines = [];

  if (!current) {
    return {
      title: 'Weekly Summary',
      headers,
      rows: [['No valid sales data yet', '', '', '', '', '', '', '']],
      emailLines: ['Weekly sales summary', '', 'No valid sales data yet.'],
    };
  }

  const currentGroups = byWeek.get(current) || [];
  const prevMap = new Map();
  if (previous) {
    for (const g of byWeek.get(previous) || []) {
      prevMap.set(`${g.product}|${g.region}`, g.total);
    }
  }

  let grandCurrent = 0;
  let grandPrevious = 0;

  for (const g of currentGroups) {
    const prevTotal = previous ? prevMap.get(`${g.product}|${g.region}`) ?? 0 : null;
    const { change, pct } = weekOverWeekChange(g.total, prevTotal);
    grandCurrent += g.total;
    if (prevTotal !== null) grandPrevious += prevTotal;

    rows.push([
      current,
      g.product,
      g.region,
      round2(g.total),
      g.count,
      prevTotal === null ? '' : round2(prevTotal),
      change === null ? '' : round2(change),
      pct === null ? '' : pct,
    ]);
  }

  const overall = weekOverWeekChange(grandCurrent, previous ? grandPrevious : null);
  rows.push([]);
  rows.push([
    current,
    'ALL',
    'ALL',
    round2(grandCurrent),
    validRows.filter((r) => weekKey(String(r.Date)) === current).length,
    previous ? round2(grandPrevious) : '',
    overall.change === null ? '' : round2(overall.change),
    overall.pct === null ? '' : overall.pct,
  ]);

  emailLines.push('Weekly sales summary');
  emailLines.push(`Current week: ${current}`);
  if (previous) emailLines.push(`Compared to: ${previous}`);
  emailLines.push('');
  emailLines.push(
    `All products total: $${round2(grandCurrent)}` +
      (overall.change !== null ? ` (${formatChange(overall.change, overall.pct)})` : ''),
  );
  emailLines.push('');
  for (const g of currentGroups.slice(0, 10)) {
    emailLines.push(`- ${g.product} / ${g.region}: $${round2(g.total)} (${g.count} orders)`);
  }
  if (currentGroups.length > 10) {
    emailLines.push(`… and ${currentGroups.length - 10} more product/region lines in the sheet.`);
  }

  return { title: 'Weekly Summary', headers, rows, emailLines };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function formatChange(change, pct) {
  const sign = change >= 0 ? '+' : '';
  const pctPart = pct === null ? '' : `, ${sign}${pct}%`;
  return `${sign}$${round2(change)}${pctPart}`;
}
