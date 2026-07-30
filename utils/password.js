const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const saltRounds = 12;

  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, passwordHash) => {
  return await bcrypt.compare(password, passwordHash);
};

module.exports = {
  hashPassword,
  comparePassword,
};