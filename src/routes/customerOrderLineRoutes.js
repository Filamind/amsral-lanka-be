const express = require("express");
const CustomerOrderLineController = require("../controllers/customerOrderLineController");

const router = express.Router();

// GET /api/customer-order-lines - Get all customer order lines with pagination and filtering
router.get("/", CustomerOrderLineController.getCustomerOrderLines);

// GET /api/customer-order-lines/order/:customerOrderId - Get order lines by customer order
router.get(
  "/order/:customerOrderId",
  CustomerOrderLineController.getOrderLinesByCustomerOrder
);

// GET /api/customer-order-lines/item-type/:itemTypeId - Get order lines by item type
router.get(
  "/item-type/:itemTypeId",
  CustomerOrderLineController.getOrderLinesByItemType
);

// GET /api/customer-order-lines/:id - Get customer order line by ID
router.get("/:id", CustomerOrderLineController.getCustomerOrderLineById);

// POST /api/customer-order-lines - Create new customer order line
router.post("/", CustomerOrderLineController.createCustomerOrderLine);

// PUT /api/customer-order-lines/:id - Update customer order line
router.put("/:id", CustomerOrderLineController.updateCustomerOrderLine);

// DELETE /api/customer-order-lines/:id - Delete customer order line (soft delete)
router.delete("/:id", CustomerOrderLineController.deleteCustomerOrderLine);

module.exports = router;
