const { db } = require("../config/db");
const {
  orders,
  orderRecords,
  customers,
  machineAssignments,
  invoiceRecords,
} = require("../db/schema");
const {
  eq,
  and,
  or,
  gte,
  lte,
  count,
  sum,
  desc,
  asc,
  sql,
  between,
} = require("drizzle-orm");

class DashboardController {
  // Helper method to get date range based on period or custom dates
  static getDateRange(startDate, endDate, period) {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else if (period) {
      switch (period) {
        case "today":
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case "week":
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          end = new Date(now);
          break;
        case "month":
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), quarter * 3, 1);
          end = new Date(now.getFullYear(), (quarter + 1) * 3, 1);
          break;
        case "year":
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          // Default to current month
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }
    } else {
      // Default to current month
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    return { start, end };
  }

  // Helper method to get customer name
  static async getCustomerName(customerId) {
    try {
      const [customer] = await db
        .select({
          firstName: customers.firstName,
          lastName: customers.lastName,
        })
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customer) {
        return `${customer.firstName} ${customer.lastName}`;
      }
      return `Customer ${customerId}`;
    } catch (error) {
      return `Customer ${customerId}`;
    }
  }

  // Helper method to calculate order revenue
  static calculateOrderRevenue(order) {
    // Use the actual amount from the order if available, otherwise fallback to calculation
    if (order.amount && parseFloat(order.amount) > 0) {
      return parseFloat(order.amount);
    }
    // Fallback calculation if amount is not set
    return order.quantity * 100; // Assuming 100 per unit as base price
  }

  // GET /api/dashboard/analytics - Main dashboard analytics
  static async getAnalytics(req, res) {
    try {
      const { startDate, endDate, period } = req.query;
      const { start, end } = DashboardController.getDateRange(
        startDate,
        endDate,
        period
      );

      // Get summary metrics
      const [
        totalOrdersResult,
        completedOrdersResult,
        pendingOrdersResult,
        inProgressOrdersResult,
        dailyOrdersData,
        orderStatusData,
        recentOrdersData,
      ] = await Promise.all([
        // Total orders
        db
          .select({ count: count() })
          .from(orders)
          .where(between(orders.date, start, end)),

        // Completed orders
        db
          .select({ count: count() })
          .from(orders)
          .where(
            and(between(orders.date, start, end), eq(orders.status, "Complete"))
          ),

        // Pending orders
        db
          .select({ count: count() })
          .from(orders)
          .where(
            and(between(orders.date, start, end), eq(orders.status, "Pending"))
          ),

        // In Progress orders
        db
          .select({ count: count() })
          .from(orders)
          .where(
            and(
              between(orders.date, start, end),
              eq(orders.status, "In Progress")
            )
          ),

        // Daily orders data for trends
        DashboardController.getDailyOrdersData(start, end),

        // Order status distribution
        DashboardController.getOrderStatusDistribution(start, end),

        // Recent orders
        DashboardController.getRecentOrders(10),
      ]);

      const totalOrders = totalOrdersResult[0]?.count || 0;
      const completedOrders = completedOrdersResult[0]?.count || 0;
      const pendingOrders = pendingOrdersResult[0]?.count || 0;
      const inProgressOrders = inProgressOrdersResult[0]?.count || 0;

      // Calculate total revenue and average order value
      const totalRevenue = await DashboardController.calculateTotalRevenue(
        start,
        end
      );
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      res.json({
        success: true,
        data: {
          summary: {
            totalOrders,
            completedOrders,
            pendingOrders,
            inProgressOrders,
            totalRevenue: Math.round(totalRevenue),
            averageOrderValue: Math.round(averageOrderValue),
          },
          trends: {
            dailyOrders: dailyOrdersData,
            orderStatusDistribution: orderStatusData,
          },
          recentOrders: recentOrdersData,
        },
      });
    } catch (error) {
      console.error("Error in getAnalytics:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/dashboard/quick-stats - Quick stats only
  static async getQuickStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const { start, end } = DashboardController.getDateRange(
        startDate,
        endDate,
        "month"
      );

      const [
        totalOrdersResult,
        completedOrdersResult,
        pendingOrdersResult,
        inProgressOrdersResult,
      ] = await Promise.all([
        db
          .select({ count: count() })
          .from(orders)
          .where(between(orders.date, start, end)),

        db
          .select({ count: count() })
          .from(orders)
          .where(
            and(between(orders.date, start, end), eq(orders.status, "Complete"))
          ),

        db
          .select({ count: count() })
          .from(orders)
          .where(
            and(between(orders.date, start, end), eq(orders.status, "Pending"))
          ),

        db
          .select({ count: count() })
          .from(orders)
          .where(
            and(
              between(orders.date, start, end),
              eq(orders.status, "In Progress")
            )
          ),
      ]);

      const totalOrders = totalOrdersResult[0]?.count || 0;
      const completedOrders = completedOrdersResult[0]?.count || 0;
      const pendingOrders = pendingOrdersResult[0]?.count || 0;
      const inProgressOrders = inProgressOrdersResult[0]?.count || 0;

      // Note: Revenue calculations removed since no pricing data exists
      const totalRevenue = 0;
      const averageOrderValue = 0;

      res.json({
        success: true,
        data: {
          totalOrders,
          completedOrders,
          pendingOrders,
          inProgressOrders,
          totalRevenue,
          averageOrderValue,
        },
      });
    } catch (error) {
      console.error("Error in getQuickStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/dashboard/orders-trend - Orders trend data
  static async getOrdersTrend(req, res) {
    try {
      const { startDate, endDate, period = "month" } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const { start, end } = DashboardController.getDateRange(
        startDate,
        endDate,
        period
      );
      const dailyOrdersData = await DashboardController.getDailyOrdersData(
        start,
        end
      );

      res.json({
        success: true,
        data: dailyOrdersData,
      });
    } catch (error) {
      console.error("Error in getOrdersTrend:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/dashboard/orders-count - Orders count data
  static async getOrdersCount(req, res) {
    try {
      const { startDate, endDate, period = "month" } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const { start, end } = DashboardController.getDateRange(
        startDate,
        endDate,
        period
      );
      const dailyOrdersData = await DashboardController.getDailyOrdersData(
        start,
        end
      );

      // Return only orders count (without revenue)
      const ordersCountData = dailyOrdersData.map((item) => ({
        date: item.date,
        orders: item.orders,
      }));

      res.json({
        success: true,
        data: ordersCountData,
      });
    } catch (error) {
      console.error("Error in getOrdersCount:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/dashboard/order-status-distribution - Order status distribution
  static async getOrderStatusDistribution(req, res) {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const { start, end } = DashboardController.getDateRange(
        startDate,
        endDate,
        "month"
      );
      const orderStatusData =
        await DashboardController.getOrderStatusDistributionData(start, end);

      res.json({
        success: true,
        data: orderStatusData,
      });
    } catch (error) {
      console.error("Error in getOrderStatusDistribution:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/dashboard/recent-orders - Recent orders
  static async getRecentOrders(req, res) {
    try {
      const { limit = 10 } = req.query;
      const limitNum = parseInt(limit) || 10;

      const recentOrdersData = await DashboardController.getRecentOrdersData(
        limitNum
      );

      res.json({
        success: true,
        data: recentOrdersData,
      });
    } catch (error) {
      console.error("Error in getRecentOrders:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // Helper method to get daily orders data
  static async getDailyOrdersData(start, end) {
    try {
      // Get daily orders count with revenue from invoice_records
      const dailyData = await db
        .select({
          date: sql`DATE(${orders.date})`.as("date"),
          orders: count(),
          revenue: sql`COALESCE(SUM(${invoiceRecords.totalPrice}), 0)`.as(
            "revenue"
          ),
        })
        .from(orders)
        .leftJoin(invoiceRecords, eq(orders.id, invoiceRecords.orderId))
        .where(between(orders.date, start, end))
        .groupBy(sql`DATE(${orders.date})`)
        .orderBy(sql`DATE(${orders.date})`);

      return dailyData.map((item) => ({
        date: item.date, // Already in YYYY-MM-DD format from SQL DATE() function
        orders: parseInt(item.orders),
        revenue: parseFloat(item.revenue) || 0,
      }));
    } catch (error) {
      console.error("Error getting daily orders data:", error);
      return [];
    }
  }

  // Helper method to get order status distribution
  static async getOrderStatusDistributionData(start, end) {
    try {
      const statusData = await db
        .select({
          status: orders.status,
          count: count(),
        })
        .from(orders)
        .where(between(orders.date, start, end))
        .groupBy(orders.status);

      const total = statusData.reduce(
        (sum, item) => sum + parseInt(item.count),
        0
      );

      return statusData.map((item) => ({
        status: item.status,
        count: parseInt(item.count),
        percentage:
          total > 0
            ? Math.round((parseInt(item.count) / total) * 100 * 10) / 10
            : 0,
      }));
    } catch (error) {
      console.error("Error getting order status distribution:", error);
      return [];
    }
  }

  // Helper method to get recent orders
  static async getRecentOrdersData(limit) {
    try {
      const recentOrders = await db
        .select({
          id: orders.id,
          customerId: orders.customerId,
          status: orders.status,
          quantity: orders.quantity,
          orderDate: orders.createdAt,
        })
        .from(orders)
        .orderBy(desc(orders.createdAt))
        .limit(limit);

      const enhancedOrders = await Promise.all(
        recentOrders.map(async (order) => ({
          id: order.id,
          referenceNo: order.referenceNo,
          customerName: await DashboardController.getCustomerName(
            order.customerId
          ),
          status: order.status,
          quantity: order.quantity,
          totalAmount: 0, // No pricing data available
          orderDate: order.orderDate.toISOString(),
        }))
      );

      return enhancedOrders;
    } catch (error) {
      console.error("Error getting recent orders:", error);
      return [];
    }
  }

  // Helper method to calculate total revenue
  static async calculateTotalRevenue(start, end) {
    try {
      const [result] = await db
        .select({
          totalRevenue:
            sql`SUM(COALESCE(${orders.amount}, ${orders.quantity} * 100))`.as(
              "totalRevenue"
            ), // Use actual amount or fallback calculation
        })
        .from(orders)
        .where(between(orders.date, start, end));

      return parseFloat(result?.totalRevenue) || 0;
    } catch (error) {
      console.error("Error calculating total revenue:", error);
      return 0;
    }
  }

  // GET /api/dashboard/stats - Get dashboard statistics (Legacy method for backward compatibility)
  static async getDashboardStats(req, res) {
    try {
      // Get order statistics
      const [
        totalOrders,
        activeOrders,
        completedOrders,
        totalCustomers,
        activeEmployees,
      ] = await Promise.all([
        db.select({ count: count() }).from(orders),
        db
          .select({ count: count() })
          .from(orders)
          .where(
            or(
              eq(orders.status, "pending"),
              eq(orders.status, "confirmed"),
              eq(orders.status, "processing"),
              eq(orders.status, "shipped")
            )
          ),
        db
          .select({ count: count() })
          .from(orders)
          .where(eq(orders.status, "delivered")),
        db
          .select({ count: count() })
          .from(customers)
          .where(eq(customers.isActive, true)),
        db
          .select({ count: count() })
          .from(require("../models/Employee").table)
          .where(eq(require("../models/Employee").table.isActive, true)),
      ]);

      // Calculate machine utilization (placeholder)
      const machineUtilization = {
        washing: 0,
        drying: 0,
      };

      res.json({
        success: true,
        data: {
          totalOrders: totalOrders[0]?.count || 0,
          activeOrders: activeOrders[0]?.count || 0,
          completedOrders: completedOrders[0]?.count || 0,
          totalCustomers: totalCustomers[0]?.count || 0,
          activeEmployees: activeEmployees[0]?.count || 0,
          machineUtilization,
        },
      });
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = DashboardController;
