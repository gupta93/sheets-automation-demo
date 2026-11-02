# Google Sheets sales automation (demo)

This project is a **ready-to-copy Google Sheets automation** for small teams who track sales or form responses in a spreadsheet. It cleans messy rows, removes duplicates, flags problems, and builds a **Weekly Summary** with week-over-week changes. Optional email delivery is **off by default**.

Built by **Tushar Gupta** as a portfolio sample for non-technical clients.

![Screenshot: Raw data tab](docs/images/raw-tab.png)

## What you get

| Piece | Purpose |
| --- | --- |
| **Raw** tab | Where you paste or import sales rows |
| **Cleaned** tab | Valid rows after trim, date fix, dedupe |
| **Invalid Rows** tab | Rows that failed validation (with reasons) |
| **Weekly Summary** tab | Totals by product and region, plus WoW change |
| **How to use** tab | Plain-language instructions inside the sheet |
| **Sales automation** menu | Run cleanup manually or install a weekly schedule |

Core business rules live in `lib/` as **pure JavaScript** (no Google APIs), with unit tests in Node. The same logic is copied into Apps Script under `src/generated/` when you run `npm run build:gas`.

## Sample data

Import `data/sample_sales.csv` into your **Raw** tab (File → Import, or copy/paste). Headers must be:

`Date`, `Product`, `Region`, `Amount`, `Customer`

## Copy this into your Google Sheet

You can use either **clasp** (developers) or **copy-paste** (easiest for most clients).

### Option A — Copy-paste (no command line)

1. Create a new Google Sheet.
2. Add a tab named **Raw** and paste the sample CSV (with headers).
3. Open **Extensions → Apps Script**.
4. Delete any default code in `Code.gs`.
5. From this GitHub repo, open each file under `src/` **and** `src/generated/` (after running `build:gas` locally, or use the generated files from the repo). Create matching script files in the editor:
   - `Config.gs`, `Main.gs`, `SheetsIO.gs`, `Email.gs`, `HowToUse.gs`
   - `generated/clean.gs`, `generated/summary.gs`
6. Add `appsscript.json` settings via the Apps Script project settings (time zone, V8 runtime) — or merge the contents of `src/appsscript.json`.
7. Save the project, reload the spreadsheet, and approve permissions when prompted.
8. Use the **Sales automation** menu → **Run clean & weekly summary**.

![Screenshot: Custom menu](docs/images/menu.png)

### Option B — clasp (push from your computer)

1. Install [Node.js](https://nodejs.org/) and the clasp CLI: `npm install -g @google/clasp`
2. Log in: `clasp login`
3. Clone this repository and run:
   ```bash
   npm ci
   npm run build:gas
   ```
4. Copy `.clasp.json.example` to `.clasp.json` and set your `scriptId` (create a standalone Apps Script project bound to your sheet, or use **Extensions → Apps Script** and copy the script ID from Project settings).
5. Push: `clasp push`
6. Reload the spreadsheet.

## Weekly time trigger

In the sheet: **Sales automation → Install weekly trigger (Mondays 8am)**.

That creates a time-based trigger that runs the same cleanup and summary every **Monday at 8:00 AM** in the spreadsheet time zone. To remove it: **Sales automation → Remove weekly trigger**.

You can also add triggers in **Apps Script → Triggers** (clock icon) if you prefer a different schedule.

![Screenshot: Triggers page](docs/images/triggers.png)

## Optional email summary

Email is **disabled by default**. To turn it on:

1. Open **Extensions → Apps Script**.
2. Run once (no arguments needed in the runner):
   - `setEmailSummaryTo('your@email.com')`
   - `setEmailSummaryEnabled(true)`
3. Run the menu action again, or wait for the weekly trigger.

To disable: `setEmailSummaryEnabled(false)`.

Addresses are stored in **Script properties** (not in the sheet). No secrets are committed to this repository.

## Develop and test locally

```bash
npm ci
npm run lint
npm test
```

Tests use [Vitest](https://vitest.dev/) and mock spreadsheet behavior without calling Google APIs.

## Project layout

```
data/sample_sales.csv     Sample import
lib/                      Pure cleaning & summary logic
src/                      Apps Script (menus, tabs, email)
src/generated/            Built from lib/ (do not edit by hand)
tests/                    Unit tests
```

## License

MIT — see [LICENSE](LICENSE).
