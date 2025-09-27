const express = require("express");
const BillingController = require("../controllers/billingController");

const router = express.Router();

// 1. Get Billing Orders
router.get("/orders", BillingController.getBillingOrders);

// 2. Create Invoice
router.post("/invoices", BillingController.createInvoice);

// 3. Save Order and Record Pricing
router.post("/orders/pricing", BillingController.saveOrderPricing);

// 4. Get Order Pricing History
router.get(
  "/orders/:orderId/pricing",
  BillingController.getOrderPricingHistory
);

// 5. Update Order Record Pricing
router.patch(
  "/orders/:orderId/records/:recordId/pricing",
  BillingController.updateRecordPricing
);

// 6. Get Invoices
router.get("/invoices", BillingController.getInvoices);

// 7. Get Invoice by ID
router.get("/invoices/:invoiceId", BillingController.getInvoiceById);

// 8. Update Invoice Status
router.patch(
  "/invoices/:invoiceId/status",
  BillingController.updateInvoiceStatus
);

// 9. Mark Invoice as Paid
router.patch("/invoices/:invoiceId/pay", BillingController.markInvoiceAsPaid);

// 10. Delete Invoice
router.delete("/invoices/:invoiceId", BillingController.deleteInvoice);

// 11. Get Billing Statistics
router.get("/stats", BillingController.getBillingStats);

// 12. Get Overdue Invoices
router.get("/invoices/overdue", BillingController.getOverdueInvoices);

// 13. Send Invoice Reminder
router.post(
  "/invoices/:invoiceId/remind",
  BillingController.sendInvoiceReminder
);

// 14. Generate Invoice PDF
router.get("/invoices/:invoiceId/pdf", BillingController.generateInvoicePDF);

// 15. Update Order Billing Status
router.patch(
  "/orders/:orderId/status",
  BillingController.updateOrderBillingStatus
);

// 16. Get Customer Billing History
router.get(
  "/customers/:customerId/history",
  BillingController.getCustomerBillingHistory
);

// 17. Get Income Analytics
router.get("/income", BillingController.getIncomeAnalytics);

// 18. Get Income Summary
router.get("/income/summary", BillingController.getIncomeSummary);

// 19. Get Income Trends
router.get("/income/trends", BillingController.getIncomeTrends);

// 20. Get Top Customers
router.get("/top-customers", BillingController.getTopCustomers);

// 21. Update Invoice Payment
router.patch(
  "/invoices/:invoiceId/payment",
  BillingController.updateInvoicePayment
);

module.exports = router;
