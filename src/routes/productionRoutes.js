const express = require("express");
const ProductionController = require("../controllers/productionController");

const router = express.Router();

// GET /api/production/records - Get all production records
router.get("/records", ProductionController.getProductionRecords);

// GET /api/production/assignments - Get machine assignments
router.get("/assignments", ProductionController.getMachineAssignments);

// POST /api/production/assignments - Create machine assignment
router.post("/assignments", ProductionController.createMachineAssignment);

module.exports = router;
