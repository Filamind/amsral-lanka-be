const OrderRecord = require("../models/OrderRecord");
const Order = require("../models/Order");
const MachineAssignment = require("../models/MachineAssignment");

class RecordController {
  // GET /api/records/:id - Get single record details
  static async getRecordById(req, res) {
    try {
      const { id } = req.params;

      // Get record details
      const record = await OrderRecord.findById(id);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      // Get order details
      const order = await Order.findById(record.orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Get assignment statistics
      const stats = await MachineAssignment.getRecordStats(id);

      // Format response
      const formattedRecord = {
        id: record.id,
        orderId: record.orderId,
        itemId: record.itemId,
        quantity: record.quantity,
        washType: record.washType,
        processTypes: record.processTypes,
        orderRef: order.referenceNo,
        customerName: order.customerName,
        itemName: record.itemId, // You might want to get actual item name from items table
        remainingQuantity: stats.remainingQuantity,
        status:
          stats.remainingQuantity === 0
            ? "completed"
            : stats.assignedQuantity > 0
            ? "in_progress"
            : "pending",
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };

      res.json({
        success: true,
        data: formattedRecord,
      });
    } catch (error) {
      console.error("Error getting record by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = RecordController;
