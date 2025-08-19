const express = require("express");
const WashingTypeController = require("../controllers/washingTypeController");

const router = express.Router();

// GET /api/washing-types - Get all washing types with pagination and filtering
router.get("/", WashingTypeController.getWashingTypes);

// GET /api/washing-types/predefined - Get predefined washing types
router.get("/predefined", WashingTypeController.getPredefinedWashingTypes);

// GET /api/washing-types/stats - Get washing type statistics
router.get("/stats", WashingTypeController.getWashingTypeStats);

// GET /api/washing-types/code/:code - Get washing type by code
router.get("/code/:code", WashingTypeController.getWashingTypeByCode);

// GET /api/washing-types/:id - Get washing type by ID
router.get("/:id", WashingTypeController.getWashingTypeById);

// POST /api/washing-types - Create new washing type
router.post("/", WashingTypeController.createWashingType);

module.exports = router;
