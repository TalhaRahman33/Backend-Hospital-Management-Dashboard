const bcrypt = require("bcryptjs");

const generateOTP = () => {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
};

const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

const compareOTP = async (otp, otpHash) => {
  return await bcrypt.compare(otp, otpHash);
};

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
};