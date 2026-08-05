const jwt = require("jsonwebtoken");
const { User, Role } = require("../models/main");

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
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
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
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // Check status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    // Store authenticated user
    req.user = {
      userId: user.id,
      roleId: user.roleId,
      role: user.role?.name,
    };

    next();

  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = authMiddleware;