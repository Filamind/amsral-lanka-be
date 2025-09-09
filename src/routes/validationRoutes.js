const express = require("express");
const ValidationController = require("../controllers/validationController");

const router = express.Router();

// POST /api/validation/check-unique - Check if field value is unique
router.post("/check-unique", ValidationController.checkUniqueField);

module.exports = router;
