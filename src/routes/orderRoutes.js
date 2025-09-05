const express = require("express");
const OrderController = require("../controllers/orderController");

const router = express.Router();

// GET /api/orders - Get all orders with pagination and search
router.get("/", OrderController.getAllOrders);

// GET /api/orders/wash-types - Get valid wash types
router.get("/wash-types", OrderController.getWashTypes);

// GET /api/orders/process-types - Get valid process types
router.get("/process-types", OrderController.getProcessTypes);

// GET /api/orders/:id - Get single order by ID
router.get("/:id", OrderController.getOrderById);

// POST /api/orders - Create new order
router.post("/", OrderController.createOrder);

// PUT /api/orders/:id - Update order
router.put("/:id", OrderController.updateOrder);

// DELETE /api/orders/:id - Delete order
router.delete("/:id", OrderController.deleteOrder);

module.exports = router;
