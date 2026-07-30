const { User, LoginOTP } = require("../../models/main");

const {
  compareOTP,
} = require("../../utils/otp");

const {
  generateAccessToken,
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

    // 3. Find latest OTP
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

    // 4. Check expiration
    if (new Date() > new Date(loginOTP.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // 5. Check maximum attempts
    if (loginOTP.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts",
      });
    }

    // 6. Compare OTP
    const otpMatched = await compareOTP(
      otp,
      loginOTP.otpHash
    );

    // 7. Wrong OTP
    if (!otpMatched) {
      await loginOTP.increment("attempts");

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 8. Mark OTP as verified
    await loginOTP.update({
      verifiedAt: new Date(),
    });

    // 9. Generate Access Token
    const accessToken = generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
    });

    // 10. Update last login
    await user.update({
      lastLoginAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",

      accessToken,

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