const jwt = require("jsonwebtoken");

const getUserId = (user = {}) => user.userId ?? user.id;
const getRoleId = (user = {}) => user.roleId ?? user.role_id ?? null;

const generateAccessToken = (user = {}) => {
  return jwt.sign(
    {
      userId: getUserId(user),
      roleId: getRoleId(user),
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
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
      expiresIn: "7d",
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
};