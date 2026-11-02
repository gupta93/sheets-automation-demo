/**
 * Pure helpers for parsing and validating sales rows.
 * Safe to run in Node (tests) and Apps Script (copied under src/core).
 */

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {unknown} value
 * @returns {string}
 */
export function trimCell(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Normalize common date inputs to YYYY-MM-DD (UTC calendar date).
 * @param {unknown} value
 * @returns {{ ok: true, iso: string } | { ok: false, reason: string }}
 */
export function normalizeDate(value) {
  const raw = trimCell(value);
  if (!raw) return { ok: false, reason: 'Missing date' };

  if (DATE_ISO.test(raw)) {
    const d = parseIsoDate(raw);
    return d ? { ok: true, iso: raw } : { ok: false, reason: 'Invalid date' };
  }

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const year = Number(slash[3]);
    const iso = toIso(year, month, day);
    return iso ? { ok: true, iso } : { ok: false, reason: 'Invalid date' };
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const iso = toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return iso ? { ok: true, iso } : { ok: false, reason: 'Invalid date' };
  }

  return { ok: false, reason: 'Unrecognized date format' };
}

/**
 * @param {unknown} value
 * @returns {{ ok: true, amount: number } | { ok: false, reason: string }}
 */
export function parseAmount(value) {
  const raw = trimCell(value);
  if (!raw) return { ok: false, reason: 'Missing amount' };
  const normalized = raw.replace(/,/g, '');
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return { ok: false, reason: 'Amount is not a number' };
  if (amount < 0) return { ok: false, reason: 'Amount cannot be negative' };
  return { ok: true, amount: Math.round(amount * 100) / 100 };
}

/**
 * @param {Record<string, unknown>} row — keys match RAW_HEADERS
 * @returns {{ valid: true, row: Record<string, unknown> } | { valid: false, row: Record<string, unknown>, reason: string }}
 */
export function cleanRow(row) {
  const dateResult = normalizeDate(row.Date);
  const product = trimCell(row.Product);
  const region = trimCell(row.Region);
  const amountResult = parseAmount(row.Amount);
  const notes = trimCell(row.Notes);

  const base = {
    Date: dateResult.ok ? dateResult.iso : trimCell(row.Date),
    Product: product,
    Region: region,
    Amount: amountResult.ok ? amountResult.amount : trimCell(row.Amount),
    Notes: notes,
  };

  if (!dateResult.ok) return { valid: false, row: base, reason: dateResult.reason };
  if (!product) return { valid: false, row: base, reason: 'Missing product' };
  if (!region) return { valid: false, row: base, reason: 'Missing region' };
  if (!amountResult.ok) return { valid: false, row: base, reason: amountResult.reason };

  return {
    valid: true,
    row: { ...base, Amount: amountResult.amount },
  };
}

/**
 * @param {Record<string, unknown>[]} rows — already cleaned valid rows
 * @returns {string}
 */
export function rowDedupeKey(row) {
  return [row.Date, row.Product, row.Region, row.Amount].join('|');
}

/**
 * Clean an array of raw row objects (header keys).
 * @param {Record<string, unknown>[]} rawRows
 * @returns {{
 *   cleaned: Record<string, unknown>[],
 *   invalid: (Record<string, unknown> & { Status: string })[],
 *   duplicateCount: number,
 * }}
 */
export function cleanSalesRows(rawRows) {
  const cleaned = [];
  const invalid = [];
  const seen = new Set();
  let duplicateCount = 0;

  for (const raw of rawRows) {
    const result = cleanRow(raw);
    const status = result.valid ? 'OK' : `Invalid: ${result.reason}`;
    const withStatus = { ...result.row, Status: status };

    if (!result.valid) {
      invalid.push(withStatus);
      continue;
    }

    const key = rowDedupeKey(result.row);
    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(key);
    cleaned.push({ ...result.row, Status: 'OK' });
  }

  return { cleaned, invalid, duplicateCount };
}

/**
 * ISO week key (year-Www) for a YYYY-MM-DD date string.
 * @param {string} isoDate
 */
export function weekKey(isoDate) {
  const d = parseIsoDate(isoDate);
  if (!d) return 'unknown';
  const utc = Date.UTC(d.year, d.month - 1, d.day);
  const day = new Date(utc);
  const dayNum = (day.getUTCDay() + 6) % 7;
  day.setUTCDate(day.getUTCDate() - dayNum + 3);
  const week1 = new Date(Date.UTC(day.getUTCFullYear(), 0, 4));
  const weekNum =
    1 +
    Math.round(
      ((day.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7,
    );
  return `${day.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function parseIsoDate(iso) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!isValidDate(year, month, day)) return null;
  return { year, month, day };
}

function toIso(year, month, day) {
  if (!isValidDate(year, month, day)) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isValidDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return (
    d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
  );
}
