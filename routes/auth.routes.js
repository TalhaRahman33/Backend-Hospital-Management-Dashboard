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

const {
  getCurrentUser,
} = require("../controllers/auth/me.controller");

const authMiddleware = require("../middleware/auth.middleware");


const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;