# Google Sheets sales automation (portfolio demo)

This project shows how a Google Sheet can **clean messy sales data and refresh a weekly summary by itself**—either when you click a menu item or on an automatic weekly schedule.

Built by **Tushar Gupta** as a sample automation for small teams who live in spreadsheets.

## What it does

1. **Raw tab** — You paste or import sales rows (date, product, region, amount, notes).
2. **Clean** — Trims spaces, fixes date formats, removes duplicate rows, and marks bad rows with a **Status** message.
3. **Weekly Summary tab** — Totals sales by **product** and **region**, compares the latest week to the previous week ($ and % change), and shows an overall total.
4. **How to use tab** — Short instructions inside the spreadsheet (created/updated each run).
5. **Optional email** — Can email the summary text. **Off by default.** Turn it on only if you set script properties (see below).

Sample rows live in [`data/sample_sales.csv`](data/sample_sales.csv).

## Copy this into your Google Sheet

You can install the script in either of two ways.

### Option A — Recommended for developers (`clasp`)

1. Create a new Google Sheet (or open an existing one).
2. In the sheet: **Extensions → Apps Script**. Note the script project; you will link it with clasp.
3. On your computer, install [Node.js](https://nodejs.org/) and the clasp CLI:
   ```bash
   npm install -g @google/clasp
   clasp login
   ```
4. Clone this repository and install dependencies:
   ```bash
   git clone https://github.com/gupta93/sheets-automation-demo.git
   cd sheets-automation-demo
   npm install
   npm run build:gas
   ```
5. Copy `.clasp.json.example` to `.clasp.json` and set `scriptId` to your Apps Script project ID (Project Settings in the Apps Script editor).
6. Push the code:
   ```bash
   clasp push
   ```
7. Reload the spreadsheet. You should see the menu **Sales Automation**.
8. Import sample data: **File → Import** in the sheet, upload `data/sample_sales.csv`, choose **Replace current sheet** or paste into a tab named **Raw** with the header row from the CSV.

### Option B — Paste in the browser (no command line)

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Run `npm run build:gas` in this repo (or copy the built file from a release) and paste these files into the script editor:
   - All of `src/Main.gs`
   - All of `src/SalesAutomation.bundle.js` (generated—do not edit by hand)
   - Replace `appsscript.json` via Project Settings if needed (V8 runtime).
3. Save, reload the sheet, use the **Sales Automation** menu.

## Run it

- **Manual:** Open the spreadsheet → menu **Sales Automation** → **Clean data & refresh summary**.
- **Weekly automatic:** Same menu → **Install weekly trigger (Monday 8am)** — runs every Monday at 8:00 in the spreadsheet’s time zone. You can also add a trigger under **Apps Script → Triggers** pointing to `runSalesAutomation`.

## Optional email (off by default)

1. In Apps Script: **Project Settings → Script properties**.
2. Add:
   - `EMAIL_SUMMARY_ENABLED` = `true`
   - `EMAIL_TO` = your email address
3. The first time, Google may ask you to authorize **Mail** access when you run the script.

Leave these unset (or set `EMAIL_SUMMARY_ENABLED` to `false`) to skip email entirely.

## Development and tests

Business rules are plain JavaScript in the [`core/`](core/) folder so they can be unit-tested without Google’s servers.

```bash
npm install
npm run lint
npm test
npm run build:gas   # refreshes src/SalesAutomation.bundle.js before clasp push
```

Tests use [Vitest](https://vitest.dev/) and mock spreadsheet writes through `runSalesAutomation()` in [`core/pipeline.js`](core/pipeline.js).

## License

MIT — see [LICENSE](LICENSE).
