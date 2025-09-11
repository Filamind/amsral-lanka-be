const express = require("express");
const DashboardController = require("../controllers/dashboardController");

const router = express.Router();

// GET /api/dashboard/analytics - Main dashboard analytics
router.get("/analytics", DashboardController.getAnalytics);

// GET /api/dashboard/quick-stats - Quick stats only
router.get("/quick-stats", DashboardController.getQuickStats);

// GET /api/dashboard/orders-trend - Orders trend data
router.get("/orders-trend", DashboardController.getOrdersTrend);

// GET /api/dashboard/order-status-distribution - Order status distribution
router.get("/order-status-distribution", DashboardController.getOrderStatusDistribution);

// GET /api/dashboard/recent-orders - Recent orders
router.get("/recent-orders", DashboardController.getRecentOrders);

// GET /api/dashboard/stats - Get dashboard statistics (Legacy endpoint for backward compatibility)
router.get("/stats", DashboardController.getDashboardStats);

module.exports = router;
