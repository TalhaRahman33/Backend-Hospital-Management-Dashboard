const express = require("express");

const {
  login,
} = require("../controllers/auth/login.controller");

const {
  verifyOTP,
} = require("../controllers/auth/verifyOTP.controller");

const {
  resendOTP,
} = require("../controllers/auth/resendOTP.controller");


const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

module.exports = router;