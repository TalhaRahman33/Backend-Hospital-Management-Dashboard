const { User, LoginOTP } = require("../../models/main");

const {
  generateOTP,
  hashOTP,
} = require("../../utils/otp");

const {
  sendLoginOTP,
} = require("../../utils/email");

const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // =====================================================
    // 1. Validate
    // =====================================================

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // =====================================================
    // 2. Find user
    // =====================================================

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // =====================================================
    // 3. Check last OTP
    // =====================================================

    const lastOTP = await LoginOTP.findOne({
      where: {
        userId: user.id,
      },
      order: [["createdAt", "DESC"]],
    });

    // =====================================================
    // 4. 1 minute resend cooldown
    // =====================================================

    if (lastOTP) {
      const now = Date.now();
      const createdAt = new Date(lastOTP.createdAt).getTime();

      const difference = now - createdAt;

      const cooldown = 60 * 1000; // 1 minute

      if (difference < cooldown) {
        const remainingSeconds = Math.ceil(
          (cooldown - difference) / 1000
        );

        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another OTP`,
          remainingSeconds,
        });
      }
    }

    // =====================================================
    // 5. Delete previous OTPs
    // =====================================================

    await LoginOTP.destroy({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    });

    // =====================================================
    // 6. Generate new OTP
    // =====================================================

    const otp = generateOTP();

    // =====================================================
    // 7. Hash OTP
    // =====================================================

    const otpHash = await hashOTP(otp);

    // =====================================================
    // 8. OTP expires after 5 minutes
    // =====================================================

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // =====================================================
    // 9. Save OTP
    // =====================================================

    await LoginOTP.create({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    // =====================================================
    // 10. Send email
    // =====================================================

    try {
      await sendLoginOTP(
        user.email,
        otp
      );
    } catch (emailError) {
      console.error(
        "Resend OTP email error:",
        emailError
      );

      await LoginOTP.destroy({
        where: {
          userId: user.id,
          verifiedAt: null,
        },
      });

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP",
      });
    }

    // =====================================================
    // 11. Response
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
      userId: user.id,

      resendCooldown: 60,

      otpExpiresIn: 300,
    });

  } catch (error) {
    console.error(
      "Resend OTP error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  resendOTP,
};