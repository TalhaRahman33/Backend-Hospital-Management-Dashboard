const {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenExpiryMs,
  getRefreshTokenExpiryMs,
} = require("../../utils/jwt");
const { User, Role, UserHospital, Hospital } = require("../../models/main");

const refreshSession = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Hospital,
              as: "hospital",
              attributes: ["id", "name", "code"],
            },
          ],
        },
      ],
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        message: "Session invalid or user inactive",
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
    });

    const nextRefreshToken = generateRefreshToken({
      userId: user.id,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: getAccessTokenExpiryMs(),
    });

    res.cookie("refreshToken", nextRefreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: getRefreshTokenExpiryMs(),
    });

    const defaultHospital = user.hospitalAssignments?.[0]?.hospital || null;

    return res.status(200).json({
      success: true,
      message: "Session refreshed successfully",
      accessToken,
      refreshToken: nextRefreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleId: user.roleId,
        role: user.role,
        hospitalId: defaultHospital?.id || null,
        hospitalName: defaultHospital?.name || null,
        hospitalAssignments: user.hospitalAssignments,
      },
    });
  } catch (error) {
    console.error("Refresh session error:", error);

    return res.status(401).json({
      success: false,
      message: "Refresh token expired or invalid",
    });
  }
};

module.exports = {
  refreshSession,
};
