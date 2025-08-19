const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const washingTypeRoutes = require("./routes/washingTypeRoutes");
const dryingTypeRoutes = require("./routes/dryingTypeRoutes");
const customerRoutes = require("./routes/customerRoutes");
const itemTypeRoutes = require("./routes/itemTypeRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");
const customerOrderLineRoutes = require("./routes/customerOrderLineRoutes");
const customerOrderLineProcessRoutes = require("./routes/customerOrderLineProcessRoutes");

// Import database connection
const { pool } = require("./config/db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test database connection
    await pool.query("SELECT 1");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/washing-types", washingTypeRoutes);
app.use("/api/drying-types", dryingTypeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/item-types", itemTypeRoutes);
app.use("/api/customer-orders", customerOrderRoutes);
app.use("/api/customer-order-lines", customerOrderLineRoutes);
app.use("/api/customer-order-line-processes", customerOrderLineProcessRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Amsral Lanka Backend API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      users: "/api/users",
      userById: "/api/users/:id",
      userByEmail: "/api/users/email/:email",
      userStats: "/api/users/stats",
      roles: "/api/roles",
      roleById: "/api/roles/:id",
      roleByName: "/api/roles/name/:name",
      roleStats: "/api/roles/stats",
      predefinedRoles: "/api/roles/predefined",
      employees: "/api/employees",
      employeeById: "/api/employees/:id",
      employeeByEmployeeId: "/api/employees/employee-id/:employeeId",
      employeeByEmail: "/api/employees/email/:email",
      employeeByDepartment: "/api/employees/department/:department",
      employeeStats: "/api/employees/stats",
      departments: "/api/employees/departments",
      positions: "/api/employees/positions",
      washingTypes: "/api/washing-types",
      dryingTypes: "/api/drying-types",
      customers: "/api/customers",
      itemTypes: "/api/item-types",
      customerOrders: "/api/customer-orders",
      customerOrderLines: "/api/customer-order-lines",
      customerOrderLineProcesses: "/api/customer-order-line-processes",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

module.exports = app;
