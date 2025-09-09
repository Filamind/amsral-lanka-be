const express = require("express");
const ItemTypeController = require("../controllers/itemTypeController");

const router = express.Router();

// GET /api/item-types - Get all item types with pagination and filtering
router.get("/", ItemTypeController.getItemTypes);

// GET /api/item-types/list - Get item types list for dropdowns/selects
router.get("/list", ItemTypeController.getItemTypesList);

// GET /api/item-types/predefined - Get predefined item types
router.get("/predefined", ItemTypeController.getPredefinedItemTypes);

// GET /api/item-types/stats - Get item type statistics
router.get("/stats", ItemTypeController.getItemTypeStats);

// GET /api/item-types/categories - Get all categories
router.get("/categories", ItemTypeController.getCategories);

// GET /api/item-types/code/:code - Get item type by code
router.get("/code/:code", ItemTypeController.getItemTypeByCode);

// GET /api/item-types/category/:category - Get item types by category
router.get("/category/:category", ItemTypeController.getItemTypesByCategory);

// GET /api/item-types/:id - Get item type by ID
router.get("/:id", ItemTypeController.getItemTypeById);

// POST /api/item-types - Create new item type
router.post("/", ItemTypeController.createItemType);

// PUT /api/item-types/:id - Update item type
router.put("/:id", ItemTypeController.updateItemType);

// DELETE /api/item-types/:id - Delete item type (soft delete)
router.delete("/:id", ItemTypeController.deleteItemType);

module.exports = router;
