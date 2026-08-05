const express = require("express");

const {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
} = require("../controllers/hospital.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// Only SUPER_ADMIN can manage hospitals
router.post(
  "/",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  createHospital
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  getHospitals
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  getHospitalById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  updateHospital
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("SUPER_ADMIN"),
  deleteHospital
);

module.exports = router;