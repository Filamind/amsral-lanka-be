const express = require("express");
const CustomerOrderController = require("../controllers/customerOrderController");

const router = express.Router();

// GET /api/customer-orders - Get all customer orders with pagination and filtering
router.get("/", CustomerOrderController.getCustomerOrders);

// GET /api/customer-orders/generate-order-number - Generate next order number
router.get(
  "/generate-order-number",
  CustomerOrderController.generateOrderNumber
);

// GET /api/customer-orders/stats - Get customer order statistics
router.get("/stats", CustomerOrderController.getCustomerOrderStats);

// GET /api/customer-orders/order-number/:orderNumber - Get customer order by order number
router.get(
  "/order-number/:orderNumber",
  CustomerOrderController.getCustomerOrderByOrderNumber
);

// GET /api/customer-orders/customer/:customerId - Get orders by customer
router.get(
  "/customer/:customerId",
  CustomerOrderController.getOrdersByCustomer
);

// GET /api/customer-orders/status/:status - Get orders by status
router.get("/status/:status", CustomerOrderController.getOrdersByStatus);

// GET /api/customer-orders/:id - Get customer order by ID
router.get("/:id", CustomerOrderController.getCustomerOrderById);

// POST /api/customer-orders - Create new customer order
router.post("/", CustomerOrderController.createCustomerOrder);

// PUT /api/customer-orders/:id - Update customer order
router.put("/:id", CustomerOrderController.updateCustomerOrder);

// DELETE /api/customer-orders/:id - Delete customer order (soft delete)
router.delete("/:id", CustomerOrderController.deleteCustomerOrder);

module.exports = router;
