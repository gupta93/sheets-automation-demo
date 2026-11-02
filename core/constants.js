/** Sheet tab names used by the automation. */
export const SHEET_NAMES = {
  RAW: 'Raw',
  SUMMARY: 'Weekly Summary',
  HELP: 'How to use',
};

/** Header row for the Raw tab (column order matters). */
export const RAW_HEADERS = ['Date', 'Product', 'Region', 'Amount', 'Notes'];

/** Extra column appended after cleaning. */
export const FLAG_COLUMN = 'Status';

export const MENU_NAME = 'Sales Automation';
export const MENU_ITEM_RUN = 'Clean data & refresh summary';

/** Script property keys (no secrets — values set in Apps Script). */
export const PROP_EMAIL_ENABLED = 'EMAIL_SUMMARY_ENABLED';
export const PROP_EMAIL_TO = 'EMAIL_TO';

export const DEFAULT_EMAIL_ENABLED = 'false';
