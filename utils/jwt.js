const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "8h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

const getUserId = (user = {}) => user.userId ?? user.id;
const getRoleId = (user = {}) => user.roleId ?? user.role_id ?? null;

const parseDurationToMs = (value) => {
  if (typeof value === "number") {
    return value;
  }

  if (!value || typeof value !== "string") {
    return 0;
  }

  const match = value.trim().match(/^([0-9]+)(ms|s|m|h|d|w)$/i);

  if (!match) {
    return 0;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const getAccessTokenExpiryMs = () => parseDurationToMs(ACCESS_TOKEN_EXPIRES_IN);
const getRefreshTokenExpiryMs = () => parseDurationToMs(REFRESH_TOKEN_EXPIRES_IN);

const generateAccessToken = (user = {}) => {
  return jwt.sign(
    {
      userId: getUserId(user),
      roleId: getRoleId(user),
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};

const generateRefreshToken = (user = {}) => {
  return jwt.sign(
    {
      userId: getUserId(user),
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    }
  );
};

const verifyAccessToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET
  );
};

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpiryMs,
  getRefreshTokenExpiryMs,
};