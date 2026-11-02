/**
 * AUTO-GENERATED from lib/summary.js — run npm run build:gas before deploy.
 */

/**
 * ISO week start (Monday) for a YYYY-MM-DD date string.
 * @param {string} isoDate
 * @returns {string} YYYY-MM-DD of Monday
 */
function weekStartMonday(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  dt.setUTCDate(dt.getUTCDate() + diff);
  return dt.toISOString().slice(0, 10);
}

/**
 * @param {Record<string, string>[]} cleanedRows
 * @param {string} [asOfWeekStart] - optional anchor week (Monday ISO)
 */
function aggregateByProductRegion(cleanedRows, asOfWeekStart) {
  const totals = new Map();

  for (const row of cleanedRows) {
    const week = weekStartMonday(row.date);
    if (asOfWeekStart && week !== asOfWeekStart) continue;

    const product = row.product;
    const region = row.region;
    const key = `${product}\t${region}`;
    const amount = Number(row.amount) || 0;

    if (!totals.has(key)) {
      totals.set(key, {
        product,
        region,
        weekStart: week,
        totalAmount: 0,
        orderCount: 0,
      });
    }
    const entry = totals.get(key);
    entry.totalAmount += amount;
    entry.orderCount += 1;
  }

  return [...totals.values()].sort((a, b) => {
    const pc = a.product.localeCompare(b.product);
    return pc !== 0 ? pc : a.region.localeCompare(b.region);
  });
}

/**
 * @param {number} current
 * @param {number} previous
 * @returns {{ change: number, percent: number|null }}
 */
function weekOverWeekChange(current, previous) {
  const change = current - previous;
  if (previous === 0) {
    return { change, percent: current === 0 ? 0 : null };
  }
  return { change, percent: (change / previous) * 100 };
}

/**
 * Build summary rows with WoW vs previous week's totals (same product/region keys).
 * @param {Record<string, string>[]} cleanedRows - all cleaned data
 * @param {string} targetWeekStart - Monday ISO
 * @param {Record<string, string>[]} [previousCleanedRows]
 */
function buildWeeklySummaryRows(cleanedRows, targetWeekStart, previousCleanedRows) {
  const current = aggregateByProductRegion(cleanedRows, targetWeekStart);
  const prevWeekStart = addDaysIso(targetWeekStart, -7);
  const previous = aggregateByProductRegion(
    previousCleanedRows ?? cleanedRows,
    prevWeekStart
  );

  const prevMap = new Map(
    previous.map((p) => [`${p.product}\t${p.region}`, p.totalAmount])
  );

  return current.map((row) => {
    const key = `${row.product}\t${row.region}`;
    const prevAmount = prevMap.get(key) ?? 0;
    const wow = weekOverWeekChange(row.totalAmount, prevAmount);
    return {
      weekStart: row.weekStart,
      product: row.product,
      region: row.region,
      totalAmount: roundMoney(row.totalAmount),
      orderCount: row.orderCount,
      previousWeekAmount: roundMoney(prevAmount),
      wowChange: roundMoney(wow.change),
      wowPercent:
        wow.percent === null ? 'N/A (new)' : roundPercent(wow.percent),
    };
  });
}

/**
 * Pick the latest week present in data.
 * @param {Record<string, string>[]} cleanedRows
 */
function latestWeekStart(cleanedRows) {
  let max = '';
  for (const row of cleanedRows) {
    const w = weekStartMonday(row.date);
    if (w > max) max = w;
  }
  return max;
}

/**
 * @param {string} isoDate
 * @param {number} days
 */
function addDaysIso(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

function roundPercent(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Plain-text email body for a summary.
 * @param {ReturnType<typeof buildWeeklySummaryRows>} rows
 * @param {string} sheetName
 */
function formatSummaryEmailBody(rows, sheetName) {
  if (rows.length === 0) {
    return `Weekly summary for ${sheetName}\n\nNo sales recorded for this week.`;
  }
  const week = rows[0].weekStart;
  const lines = [
    `Weekly sales summary (${week})`,
    `Source: ${sheetName}`,
    '',
    'Product | Region | Total | Orders | WoW %',
    '---',
  ];
  for (const r of rows) {
    lines.push(
      `${r.product} | ${r.region} | $${r.totalAmount} | ${r.orderCount} | ${r.wowPercent}%`
    );
  }
  return lines.join('\n');
}

