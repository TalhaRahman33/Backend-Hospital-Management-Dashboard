const assert = require("node:assert/strict");

process.env.JWT_ACCESS_EXPIRES_IN = "8h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

const {
  getAccessTokenExpiryMs,
  getRefreshTokenExpiryMs,
} = require("../utils/jwt");

assert.equal(getAccessTokenExpiryMs(), 8 * 60 * 60 * 1000);
assert.equal(getRefreshTokenExpiryMs(), 7 * 24 * 60 * 60 * 1000);

console.log("session expiry tests passed");
