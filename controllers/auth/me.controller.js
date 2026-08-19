const {
  User,
  Role,
  UserHospital,
  Hospital,
} = require("../../models/main");

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: {
        exclude: ["passwordHash"],
      },
      include: [
        {
          model: Role,
          as: "role",
          attributes: ["id", "name"],
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          where: {
            isActive: true,
          },
          required: false,
          attributes: ["id", "hospitalId", "isActive", "assignedAt"],
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
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get current user",
    });
  }
};

module.exports = {
  getCurrentUser,
};
