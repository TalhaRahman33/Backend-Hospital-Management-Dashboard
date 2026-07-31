const bcrypt = require("bcryptjs");

const {
  User,
  Role,
  Hospital,
  UserHospital,
} = require("../models/main");

// =====================================================
// CREATE USER
// POST /api/users
// =====================================================

const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      roleId,
      hospitalIds,
    } = req.body;

    // Super Admin ID comes from authMiddleware
    const assignedBy = req.user.userId;

    // -------------------------------------------------
    // Basic validation
    // -------------------------------------------------

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !roleId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "firstName, lastName, email, password and roleId are required",
      });
    }

    // -------------------------------------------------
    // Find role
    // -------------------------------------------------

    const role = await Role.findByPk(roleId);

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const roleName = role.name.toUpperCase();

    const allowedRoles = [
      "SUPER_ADMIN",
      "PMO",
      "DMO",
      "HFO",
      "DOCTORS",
    ];

    if (!allowedRoles.includes(roleName)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // -------------------------------------------------
    // Don't create another Super Admin
    // -------------------------------------------------

    if (roleName === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin cannot be created through this API",
      });
    }

    // -------------------------------------------------
    // Check duplicate email
    // -------------------------------------------------

    const existingUser = await User.findOne({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // -------------------------------------------------
    // Hospital assignment validation
    // -------------------------------------------------

    const ids = Array.isArray(hospitalIds)
      ? hospitalIds
      : [];

    if (ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one hospital is required",
      });
    }

    // HFO and Doctor = only ONE hospital
    if (
      (roleName === "HFO" || roleName === "DOCTORS") &&
      ids.length !== 1
    ) {
      return res.status(400).json({
        success: false,
        message: `${roleName} can only be assigned to one hospital`,
      });
    }

    // PMO and DMO = multiple hospitals allowed
    // No maximum here

    // -------------------------------------------------
    // Check hospitals exist
    // -------------------------------------------------

    const hospitals = await Hospital.findAll({
      where: {
        id: ids,
      },
    });

    if (hospitals.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more hospitals are invalid",
      });
    }

    // -------------------------------------------------
    // Hash password
    // -------------------------------------------------

    const passwordHash = await bcrypt.hash(password, 12);

    // -------------------------------------------------
    // Create User
    // -------------------------------------------------

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || null,
      passwordHash,
      roleId,
      status: "ACTIVE",
      isEmailVerified: false,
      isPhoneVerified: false,
      twoFactorEnabled: true,
    });

    // -------------------------------------------------
    // Create hospital assignments
    // -------------------------------------------------

    const assignments = ids.map((hospitalId) => ({
      userId: user.id,
      hospitalId,
      isActive: true,
      assignedAt: new Date(),
      unassignedAt: null,
      assignedBy,
    }));

    await UserHospital.bulkCreate(assignments);

    // -------------------------------------------------
    // Get complete user
    // -------------------------------------------------

    const createdUser = await User.findByPk(user.id, {
      attributes: {
        exclude: ["passwordHash"],
      },
      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          include: [
            {
              model: Hospital,
              as: "hospital",
            },
          ],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    console.error("Create user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["passwordHash"],
      },

      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          include: [
            {
              model: Hospital,
              as: "hospital",
            },
          ],
        },
      ],

      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

// =====================================================
// GET USER BY ID
// GET /api/users/:id
// =====================================================

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["passwordHash"],
      },

      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          include: [
            {
              model: Hospital,
              as: "hospital",
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
    console.error("Get user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user",
    });
  }
};

// =====================================================
// UPDATE USER
// PUT /api/users/:id
// =====================================================

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      roleId,
      status,
      hospitalIds,
    } = req.body;

    const assignedBy = req.user.userId;

    // -------------------------------------------------
    // Find user
    // -------------------------------------------------

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // Find role
    // -------------------------------------------------

    let role = null;
    let roleName = null;

    if (roleId) {
      role = await Role.findByPk(roleId);

      if (!role) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      roleName = role.name.toUpperCase();

      if (roleName === "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          message:
            "User cannot be changed to Super Admin through this API",
        });
      }
    } else {
      // Get existing role
      role = await Role.findByPk(user.roleId);

      if (!role) {
        return res.status(400).json({
          success: false,
          message: "User role not found",
        });
      }

      roleName = role.name.toUpperCase();
    }

    // -------------------------------------------------
    // Check duplicate email
    // -------------------------------------------------

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        where: {
          email,
        },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // -------------------------------------------------
    // Update basic information
    // -------------------------------------------------

    if (firstName !== undefined) {
      user.firstName = firstName;
    }

    if (lastName !== undefined) {
      user.lastName = lastName;
    }

    if (email !== undefined) {
      user.email = email;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (status !== undefined) {
      user.status = status;
    }

    if (roleId !== undefined) {
      user.roleId = roleId;
    }

    // -------------------------------------------------
    // Update password if provided
    // -------------------------------------------------

    if (password) {
      user.passwordHash = await bcrypt.hash(password, 12);
    }

    await user.save();

    // -------------------------------------------------
    // Update hospital assignments
    // -------------------------------------------------

    if (hospitalIds !== undefined) {
      const ids = Array.isArray(hospitalIds)
        ? hospitalIds
        : [];

      if (ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one hospital is required",
        });
      }

      // HFO / DOCTORS = one hospital
      if (
        (roleName === "HFO" || roleName === "DOCTORS") &&
        ids.length !== 1
      ) {
        return res.status(400).json({
          success: false,
          message: `${roleName} can only be assigned to one hospital`,
        });
      }

      // Check hospitals
      const hospitals = await Hospital.findAll({
        where: {
          id: ids,
        },
      });

      if (hospitals.length !== ids.length) {
        return res.status(400).json({
          success: false,
          message: "One or more hospitals are invalid",
        });
      }

      // Get current active assignments
      const currentAssignments =
        await UserHospital.findAll({
          where: {
            userId: user.id,
            isActive: true,
          },
        });

      const currentHospitalIds = currentAssignments.map(
        (assignment) => assignment.hospitalId
      );

      // Deactivate removed hospitals
      for (const assignment of currentAssignments) {
        if (!ids.includes(assignment.hospitalId)) {
          assignment.isActive = false;
          assignment.unassignedAt = new Date();

          await assignment.save();
        }
      }

      // Add new hospitals
      for (const hospitalId of ids) {
        if (!currentHospitalIds.includes(hospitalId)) {
          await UserHospital.create({
            userId: user.id,
            hospitalId,
            isActive: true,
            assignedAt: new Date(),
            unassignedAt: null,
            assignedBy,
          });
        }
      }
    }

    // -------------------------------------------------
    // Return updated user
    // -------------------------------------------------

    const updatedUser = await User.findByPk(user.id, {
      attributes: {
        exclude: ["passwordHash"],
      },

      include: [
        {
          model: Role,
          as: "role",
        },
        {
          model: UserHospital,
          as: "hospitalAssignments",
          include: [
            {
              model: Hospital,
              as: "hospital",
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// =====================================================
// DELETE USER
// DELETE /api/users/:id
// =====================================================

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // -------------------------------------------------
    // Don't allow Super Admin to delete himself
    // -------------------------------------------------

    if (Number(id) === Number(req.user.userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // Delete hospital assignments first
    // -------------------------------------------------

    await UserHospital.destroy({
      where: {
        userId: user.id,
      },
    });

    // -------------------------------------------------
    // Delete user
    // -------------------------------------------------

    await user.destroy();

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};