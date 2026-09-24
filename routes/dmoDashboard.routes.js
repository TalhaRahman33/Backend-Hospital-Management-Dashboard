const express = require("express");
const roleMiddleware = require("../middleware/role.middleware");
const {
  getDmoDashboard,
  getDmoHospitalDashboard,
} = require("../controllers/dmoDashboard.controller");

const router = express.Router();

router.use(roleMiddleware("DMO"));
router.get("/", getDmoDashboard);
router.get("/hospitals/:hospitalId", getDmoHospitalDashboard);

module.exports = router;