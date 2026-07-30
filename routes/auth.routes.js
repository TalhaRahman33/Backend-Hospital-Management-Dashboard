const express = require("express");

const {
  login,
} = require("../controllers/auth/login.controller");

const {
  verifyOTP,
} = require("../controllers/auth/verifyOTP.controller");

const router = express.Router();

router.post("/login", login);

router.post("/verify-otp", verifyOTP);

module.exports = router;