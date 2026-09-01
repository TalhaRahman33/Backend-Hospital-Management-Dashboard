const jwt = require("jsonwebtoken");
const { User, Role, UserHospital, Hospital } = require("../models/main");

const clearAuthCookies = (res) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const sendAuthError = (res, statusCode, code, message, redirectTo = "/login") => {
  clearAuthCookies(res);

  return res.status(statusCode).json({
    success: false,
    code,
    message,
    friendlyMessage: "Your session has expired because you were inactive for a while. Please sign in again.",
    redirectTo,
  });
};

const authMiddleware = async (req, res, next) => {
  try {
    // Support both cookie-based tokens and Authorization header tokens
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers?.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";
    const token = cookieToken || headerToken;

    if (!token) {
      return sendAuthError(
        res,
        401,
        "AUTH_REQUIRED",
        "Authentication required. Please login again.",
        "/login"
      );
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    // Find actual user
    const user = await User.findByPk(decoded.userId, {
      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          where: {
            isActive: true,
          },
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

    if (!user) {
      return sendAuthError(
        res,
        401,
        "USER_NOT_FOUND",
        "User no longer exists. Please login again.",
        "/login"
      );
    }

    // Check status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    const activeHospitalAssignments = user.hospitalAssignments || [];
    const defaultHospital = activeHospitalAssignments[0]?.hospital || null;

    // Store authenticated user
    req.user = {
      userId: user.id,
      roleId: user.roleId,
      role: user.role?.name,
      hospitalAssignments: activeHospitalAssignments,
      hospitalId: defaultHospital?.id || null,
      hospitalName: defaultHospital?.name || null,
    };

    next();

  } catch (error) {
    console.error("Auth middleware error:", error.message);
    console.error("Error name:", error.name);
    console.error("Full error:", error);

    if (error.name === "TokenExpiredError") {
      return sendAuthError(
        res,
        401,
        "TOKEN_EXPIRED",
        "Session expired. Please login again.",
        "/login"
      );
    }

    if (error.name === "JsonWebTokenError") {
      return sendAuthError(
        res,
        401,
        "INVALID_TOKEN",
        "Invalid access token. Please login again.",
        "/login"
      );
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = authMiddleware;