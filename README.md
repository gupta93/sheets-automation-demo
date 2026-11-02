# Google Sheets sales automation (demo)

This project is a **ready-to-copy Google Sheets automation** for small teams who track sales or form responses in a spreadsheet. It cleans messy rows, removes duplicates, flags problems, and builds a **Weekly Summary** with week-over-week changes. Optional email delivery is **off by default**.

Built by **Tushar Gupta** as a portfolio sample for non-technical clients.

## What you get

| Piece | Purpose |
| --- | --- |
| **Raw** tab | Where you paste or import sales rows |
| **Cleaned** tab | Valid rows after trim, date fix, dedupe |
| **Invalid Rows** tab | Rows that failed validation (with reasons) |
| **Weekly Summary** tab | Totals by product and region, plus WoW change |
| **How to use** tab | Plain-language instructions inside the sheet |
| **Sales automation** menu | Run cleanup manually or install a weekly schedule |

Core business rules live in `lib/` as **pure JavaScript** (no Google APIs), with unit tests in Node. The same logic is committed under `src/generated/` for copy-paste setup (developers can refresh those files with `npm run build:gas` after editing `lib/`).

## Sample data

Import `data/sample_sales.csv` into your **Raw** tab (File → Import, or copy/paste). Headers must be:

`Date`, `Product`, `Region`, `Amount`, `Customer`

## Copy this into your Google Sheet

You can use either **copy-paste** (easiest for most clients) or **clasp** (developers).

### Option A — Copy-paste (no command line)

1. Create a new Google Sheet.
2. Add a tab named **Raw** and paste the sample CSV (with headers).
3. Open **Extensions → Apps Script**.
4. Remove the default `Code.gs` content (or delete that file).
5. From this GitHub repo, copy the **full contents** of each file below into **new script files** in the Apps Script editor. Names and folders are up to you — Google merges every `.gs` file in the project; only the code matters.
   - `src/Config.gs`
   - `src/Main.gs`
   - `src/SheetsIO.gs`
   - `src/Email.gs`
   - `src/HowToUse.gs`
   - `src/Notify.gs`
   - `src/generated/clean.gs` (copy as-is from the repo — **no local build step**)
   - `src/generated/summary.gs` (copy as-is from the repo — **no local build step**)
6. In **Project settings**, set the time zone you want and enable the **V8** runtime (see `src/appsscript.json` for the sample settings).
7. Save the project, reload the spreadsheet, and approve permissions when prompted.
8. Use the **Sales automation** menu → **Run clean & weekly summary**.

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

The job runs without the spreadsheet open. It logs messages with **Logger** instead of pop-up alerts when there is no UI.

You can also add triggers in **Apps Script → Triggers** (clock icon) if you prefer a different schedule.

## Optional email summary

Email is **disabled by default**. Pick one setup path:

**From the sheet (easiest):** **Sales automation → Set up email summary…**, enter your address, and click OK.

**From the Apps Script editor:** Open `Email.gs`, change `SUMMARY_EMAIL_ADDRESS` inside `setupEmail()`, select **setupEmail** in the run dropdown, and click **Run** once. (The editor cannot pass arguments to other functions.)

To turn off email: **Sales automation → Turn off email summary**.

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
src/generated/            Synced from lib/ (committed for copy-paste)
tests/                    Unit tests
```

## License

MIT — see [LICENSE](LICENSE).
