const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  getInPatients,
  dischargeInPatient,
} = require("../controllers/inPatient.controller");

const router = express.Router();

router.get("/", authMiddleware, getInPatients);
router.put("/:id/discharge", authMiddleware, dischargeInPatient);

module.exports = router;