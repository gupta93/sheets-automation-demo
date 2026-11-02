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

function setEmailSummaryEnabled(enabled) {
  PropertiesService.getScriptProperties().setProperty(
    PROP_EMAIL_ENABLED,
    enabled ? 'true' : 'false'
  );
}

function setEmailSummaryTo(address) {
  PropertiesService.getScriptProperties().setProperty(PROP_EMAIL_TO, address);
}

/**
 * Run once from the Apps Script editor (Run button). Edit the address below first.
 * The editor cannot pass function arguments to other functions.
 */
function setupEmail() {
  // >>> CHANGE THIS to the inbox that should receive weekly summaries <<<
  var SUMMARY_EMAIL_ADDRESS = 'your@example.com';

  if (
    !SUMMARY_EMAIL_ADDRESS ||
    SUMMARY_EMAIL_ADDRESS === 'your@example.com'
  ) {
    Logger.log(
      'Edit SUMMARY_EMAIL_ADDRESS at the top of setupEmail(), then run setupEmail again.'
    );
    return;
  }

  setEmailSummaryTo(SUMMARY_EMAIL_ADDRESS);
  setEmailSummaryEnabled(true);
  Logger.log('Email summary enabled for ' + SUMMARY_EMAIL_ADDRESS);
}

function configureEmailFromMenu() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    'Email weekly summary',
    'Enter the email address that should receive the summary:',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  var address = response.getResponseText().trim();
  if (!address) {
    notifyUser_('No address entered. Email summary is still off.');
    return;
  }

  setEmailSummaryTo(address);
  setEmailSummaryEnabled(true);
  notifyUser_('Email summary enabled for ' + address + '.');
}

function disableEmailFromMenu() {
  setEmailSummaryEnabled(false);
  notifyUser_('Email summary turned off.');
}
