const firebase = require('../services/firebase');
const { parseStateParam } = require('../utils/stateParser');
const { exchangeOAuthCode } = require('../services/tokenExchange');
const { normalizeConfigRecord } = require('../utils/configBuilder');
const { encryptIfConfigured } = require('../utils/encryption');

function frontendRedirect(params) {
  const base = process.env.FRONTEND_URL || 'http://localhost:53682';
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

async function handleOAuthCallback(req, res) {
  if (req.query.error) {
    const detail = req.query.error_description || req.query.error;
    res.redirect(frontendRedirect({ error: detail }));
    return;
  }

  try {
    const cfg = parseStateParam(req.query.state);
    const token = await exchangeOAuthCode(cfg, req.query.code);
    const record = normalizeConfigRecord(cfg, token);
    record.clientSecret = encryptIfConfigured(record.clientSecret);
    const saved = await firebase.push('rclone_configs', record);

    res.redirect(frontendRedirect({
      saved: 'true',
      remote: saved.remoteName,
    }));
  } catch (err) {
    res.redirect(frontendRedirect({ error: err.message }));
  }
}

module.exports = {
  handleOAuthCallback,
};
