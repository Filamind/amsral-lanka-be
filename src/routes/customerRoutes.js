const express = require("express");
const CustomerController = require("../controllers/customerController");

const router = express.Router();

// GET /api/customers - Get all customers with pagination and filtering
router.get("/", CustomerController.getCustomers);

// GET /api/customers/list - Get customers list for dropdowns/selects
router.get("/list", CustomerController.getCustomersList);

// GET /api/customers/generate-code - Generate next customer code
router.get("/generate-code", CustomerController.generateCustomerCode);

// GET /api/customers/stats - Get customer statistics
router.get("/stats", CustomerController.getCustomerStats);

// GET /api/customers/code/:code - Get customer by customer code
router.get("/code/:code", CustomerController.getCustomerByCode);

// GET /api/customers/maplink/:maplink - Get customers by map link
router.get("/maplink/:maplink", CustomerController.getCustomersByMapLink);

// GET /api/customers/country/:country - Get customers by country
router.get("/country/:country", CustomerController.getCustomersByCountry);

// GET /api/customers/:id - Get customer by ID
router.get("/:id", CustomerController.getCustomerById);

// POST /api/customers - Create new customer
router.post("/", CustomerController.createCustomer);

// PUT /api/customers/:id - Update customer
router.put("/:id", CustomerController.updateCustomer);

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete("/:id", CustomerController.deleteCustomer);

module.exports = router;
