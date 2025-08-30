const CustomerOrder = require("../models/CustomerOrder");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");

class DashboardController {
  // GET /api/dashboard/stats - Get dashboard statistics
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
        CustomerOrder.count(),
        CustomerOrder.countByStatus([
          "pending",
          "confirmed",
          "processing",
          "shipped",
        ]),
        CustomerOrder.countByStatus(["delivered"]),
        Customer.count(true), // Active customers only
        Employee.count(true), // Active employees only
      ]);

      // Calculate machine utilization (placeholder - you'll need to implement actual logic)
      // This would require tracking which machines are currently assigned/in use
      const machineUtilization = {
        washing: 0, // Percentage of washing machines in use
        drying: 0, // Percentage of drying machines in use
      };

      // You can implement actual machine utilization calculation here
      // by checking assignments in CustomerOrderLineProcess table

      res.json({
        success: true,
        data: {
          totalOrders,
          activeOrders,
          completedOrders,
          totalCustomers,
          activeEmployees,
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
