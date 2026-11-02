/**
 * Optional email summary (disabled by default).
 */

function maybeEmailSummary_(spreadsheetName, summaryRows) {
  var props = PropertiesService.getScriptProperties();
  var enabled = props.getProperty(PROP_EMAIL_ENABLED);
  if (enabled !== 'true') return;

  var to = props.getProperty(PROP_EMAIL_TO);
  if (!to) {
    Logger.log('Email enabled but ' + PROP_EMAIL_TO + ' is not set.');
    return;
  }

  var subject =
    'Weekly sales summary — ' +
    (summaryRows[0] ? summaryRows[0].weekStart : 'no data');
  var body = formatSummaryEmailBody(summaryRows, spreadsheetName);

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
  });
}

/**
 * Helpers for setup (run once from editor or via menu extension).
 * setEmailSummaryEnabled(true/false) and setEmailSummaryTo('you@example.com')
 */
function setEmailSummaryEnabled(enabled) {
  PropertiesService.getScriptProperties().setProperty(
    PROP_EMAIL_ENABLED,
    enabled ? 'true' : 'false'
  );
}

function setEmailSummaryTo(address) {
  PropertiesService.getScriptProperties().setProperty(PROP_EMAIL_TO, address);
}
