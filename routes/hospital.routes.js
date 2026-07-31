const express = require("express");

const {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
} = require("../controllers/hospital.controller");

const router = express.Router();

// Create
router.post("/", createHospital);

// Read all
router.get("/", getHospitals);

// Read one
router.get("/:id", getHospitalById);

// Update
router.put("/:id", updateHospital);

// Delete
router.delete("/:id", deleteHospital);

module.exports = router;