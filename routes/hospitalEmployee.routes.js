const express = require("express");

const {
  createHospitalEmployee,
  getHospitalEmployees,
  getHospitalEmployeeById,
  updateHospitalEmployee,
  deleteHospitalEmployee,
} = require("../controllers/hospitalEmployee.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createHospitalEmployee);
router.get("/", authMiddleware, getHospitalEmployees);
router.get("/:id", authMiddleware, getHospitalEmployeeById);
router.put("/:id", authMiddleware, updateHospitalEmployee);
router.delete("/:id", authMiddleware, deleteHospitalEmployee);

module.exports = router;
