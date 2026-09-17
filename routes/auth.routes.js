const express = require("express");

const {
  login,
} = require("../controllers/auth/login.controller");

const {
  verifyOTP,
} = require("../controllers/auth/verifyOTP.controller");

const {
  refreshSession,
} = require("../controllers/auth/refresh.controller");

const {
  resendOTP,
} = require("../controllers/auth/resendOTP.controller");

const {
  forgotPassword,
  resetPassword,
} = require("../controllers/auth/forgotPassword.controller");

const {
  getCurrentUser,
} = require("../controllers/auth/me.controller");

const authMiddleware = require("../middleware/auth.middleware");

const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const router = express.Router();

router.post("/login", login);
router.post("/verify-otp", verifyOTP);
router.post("/refresh", refreshSession);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", (req, res) => {
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;