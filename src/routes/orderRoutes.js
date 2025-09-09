const express = require("express");
const OrderController = require("../controllers/orderController");
const router = express.Router();

// PUT /api/orders/:orderId/records/:recordId - Update order record
router.put("/:orderId/records/:recordId", OrderController.updateOrderRecord);

// DELETE /api/orders/:orderId/records/:recordId - Delete order record
router.delete("/:orderId/records/:recordId", OrderController.deleteOrderRecord);

// GET /api/orders - Get all orders with pagination and search
router.get("/", OrderController.getAllOrders);

// GET /api/orders/wash-types - Get valid wash types
router.get("/wash-types", OrderController.getWashTypes);

// GET /api/orders/process-types - Get valid process types
router.get("/process-types", OrderController.getProcessTypes);

// GET /api/orders/records - Get all order records with pagination and filtering
router.get("/records", OrderController.getAllOrderRecords);

// GET /api/orders/:id - Get single order by ID
router.get("/:id", OrderController.getOrderById);

// POST /api/orders - Create new order
router.post("/", OrderController.createOrder);

// POST /api/orders/:orderId/records - Add order record
router.post("/:orderId/records", OrderController.addOrderRecord);

// PUT /api/orders/:id - Update order
router.put("/:id", OrderController.updateOrder);

// DELETE /api/orders/:id - Delete order
router.delete("/:id", OrderController.deleteOrder);

module.exports = router;
