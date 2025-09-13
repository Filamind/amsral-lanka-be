const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const washingTypeRoutes = require("./routes/washingTypeRoutes");
const dryingTypeRoutes = require("./routes/dryingTypeRoutes");
const machineTypeRoutes = require("./routes/machineTypeRoutes");
const processTypeRoutes = require("./routes/processTypeRoutes");
const customerRoutes = require("./routes/customerRoutes");
const itemRoutes = require("./routes/itemRoutes");
const orderRoutes = require("./routes/orderRoutes");
const validationRoutes = require("./routes/validationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const productionRoutes = require("./routes/productionRoutes");
const referenceRoutes = require("./routes/referenceRoutes");
const recordRoutes = require("./routes/recordRoutes");
const machineAssignmentRoutes = require("./routes/machineAssignmentRoutes");

// Import database connection
const { pool } = require("./config/db");

const app = express();

// Middleware
app.use(
  cors({
    origin: true, // Allow all origins
    credentials: true, // Allow credentials
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
  })
);
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
app.use("/api/machine-types", machineTypeRoutes);
app.use("/api/process-types", processTypeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/production", productionRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/records", machineAssignmentRoutes);
app.use("/api/records", recordRoutes);
app.use("/api", machineAssignmentRoutes);

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
      machineTypes: "/api/machine-types",
      processTypes: "/api/process-types",
      customers: "/api/customers",
      items: "/api/items",
      orders: "/api/orders",
      orderById: "/api/orders/:id",
      createOrder: "POST /api/orders",
      updateOrder: "PUT /api/orders/:id",
      deleteOrder: "DELETE /api/orders/:id",
      washTypes: "/api/orders/wash-types",
      processTypes: "/api/orders/process-types",
      orderRecords: "/api/orders/records",
      records: "/api/records/:id",
      recordAssignments: "/api/records/:recordId/assignments",
      createAssignment: "POST /api/records/:recordId/assignments",
      updateAssignment: "PUT /api/records/:recordId/assignments/:assignmentId",
      completeAssignment:
        "PUT /api/records/:recordId/assignments/:assignmentId/complete",
      deleteAssignment:
        "DELETE /api/records/:recordId/assignments/:assignmentId",
      assignmentStats: "/api/records/:recordId/assignments/stats",
      machines: "/api/machines",
      validation: "/api/validation",
      dashboard: "/api/dashboard",
      dashboardAnalytics: "/api/dashboard/analytics",
      dashboardQuickStats: "/api/dashboard/quick-stats",
      dashboardOrdersTrend: "/api/dashboard/orders-trend",
      dashboardOrderStatusDistribution:
        "/api/dashboard/order-status-distribution",
      dashboardRecentOrders: "/api/dashboard/recent-orders",
      dashboardStats: "/api/dashboard/stats",
      production: "/api/production",
      reference: "/api/reference",
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
