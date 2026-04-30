function toExpiry(expiresIn) {
  return new Date(Date.now() + Number(expiresIn || 3600) * 1000).toISOString();
}

function buildTokenJson(token, existingRefreshToken) {
  const expiry = token.expiry || toExpiry(token.expires_in);
  return {
    access_token: token.access_token,
    token_type: token.token_type || 'Bearer',
    refresh_token: token.refresh_token || existingRefreshToken || '',
    expiry,
  };
}

function buildRcloneConfig(cfg, token, existingRefreshToken = '') {
  const tokenJson = buildTokenJson(token, existingRefreshToken);
  const tokenText = JSON.stringify(tokenJson);

  if (cfg.provider === 'gd') {
    return {
      expiry: tokenJson.expiry,
      refreshToken: tokenJson.refresh_token,
      rcloneConfig: [
        `[${cfg.remoteName}]`,
        'type = drive',
        `client_id = ${cfg.clientId}`,
        `client_secret = ${cfg.clientSecret || ''}`,
        `scope = ${cfg.scope || 'drive'}`,
        `token = ${tokenText}`,
      ].join('\n'),
    };
  }

  const lines = [
    `[${cfg.remoteName}]`,
    'type = onedrive',
    `client_id = ${cfg.clientId}`,
  ];
  if (cfg.clientSecret) lines.push(`client_secret = ${cfg.clientSecret}`);
  lines.push(`token = ${tokenText}`);
  lines.push(`drive_type = ${cfg.driveType || 'personal'}`);

  return {
    expiry: tokenJson.expiry,
    refreshToken: tokenJson.refresh_token,
    rcloneConfig: lines.join('\n'),
  };
}

function normalizeConfigRecord(cfg, token, options = {}) {
  const built = options.rcloneConfig
    ? {
      expiry: options.expiry || token.expiry || toExpiry(token.expires_in),
      refreshToken: token.refresh_token || options.refreshToken || '',
      rcloneConfig: options.rcloneConfig,
    }
    : buildRcloneConfig(cfg, token, options.refreshToken);

  const now = Date.now();
  return {
    remoteName: cfg.remoteName || 'myremote',
    provider: cfg.provider,
    emailOwner: cfg.emailOwner || '',
    clientId: cfg.clientId || '',
    clientSecret: cfg.clientSecret || '',
    scope: cfg.provider === 'gd' ? (cfg.scope || 'drive') : '',
    driveType: cfg.provider === 'od' ? (cfg.driveType || 'personal') : '',
    accessToken: token.access_token || options.accessToken || '',
    refreshToken: built.refreshToken,
    expiry: built.expiry,
    rcloneConfig: built.rcloneConfig,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    status: options.status || 'active',
    lastChecked: options.lastChecked ?? null,
    storageUsed: options.storageUsed ?? null,
    storageTotal: options.storageTotal ?? null,
  };
}

module.exports = {
  buildRcloneConfig,
  normalizeConfigRecord,
};
