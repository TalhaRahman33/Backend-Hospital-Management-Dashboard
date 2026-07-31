const express = require("express");

const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// Only SUPER_ADMIN can manage users

router.post(
  "/",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  createUser
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  getAllUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  getUserById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  deleteUser
);

module.exports = router;