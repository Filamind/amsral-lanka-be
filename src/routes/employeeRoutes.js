const express = require("express");
const EmployeeController = require("../controllers/employeeController");

const router = express.Router();

// GET /api/employees - Get all employees with pagination and filters
router.get("/", EmployeeController.getEmployees);

// GET /api/employees/stats - Get employee statistics
router.get("/stats", EmployeeController.getEmployeeStats);

// GET /api/employees/departments - Get all departments
router.get("/departments", EmployeeController.getDepartments);

// GET /api/employees/positions - Get all positions
router.get("/positions", EmployeeController.getPositions);

// GET /api/employees/department/:department - Get employees by department
router.get(
  "/department/:department",
  EmployeeController.getEmployeesByDepartment
);

// GET /api/employees/employee-id/:employeeId - Get employee by employee ID
router.get(
  "/employee-id/:employeeId",
  EmployeeController.getEmployeeByEmployeeId
);

// GET /api/employees/email/:email - Get employee by email
router.get("/email/:email", EmployeeController.getEmployeeByEmail);

// POST /api/employees - Create new employee
// POST /api/employees - Create new employee
router.post("/", EmployeeController.createEmployee);

// PUT /api/employees/:id - Update employee
router.put("/:id", EmployeeController.updateEmployee);

// DELETE /api/employees/:id - Delete employee (soft delete)
router.delete("/:id", EmployeeController.deleteEmployee);

// GET /api/employees/:id - Get employee by ID (should be last to avoid conflicts)
router.get("/:id", EmployeeController.getEmployeeById);

module.exports = router;
