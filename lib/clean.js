/**
 * Pure row-cleaning logic (no Google APIs). Used by Apps Script and Node tests.
 */

const DATE_PATTERNS = [
  /^(\d{4})-(\d{2})-(\d{2})$/, // ISO YYYY-MM-DD
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY or MM/DD/YYYY
  /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // M-D-YYYY
];

/**
 * @param {unknown} value
 * @returns {string}
 */
function trimField(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Normalize to YYYY-MM-DD or empty if invalid.
 * @param {unknown} value
 * @returns {{ normalized: string, valid: boolean }}
 */
function normalizeDate(value) {
  const s = trimField(value);
  if (!s) return { normalized: '', valid: false };

  for (const re of DATE_PATTERNS) {
    const m = s.match(re);
    if (!m) continue;
    let y;
    let mo;
    let d;
    if (re === DATE_PATTERNS[0]) {
      y = Number(m[1]);
      mo = Number(m[2]);
      d = Number(m[3]);
    } else {
      mo = Number(m[1]);
      d = Number(m[2]);
      y = Number(m[3]);
    }
    const iso = formatIsoDate(y, mo, d);
    if (iso) return { normalized: iso, valid: true };
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const dt = new Date(parsed);
    const iso = formatIsoDate(
      dt.getUTCFullYear(),
      dt.getUTCMonth() + 1,
      dt.getUTCDate()
    );
    if (iso) return { normalized: iso, valid: true };
  }

  return { normalized: s, valid: false };
}

/**
 * @param {number} y
 * @param {number} mo
 * @param {number} d
 * @returns {string|null}
 */
function formatIsoDate(y, mo, d) {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  const mm = String(mo).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * @param {Record<string, unknown>} row
 * @param {string[]} requiredFields
 * @returns {{ valid: boolean, reasons: string[] }}
 */
function validateRow(row, requiredFields) {
  const reasons = [];
  for (const field of requiredFields) {
    const v = trimField(row[field]);
    if (!v) reasons.push(`Missing ${field}`);
  }

  const dateResult = normalizeDate(row.date);
  if (!dateResult.valid) reasons.push('Invalid date');

  const amountRaw = trimField(row.amount);
  const amount = Number(amountRaw.replace(/,/g, ''));
  if (amountRaw === '' || Number.isNaN(amount)) {
    reasons.push('Invalid amount');
  } else if (amount < 0) {
    reasons.push('Negative amount');
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * @param {Record<string, unknown>} row
 * @returns {Record<string, string>}
 */
function normalizeRow(row) {
  const dateResult = normalizeDate(row.date);
  const amountRaw = trimField(row.amount).replace(/,/g, '');
  const amount = Number(amountRaw);
  return {
    date: dateResult.valid ? dateResult.normalized : trimField(row.date),
    product: trimField(row.product),
    region: trimField(row.region),
    amount: Number.isNaN(amount) ? '' : String(amount),
    customer: trimField(row.customer),
  };
}

/**
 * @param {Record<string, unknown>[]} rows
 * @param {string[]} keyFields
 * @returns {{ unique: Record<string, string>[], duplicateIndices: number[] }}
 */
function dedupeRows(rows, keyFields) {
  const seen = new Map();
  const unique = [];
  const duplicateIndices = [];

  rows.forEach((row, index) => {
    const key = keyFields.map((f) => trimField(row[f]).toLowerCase()).join('|');
    if (seen.has(key)) {
      duplicateIndices.push(index);
    } else {
      seen.set(key, true);
      unique.push(row);
    }
  });

  return { unique, duplicateIndices };
}

/**
 * @param {Record<string, unknown>[]} rawRows - objects with lowercase keys
 * @param {{ requiredFields?: string[], dedupeKeys?: string[] }} [options]
 */
function cleanSalesRows(rawRows, options = {}) {
  const requiredFields = options.requiredFields ?? [
    'date',
    'product',
    'region',
    'amount',
    'customer',
  ];
  const dedupeKeys = options.dedupeKeys ?? [
    'date',
    'product',
    'region',
    'customer',
    'amount',
  ];

  const normalized = rawRows.map((r) => normalizeRow(r));
  const validRows = [];
  const invalidRows = [];

  normalized.forEach((row, index) => {
    const { valid, reasons } = validateRow(row, requiredFields);
    if (valid) {
      validRows.push({ ...row, _sourceIndex: index });
    } else {
      invalidRows.push({ ...row, _sourceIndex: index, _reasons: reasons });
    }
  });

  const { unique, duplicateIndices } = dedupeRows(validRows, dedupeKeys);
  const flaggedDuplicates = duplicateIndices.map((i) => validRows[i]);

  return {
    cleaned: unique.map(({ _sourceIndex, ...rest }) => rest),
    invalid: invalidRows.map(({ _sourceIndex, _reasons, ...rest }) => ({
      ...rest,
      reasons: _reasons,
    })),
    duplicatesRemoved: flaggedDuplicates.length,
  };
}

module.exports = {
  trimField,
  normalizeDate,
  validateRow,
  normalizeRow,
  dedupeRows,
  cleanSalesRows,
  formatIsoDate,
};
