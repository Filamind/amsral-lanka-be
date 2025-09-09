const express = require("express");
const ItemController = require("../controllers/itemController");

const router = express.Router();

// GET /api/items - Get all items with pagination and filtering
router.get("/", ItemController.getItems);

// GET /api/items/list - Get items list for dropdowns/selects
router.get("/list", ItemController.getItemsList);

// GET /api/items/stats - Get item statistics
router.get("/stats", ItemController.getItemStats);

// GET /api/items/:id - Get item by ID
router.get("/:id", ItemController.getItemById);

// POST /api/items - Create new item
router.post("/", ItemController.createItem);

// PUT /api/items/:id - Update existing item
router.put("/:id", ItemController.updateItem);

// DELETE /api/items/:id - Delete item
router.delete("/:id", ItemController.deleteItem);

module.exports = router;
