const express = require("express");
const MachineTypeController = require("../controllers/machineTypeController");

const router = express.Router();

// GET /api/machine-types - Get all machine types with pagination and filtering
router.get("/", MachineTypeController.getMachineTypes);

// GET /api/machine-types/list - Get machine types list for dropdowns/selects
router.get("/list", MachineTypeController.getMachineTypesList);

// GET /api/machine-types/stats - Get machine type statistics
router.get("/stats", MachineTypeController.getMachineTypeStats);

// GET /api/machine-types/types - Get unique machine types
router.get("/types", MachineTypeController.getUniqueTypes);

// GET /api/machine-types/:id - Get machine type by ID
router.get("/:id", MachineTypeController.getMachineTypeById);

// POST /api/machine-types - Create new machine type
router.post("/", MachineTypeController.createMachineType);

// PUT /api/machine-types/:id - Update existing machine type
router.put("/:id", MachineTypeController.updateMachineType);

// DELETE /api/machine-types/:id - Delete machine type
router.delete("/:id", MachineTypeController.deleteMachineType);

module.exports = router;
