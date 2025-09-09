const express = require("express");
const ProcessTypeController = require("../controllers/processTypeController");

const router = express.Router();

// GET /api/process-types - Get all process types with pagination and filtering
router.get("/", ProcessTypeController.getProcessTypes);

// GET /api/process-types/list - Get process types list for dropdowns/selects
router.get("/list", ProcessTypeController.getProcessTypesList);

// GET /api/process-types/stats - Get process type statistics
router.get("/stats", ProcessTypeController.getProcessTypeStats);

// GET /api/process-types/code/:code - Get process type by code
router.get("/code/:code", ProcessTypeController.getProcessTypeByCode);

// GET /api/process-types/:id - Get process type by ID
router.get("/:id", ProcessTypeController.getProcessTypeById);

// POST /api/process-types - Create new process type
router.post("/", ProcessTypeController.createProcessType);

// PUT /api/process-types/:id - Update existing process type
router.put("/:id", ProcessTypeController.updateProcessType);

// DELETE /api/process-types/:id - Delete process type
router.delete("/:id", ProcessTypeController.deleteProcessType);

module.exports = router;
