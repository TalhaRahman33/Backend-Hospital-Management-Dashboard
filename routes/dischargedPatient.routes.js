const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { getDischargedPatients } = require("../controllers/dischargedPatient.controller");

const router = express.Router();

router.get("/", authMiddleware, getDischargedPatients);

module.exports = router;