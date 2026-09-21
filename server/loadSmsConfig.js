const fs = require('fs');
const path = require('path');

const defaults = {
  sendUrl: 'http://192.168.1.30/SubSystems/SMS/webservices/sms_send.aspx',
  token: '',
  hostHeader: 'erp.sabzevar.ir',
};

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * SMS settings for Metro sso-proxy only (Node). Not bundled into the mobile app.
 * Priority: env vars → server/sms.config.local.json → server/sms.config.json
 */
function loadSmsConfig() {
  const dir = __dirname;
  const fromFile =
    readJson(path.join(dir, 'sms.config.local.json')) ||
    readJson(path.join(dir, 'sms.config.json')) ||
    {};

  return {
    sendUrl:
      process.env.SMS_SEND_URL?.trim() ||
      fromFile.sendUrl?.trim() ||
      defaults.sendUrl,
    token:
      process.env.SMS_TOKEN?.trim() || fromFile.token?.trim() || defaults.token,
    hostHeader:
      process.env.SMS_HOST_HEADER?.trim() ||
      fromFile.hostHeader?.trim() ||
      defaults.hostHeader,
  };
}

module.exports = { loadSmsConfig };
