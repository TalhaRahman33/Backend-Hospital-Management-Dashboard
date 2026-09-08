const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const {
  createCheckup,
  getCheckups,
  getCheckupById,
  updateCheckup,
} = require("../controllers/checkup.controller");

const router = express.Router();

router.post("/", authMiddleware, createCheckup);
router.get("/", authMiddleware, getCheckups);
router.get("/:id", authMiddleware, getCheckupById);
router.put("/:id", authMiddleware, updateCheckup);

module.exports = router;