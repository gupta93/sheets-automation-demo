var SalesAutomation = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // core/gasEntry.js
  var gasEntry_exports = {};
  __export(gasEntry_exports, {
    DEFAULT_EMAIL_ENABLED: () => DEFAULT_EMAIL_ENABLED,
    FLAG_COLUMN: () => FLAG_COLUMN,
    MENU_ITEM_RUN: () => MENU_ITEM_RUN,
    MENU_NAME: () => MENU_NAME,
    PROP_EMAIL_ENABLED: () => PROP_EMAIL_ENABLED,
    PROP_EMAIL_TO: () => PROP_EMAIL_TO,
    RAW_HEADERS: () => RAW_HEADERS,
    SHEET_NAMES: () => SHEET_NAMES,
    buildHelpSheetValues: () => buildHelpSheetValues,
    buildRawSheetValues: () => buildRawSheetValues,
    buildSummarySheetValues: () => buildSummarySheetValues,
    buildWeeklySummary: () => buildWeeklySummary,
    cleanRow: () => cleanRow,
    cleanSalesRows: () => cleanSalesRows,
    latestTwoWeeks: () => latestTwoWeeks,
    normalizeDate: () => normalizeDate,
    parseAmount: () => parseAmount,
    rowDedupeKey: () => rowDedupeKey,
    rowsFromSheetValues: () => rowsFromSheetValues,
    runSalesAutomation: () => runSalesAutomation,
    totalsByWeek: () => totalsByWeek,
    trimCell: () => trimCell,
    weekKey: () => weekKey,
    weekOverWeekChange: () => weekOverWeekChange
  });

  // core/constants.js
  var SHEET_NAMES = {
    RAW: "Raw",
    SUMMARY: "Weekly Summary",
    HELP: "How to use"
  };
  var RAW_HEADERS = ["Date", "Product", "Region", "Amount", "Notes"];
  var FLAG_COLUMN = "Status";
  var MENU_NAME = "Sales Automation";
  var MENU_ITEM_RUN = "Clean data & refresh summary";
  var PROP_EMAIL_ENABLED = "EMAIL_SUMMARY_ENABLED";
  var PROP_EMAIL_TO = "EMAIL_TO";
  var DEFAULT_EMAIL_ENABLED = "false";

  // core/cleanRows.js
  var DATE_ISO = /^\d{4}-\d{2}-\d{2}$/;
  function trimCell(value) {
    if (value === null || value === void 0) return "";
    return String(value).trim();
  }
  function normalizeDate(value) {
    const raw = trimCell(value);
    if (!raw) return { ok: false, reason: "Missing date" };
    if (DATE_ISO.test(raw)) {
      const d = parseIsoDate(raw);
      return d ? { ok: true, iso: raw } : { ok: false, reason: "Invalid date" };
    }
    const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slash) {
      const month = Number(slash[1]);
      const day = Number(slash[2]);
      const year = Number(slash[3]);
      const iso = toIso(year, month, day);
      return iso ? { ok: true, iso } : { ok: false, reason: "Invalid date" };
    }
    const parsed = Date.parse(raw);
    if (!Number.isNaN(parsed)) {
      const d = new Date(parsed);
      const iso = toIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return iso ? { ok: true, iso } : { ok: false, reason: "Invalid date" };
    }
    return { ok: false, reason: "Unrecognized date format" };
  }
  function parseAmount(value) {
    const raw = trimCell(value);
    if (!raw) return { ok: false, reason: "Missing amount" };
    const normalized = raw.replace(/,/g, "");
    const amount = Number(normalized);
    if (!Number.isFinite(amount)) return { ok: false, reason: "Amount is not a number" };
    if (amount < 0) return { ok: false, reason: "Amount cannot be negative" };
    return { ok: true, amount: Math.round(amount * 100) / 100 };
  }
  function cleanRow(row) {
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
      Notes: notes
    };
    if (!dateResult.ok) return { valid: false, row: base, reason: dateResult.reason };
    if (!product) return { valid: false, row: base, reason: "Missing product" };
    if (!region) return { valid: false, row: base, reason: "Missing region" };
    if (!amountResult.ok) return { valid: false, row: base, reason: amountResult.reason };
    return {
      valid: true,
      row: __spreadProps(__spreadValues({}, base), { Amount: amountResult.amount })
    };
  }
  function rowDedupeKey(row) {
    return [row.Date, row.Product, row.Region, row.Amount].join("|");
  }
  function cleanSalesRows(rawRows) {
    const cleaned = [];
    const invalid = [];
    const seen = /* @__PURE__ */ new Set();
    let duplicateCount = 0;
    for (const raw of rawRows) {
      const result = cleanRow(raw);
      const status = result.valid ? "OK" : `Invalid: ${result.reason}`;
      const withStatus = __spreadProps(__spreadValues({}, result.row), { Status: status });
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
      cleaned.push(__spreadProps(__spreadValues({}, result.row), { Status: "OK" }));
    }
    return { cleaned, invalid, duplicateCount };
  }
  function weekKey(isoDate) {
    const d = parseIsoDate(isoDate);
    if (!d) return "unknown";
    const utc = Date.UTC(d.year, d.month - 1, d.day);
    const day = new Date(utc);
    const dayNum = (day.getUTCDay() + 6) % 7;
    day.setUTCDate(day.getUTCDate() - dayNum + 3);
    const week1 = new Date(Date.UTC(day.getUTCFullYear(), 0, 4));
    const weekNum = 1 + Math.round(
      ((day.getTime() - week1.getTime()) / 864e5 - 3 + (week1.getUTCDay() + 6) % 7) / 7
    );
    return `${day.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
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
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function isValidDate(year, month, day) {
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
  }

  // core/weeklySummary.js
  function totalsByWeek(validRows) {
    const byWeek = /* @__PURE__ */ new Map();
    for (const row of validRows) {
      const wk = weekKey(String(row.Date));
      if (!byWeek.has(wk)) byWeek.set(wk, /* @__PURE__ */ new Map());
      const bucket = byWeek.get(wk);
      const key = `${row.Product}|${row.Region}`;
      if (!bucket.has(key)) {
        bucket.set(key, {
          product: String(row.Product),
          region: String(row.Region),
          total: 0,
          count: 0
        });
      }
      const g = bucket.get(key);
      g.total += Number(row.Amount);
      g.count += 1;
    }
    const out = /* @__PURE__ */ new Map();
    for (const [wk, map] of byWeek) {
      out.set(
        wk,
        [...map.values()].sort(
          (a, b) => a.product.localeCompare(b.product) || a.region.localeCompare(b.region)
        )
      );
    }
    return out;
  }
  function latestTwoWeeks(weekKeys) {
    const sorted = [...new Set(weekKeys)].sort();
    if (sorted.length === 0) return { current: null, previous: null };
    if (sorted.length === 1) return { current: sorted[sorted.length - 1], previous: null };
    return { current: sorted[sorted.length - 1], previous: sorted[sorted.length - 2] };
  }
  function weekOverWeekChange(current, previous) {
    if (current === null || previous === null) return { change: null, pct: null };
    const change = current - previous;
    if (previous === 0) return { change, pct: current === 0 ? 0 : null };
    return { change, pct: Math.round(change / previous * 1e3) / 10 };
  }
  function buildWeeklySummary(validRows) {
    var _a;
    const byWeek = totalsByWeek(validRows);
    const weeks = [...byWeek.keys()];
    const { current, previous } = latestTwoWeeks(weeks);
    const headers = [
      "Week",
      "Product",
      "Region",
      "Sales total",
      "Order count",
      "Prior week total",
      "Change ($)",
      "Change (%)"
    ];
    const rows = [];
    const emailLines = [];
    if (!current) {
      return {
        title: "Weekly Summary",
        headers,
        rows: [["No valid sales data yet", "", "", "", "", "", "", ""]],
        emailLines: ["Weekly sales summary", "", "No valid sales data yet."]
      };
    }
    const currentGroups = byWeek.get(current) || [];
    const prevMap = /* @__PURE__ */ new Map();
    if (previous) {
      for (const g of byWeek.get(previous) || []) {
        prevMap.set(`${g.product}|${g.region}`, g.total);
      }
    }
    let grandCurrent = 0;
    let grandPrevious = 0;
    for (const g of currentGroups) {
      const prevTotal = previous ? (_a = prevMap.get(`${g.product}|${g.region}`)) != null ? _a : 0 : null;
      const { change, pct } = weekOverWeekChange(g.total, prevTotal);
      grandCurrent += g.total;
      if (prevTotal !== null) grandPrevious += prevTotal;
      rows.push([
        current,
        g.product,
        g.region,
        round2(g.total),
        g.count,
        prevTotal === null ? "" : round2(prevTotal),
        change === null ? "" : round2(change),
        pct === null ? "" : pct
      ]);
    }
    const overall = weekOverWeekChange(grandCurrent, previous ? grandPrevious : null);
    rows.push([]);
    rows.push([
      current,
      "ALL",
      "ALL",
      round2(grandCurrent),
      validRows.filter((r) => weekKey(String(r.Date)) === current).length,
      previous ? round2(grandPrevious) : "",
      overall.change === null ? "" : round2(overall.change),
      overall.pct === null ? "" : overall.pct
    ]);
    emailLines.push("Weekly sales summary");
    emailLines.push(`Current week: ${current}`);
    if (previous) emailLines.push(`Compared to: ${previous}`);
    emailLines.push("");
    emailLines.push(
      `All products total: $${round2(grandCurrent)}` + (overall.change !== null ? ` (${formatChange(overall.change, overall.pct)})` : "")
    );
    emailLines.push("");
    for (const g of currentGroups.slice(0, 10)) {
      emailLines.push(`- ${g.product} / ${g.region}: $${round2(g.total)} (${g.count} orders)`);
    }
    if (currentGroups.length > 10) {
      emailLines.push(`\u2026 and ${currentGroups.length - 10} more product/region lines in the sheet.`);
    }
    return { title: "Weekly Summary", headers, rows, emailLines };
  }
  function round2(n) {
    return Math.round(n * 100) / 100;
  }
  function formatChange(change, pct) {
    const sign = change >= 0 ? "+" : "";
    const pctPart = pct === null ? "" : `, ${sign}${pct}%`;
    return `${sign}$${round2(change)}${pctPart}`;
  }

  // core/pipeline.js
  function rowsFromSheetValues(values, headers = RAW_HEADERS) {
    if (!values || values.length < 2) return [];
    const dataRows = values.slice(1);
    return dataRows.filter((row) => row.some((cell) => String(cell != null ? cell : "").trim() !== "")).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        var _a;
        obj[h] = (_a = row[i]) != null ? _a : "";
      });
      return obj;
    });
  }
  function buildRawSheetValues(cleaned, invalid) {
    const headers = [...RAW_HEADERS, FLAG_COLUMN];
    const toRow = (r) => headers.map((h) => {
      var _a;
      return (_a = r[h]) != null ? _a : "";
    });
    return [headers, ...cleaned.map(toRow), ...invalid.map(toRow)];
  }
  function buildSummarySheetValues(summary) {
    return [
      [summary.title, "", "", "", "", "", "", ""],
      [],
      summary.headers,
      ...summary.rows
    ];
  }
  function buildHelpSheetValues() {
    return [
      ["How to use this spreadsheet"],
      [],
      ['1. Paste or import sales into the "Raw" tab (Date, Product, Region, Amount, Notes).'],
      ['2. Open the menu "Sales Automation" and click "Clean data & refresh summary".'],
      [
        '3. Valid rows stay on Raw with Status "OK". Invalid rows are listed at the bottom with a reason.'
      ],
      ['4. Open "Weekly Summary" for totals by product and region, with week-over-week change.'],
      [],
      ["Optional weekly schedule"],
      [
        'In Extensions > Apps Script, run "Install weekly trigger" once (see README), or add a time-driven trigger for runSalesAutomation.'
      ],
      [],
      ["Optional email"],
      [
        "Email is OFF by default. In Apps Script: Project Settings > Script properties, set EMAIL_SUMMARY_ENABLED to true and EMAIL_TO to your address."
      ],
      [],
      ["Sample data"],
      ["See the file data/sample_sales.csv in the GitHub project for example rows."]
    ];
  }
  function runSalesAutomation(deps) {
    const rawValues = deps.readRawValues();
    const rawRows = rowsFromSheetValues(rawValues);
    const { cleaned, invalid, duplicateCount } = cleanSalesRows(rawRows);
    deps.writeRaw(buildRawSheetValues(cleaned, invalid));
    const summary = buildWeeklySummary(cleaned);
    deps.writeSummary(buildSummarySheetValues(summary));
    deps.writeHelp(buildHelpSheetValues());
    const emailEnabled = (deps.getProperty("EMAIL_SUMMARY_ENABLED") || "false").toLowerCase() === "true";
    const emailTo = deps.getProperty("EMAIL_TO");
    if (emailEnabled && emailTo && deps.sendEmail) {
      deps.sendEmail("Weekly sales summary", summary.emailLines.join("\n"));
    }
    return {
      validCount: cleaned.length,
      invalidCount: invalid.length,
      duplicateCount,
      summary,
      emailSent: Boolean(emailEnabled && emailTo && deps.sendEmail)
    };
  }
  return __toCommonJS(gasEntry_exports);
})();
