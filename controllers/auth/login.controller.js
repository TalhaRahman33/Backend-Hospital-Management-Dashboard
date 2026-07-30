const { User, LoginOTP } = require("../../models/main");

const { comparePassword } = require("../../utils/password");

const {
  generateOTP,
  hashOTP,
} = require("../../utils/otp");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Check user status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // 4. Check password
    const passwordMatched = await comparePassword(
      password,
      user.passwordHash
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 5. Delete old unverified OTPs for this user
    await LoginOTP.destroy({
      where: {
        userId: user.id,
        verifiedAt: null,
      },
    });

    // 6. Generate new OTP
    const otp = generateOTP();

    // 7. Hash OTP before storing it
    const otpHash = await hashOTP(otp);

    // 8. OTP expires after 5 minutes
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // 9. Save OTP in database
    await LoginOTP.create({
      userId: user.id,
      otpHash,
      expiresAt,
    });

    // Development only
    console.log(`OTP for ${email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      requires2FA: true,
      userId: user.id,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  login,
};