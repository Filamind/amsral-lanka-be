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

// GET /api/orders/invoice-preview/:customerId - Get next invoice number for a customer
router.get("/invoice-preview/:customerId", OrderController.getInvoicePreview);

// POST /api/orders/generate-invoice-batch - Generate invoice number for multiple orders
router.post("/generate-invoice-batch", OrderController.generateInvoiceBatch);

// GET /api/orders/:id/details - Get comprehensive order details with records, assignments, and completion percentage
router.get("/:id/details", OrderController.getOrderDetails);

// GET /api/orders/:id/summary - Get order summary with customer and records details
router.get("/:id/summary", OrderController.getOrderSummary);

// GET /api/orders/:id/records-details - Get order details with records and remaining quantity
router.get("/:id/records-details", OrderController.getOrderRecordsDetails);

// GET /api/orders/:id - Get single order by ID
router.get("/:id", OrderController.getOrderById);

// POST /api/orders - Create new order
router.post("/", OrderController.createOrder);

// POST /api/orders/:orderId/records - Add order record
router.post("/:orderId/records", OrderController.addOrderRecord);

// POST /api/orders/:orderId/damage-records - Update damage counts for order records
router.post("/:orderId/damage-records", OrderController.updateDamageRecords);

// PUT /api/orders/:id - Update order
router.put("/:id", OrderController.updateOrder);

// DELETE /api/orders/:id - Delete order
router.delete("/:id", OrderController.deleteOrder);

// DELETE /api/orders - Delete all orders (for testing purposes)
router.delete("/", OrderController.deleteAllOrders);

module.exports = router;
