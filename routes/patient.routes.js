const express = require("express");

const {
  createPatient,
  getAllPatients,
  getPatientById,
  getPatientByVisitNumber,
  updatePatient,
  deletePatient,
} = require("../controllers/patient.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, createPatient);
router.get("/", authMiddleware, getAllPatients);
router.get("/visit/:visitNumber", authMiddleware, getPatientByVisitNumber);
router.get("/:id", authMiddleware, getPatientById);
router.put("/:id", authMiddleware, updatePatient);
router.delete("/:id", authMiddleware, deletePatient);

module.exports = router;
