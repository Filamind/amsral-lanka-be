const express = require("express");
const CustomerOrderLineProcessController = require("../controllers/customerOrderLineProcessController");

const router = express.Router();

// GET /api/customer-order-line-processes - Get all customer order line processes with pagination and filtering
router.get(
  "/",
  CustomerOrderLineProcessController.getCustomerOrderLineProcesses
);

// GET /api/customer-order-line-processes/order-line/:customerOrderLineId - Get processes by order line
router.get(
  "/order-line/:customerOrderLineId",
  CustomerOrderLineProcessController.getProcessesByOrderLine
);

// POST /api/customer-order-line-processes/bulk - Bulk create processes
router.post("/bulk", CustomerOrderLineProcessController.bulkCreateProcesses);

// GET /api/customer-order-line-processes/:id - Get customer order line process by ID
router.get(
  "/:id",
  CustomerOrderLineProcessController.getCustomerOrderLineProcessById
);

// POST /api/customer-order-line-processes - Create new customer order line process
router.post(
  "/",
  CustomerOrderLineProcessController.createCustomerOrderLineProcess
);

// PUT /api/customer-order-line-processes/:id - Update customer order line process
router.put(
  "/:id",
  CustomerOrderLineProcessController.updateCustomerOrderLineProcess
);

// PUT /api/customer-order-line-processes/:id/start - Start process
router.put("/:id/start", CustomerOrderLineProcessController.startProcess);

// PUT /api/customer-order-line-processes/:id/complete - Complete process
router.put("/:id/complete", CustomerOrderLineProcessController.completeProcess);

// DELETE /api/customer-order-line-processes/:id - Delete customer order line process (soft delete)
router.delete(
  "/:id",
  CustomerOrderLineProcessController.deleteCustomerOrderLineProcess
);

module.exports = router;
