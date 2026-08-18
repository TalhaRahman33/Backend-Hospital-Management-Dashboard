const { User, LoginOTP } = require("../../models/main");

const { compareOTP } = require("../../utils/otp");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");

const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // 1. Validate input
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required",
      });
    }

    // 2. Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Check user status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // 4. Find latest unused OTP
    const loginOTP = await LoginOTP.findOne({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!loginOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or already used",
      });
    }

    // 5. Check expiration
    if (new Date() > new Date(loginOTP.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // 6. Check maximum attempts
    if (loginOTP.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts",
      });
    }

    // 7. Compare OTP
    const otpMatched = await compareOTP(
      otp,
      loginOTP.otpHash
    );

    // 8. Wrong OTP
    if (!otpMatched) {
      await loginOTP.increment("attempts");

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 9. Mark OTP as verified
    await loginOTP.update({
      verifiedAt: new Date(),
    });

    // 10. Generate tokens
    const accessToken = generateAccessToken({
      id: user.id,
      roleId: user.roleId,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
    });

    // 11. Store tokens in HttpOnly cookies

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 12. Update last login
    await user.update({
      lastLoginAt: new Date(),
    });

    // 13. Response with tokens for localStorage
    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleId: user.roleId,
      },
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  verifyOTP,
};