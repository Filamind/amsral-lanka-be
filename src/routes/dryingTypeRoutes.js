const express = require("express");
const DryingTypeController = require("../controllers/dryingTypeController");

const router = express.Router();

// GET /api/drying-types - Get all drying types with pagination and filtering
router.get("/", DryingTypeController.getDryingTypes);

// GET /api/drying-types/predefined - Get predefined drying types
router.get("/predefined", DryingTypeController.getPredefinedDryingTypes);

// GET /api/drying-types/stats - Get drying type statistics
router.get("/stats", DryingTypeController.getDryingTypeStats);

// GET /api/drying-types/code/:code - Get drying type by code
router.get("/code/:code", DryingTypeController.getDryingTypeByCode);

// GET /api/drying-types/:id - Get drying type by ID
router.get("/:id", DryingTypeController.getDryingTypeById);

// POST /api/drying-types - Create new drying type
router.post("/", DryingTypeController.createDryingType);

module.exports = router;
