import { RAW_HEADERS, FLAG_COLUMN } from './constants.js';
import { cleanSalesRows } from './cleanRows.js';
import { buildWeeklySummary } from './weeklySummary.js';

/**
 * Convert a 2D array from Sheets (with header row) into row objects.
 * @param {unknown[][]} values
 * @param {string[]} headers
 */
export function rowsFromSheetValues(values, headers = RAW_HEADERS) {
  if (!values || values.length < 2) return [];
  const dataRows = values.slice(1);
  return dataRows
    .filter((row) => row.some((cell) => String(cell ?? '').trim() !== ''))
    .map((row) => {
      /** @type {Record<string, unknown>} */
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? '';
      });
      return obj;
    });
}

/**
 * @param {Record<string, unknown>[]} cleaned
 * @param {Record<string, unknown>[]} invalid
 */
export function buildRawSheetValues(cleaned, invalid) {
  const headers = [...RAW_HEADERS, FLAG_COLUMN];
  const toRow = (r) => headers.map((h) => r[h] ?? '');
  return [headers, ...cleaned.map(toRow), ...invalid.map(toRow)];
}

/**
 * @param {ReturnType<typeof buildWeeklySummary>} summary
 */
export function buildSummarySheetValues(summary) {
  return [
    [summary.title, '', '', '', '', '', '', ''],
    [],
    summary.headers,
    ...summary.rows,
  ];
}

/** @returns {string[][]} */
export function buildHelpSheetValues() {
  return [
    ['How to use this spreadsheet'],
    [],
    ['1. Paste or import sales into the "Raw" tab (Date, Product, Region, Amount, Notes).'],
    ['2. Open the menu "Sales Automation" and click "Clean data & refresh summary".'],
    [
      '3. Valid rows stay on Raw with Status "OK". Invalid rows are listed at the bottom with a reason.',
    ],
    ['4. Open "Weekly Summary" for totals by product and region, with week-over-week change.'],
    [],
    ['Optional weekly schedule'],
    [
      'In Extensions > Apps Script, run "Install weekly trigger" once (see README), or add a time-driven trigger for runSalesAutomation.',
    ],
    [],
    ['Optional email'],
    [
      'Email is OFF by default. In Apps Script: Project Settings > Script properties, set EMAIL_SUMMARY_ENABLED to true and EMAIL_TO to your address.',
    ],
    [],
    ['Sample data'],
    ['See the file data/sample_sales.csv in the GitHub project for example rows.'],
  ];
}

/**
 * End-to-end logic with injected sheet/email services (easy to mock in tests).
 * @param {{
 *   readRawValues: () => unknown[][],
 *   writeRaw: (values: unknown[][]) => void,
 *   writeSummary: (values: unknown[][]) => void,
 *   writeHelp: (values: unknown[][]) => void,
 *   sendEmail?: (subject: string, body: string) => void,
 *   getProperty: (key: string) => string | null,
 * }} deps
 */
export function runSalesAutomation(deps) {
  const rawValues = deps.readRawValues();
  const rawRows = rowsFromSheetValues(rawValues);
  const { cleaned, invalid, duplicateCount } = cleanSalesRows(rawRows);
  deps.writeRaw(buildRawSheetValues(cleaned, invalid));

  const summary = buildWeeklySummary(cleaned);
  deps.writeSummary(buildSummarySheetValues(summary));
  deps.writeHelp(buildHelpSheetValues());

  const emailEnabled = (deps.getProperty('EMAIL_SUMMARY_ENABLED') || 'false').toLowerCase() === 'true';
  const emailTo = deps.getProperty('EMAIL_TO');
  if (emailEnabled && emailTo && deps.sendEmail) {
    deps.sendEmail('Weekly sales summary', summary.emailLines.join('\n'));
  }

  return {
    validCount: cleaned.length,
    invalidCount: invalid.length,
    duplicateCount,
    summary,
    emailSent: Boolean(emailEnabled && emailTo && deps.sendEmail),
  };
}
