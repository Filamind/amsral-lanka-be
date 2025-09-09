const express = require("express");
const ReferenceController = require("../controllers/referenceController");

const router = express.Router();

// GET /api/reference/wash-types - Get all wash types
router.get("/wash-types", ReferenceController.getWashTypes);

// GET /api/reference/process-types - Get all process types
router.get("/process-types", ReferenceController.getProcessTypes);

// GET /api/reference/machines - Get all machines
router.get("/machines", ReferenceController.getMachines);

module.exports = router;
