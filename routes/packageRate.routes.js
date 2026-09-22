const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createPackageRate,
  getPackageRates,
  getPackageRateById,
  updatePackageRate,
  deletePackageRate,
} = require("../controllers/packageRate.controller");

const router = express.Router();

router.post("/", authMiddleware, createPackageRate);
router.get("/", authMiddleware, getPackageRates);
router.get("/:id", authMiddleware, getPackageRateById);
router.put("/:id", authMiddleware, updatePackageRate);
router.delete("/:id", authMiddleware, deletePackageRate);

module.exports = router;