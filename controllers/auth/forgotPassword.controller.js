const { User, PasswordResetOTP } = require("../../models/main");
const { hashPassword } = require("../../utils/password");
const { generateOTP, hashOTP, compareOTP } = require("../../utils/otp");
const { sendPasswordResetOTP } = require("../../utils/email");

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    await PasswordResetOTP.destroy({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    });

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await PasswordResetOTP.create({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    try {
      await sendPasswordResetOTP(user.email, otp);
    } catch (emailError) {
      console.error("Forgot password email error:", emailError);

      await PasswordResetOTP.destroy({
        where: {
          userId: user.id,
          verifiedAt: null,
        },
      });

      return res.status(500).json({
        success: false,
        message: "Unable to send password reset OTP to your email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email",
      userId: user.id,
      otpExpiresIn: 300,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const resetOTP = await PasswordResetOTP.findOne({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!resetOTP) {
      return res.status(400).json({
        success: false,
        message: "No active password reset OTP found",
      });
    }

    if (new Date() > new Date(resetOTP.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "Password reset OTP has expired",
      });
    }

    if (resetOTP.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect OTP attempts",
      });
    }

    const otpMatched = await compareOTP(otp, resetOTP.otpHash);

    if (!otpMatched) {
      await resetOTP.increment("attempts");

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const passwordHash = await hashPassword(newPassword);

    await user.update({
      passwordHash,
    });

    await resetOTP.update({
      verifiedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  forgotPassword,
  resetPassword,
};
