const MachineAssignment = require("../models/MachineAssignment");
const Machine = require("../models/Machine");
const OrderRecord = require("../models/OrderRecord");

class MachineAssignmentController {
  // GET /api/records/:recordId/assignments - Get machine assignments for a record
  static async getRecordAssignments(req, res) {
    try {
      const { recordId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Validate pagination parameters
      if (parseInt(limit) > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit cannot exceed 100",
        });
      }

      if (parseInt(page) < 1 || parseInt(limit) < 1) {
        return res.status(400).json({
          success: false,
          message: "Page and limit must be positive numbers",
        });
      }

      const options = {
        limit: parseInt(limit),
        offset,
        recordId: parseInt(recordId),
      };

      // Get assignments and total count
      const assignments = await MachineAssignment.findAll(options);
      const totalRecords = await MachineAssignment.count(options);
      const totalPages = Math.ceil(totalRecords / parseInt(limit));

      res.json({
        success: true,
        data: {
          assignments,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRecords,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error getting record assignments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // POST /api/records/:recordId/assignments - Create machine assignment
  static async createAssignment(req, res) {
    try {
      const { recordId } = req.params;
      const { assignedById, quantity, washingMachine, dryingMachine } =
        req.body;

      // Basic validation
      const errors = {};
      if (!assignedById) errors.assignedById = "Assigned to ID is required";
      if (!quantity || quantity <= 0)
        errors.quantity = "Quantity must be greater than 0";
      // Washing machine and drying machine are now optional

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Check if record exists and get order ID
      const record = await OrderRecord.findById(recordId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      // Check remaining quantity
      const stats = await MachineAssignment.getRecordStats(recordId);
      if (quantity > stats.remainingQuantity) {
        return res.status(409).json({
          success: false,
          message: `Quantity cannot exceed remaining quantity (${stats.remainingQuantity})`,
        });
      }

      // Create assignment
      const assignmentData = {
        recordId: parseInt(recordId),
        orderId: record.orderId,
        assignedById,
        quantity: parseInt(quantity),
        washingMachine,
        dryingMachine,
      };

      console.log("📝 TABLE UPDATE: machine_assignments");
      const assignment = await MachineAssignment.create(assignmentData);

      res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        data: assignment,
      });
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // PUT /api/records/:recordId/assignments/:assignmentId - Update machine assignment
  static async updateAssignment(req, res) {
    try {
      const { recordId, assignmentId } = req.params;
      const { assignedById, quantity, washingMachine, dryingMachine, status } =
        req.body;

      // Basic validation
      const errors = {};
      if (quantity !== undefined && quantity <= 0) {
        errors.quantity = "Quantity must be greater than 0";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Check if assignment exists
      const existingAssignment = await MachineAssignment.findById(assignmentId);
      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Check if assignment belongs to the record
      if (existingAssignment.recordId !== parseInt(recordId)) {
        return res.status(400).json({
          success: false,
          message: "Assignment does not belong to this record",
        });
      }

      // If quantity is being updated, check remaining quantity
      if (quantity !== undefined) {
        const stats = await MachineAssignment.getRecordStats(recordId);
        const currentAssigned =
          stats.assignedQuantity - existingAssignment.quantity;
        const newRemaining = stats.totalQuantity - currentAssigned;

        if (quantity > newRemaining) {
          return res.status(409).json({
            success: false,
            message: `Quantity cannot exceed remaining quantity (${newRemaining})`,
          });
        }
      }

      // Update assignment
      const updateData = {};
      if (assignedById !== undefined) updateData.assignedById = assignedById;
      if (quantity !== undefined) updateData.quantity = parseInt(quantity);
      if (washingMachine !== undefined)
        updateData.washingMachine = washingMachine;
      if (dryingMachine !== undefined) updateData.dryingMachine = dryingMachine;
      if (status !== undefined) updateData.status = status;

      console.log("📝 TABLE UPDATE: machine_assignments");
      const assignment = await MachineAssignment.update(
        assignmentId,
        updateData
      );

      // Handle record status updates based on assignment status changes
      const OrderRecord = require("../models/OrderRecord");

      if (status !== undefined) {
        const previousStatus = existingAssignment.status;
        const newStatus = status;

        // If status changed from "Completed" to "In Progress" → set record to "Pending"
        if (previousStatus === "Completed" && newStatus === "In Progress") {
          await OrderRecord.updateRecordStatus(recordId, "Pending");
        }
        // If status changed to "Completed" → check if record should be "Complete"
        else if (newStatus === "Completed") {
          await OrderRecord.updateRecordStatus(recordId);
        }
      }

      res.json({
        success: true,
        message: "Assignment updated successfully",
        data: assignment,
      });
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // DELETE /api/records/:recordId/assignments/:assignmentId - Delete machine assignment
  static async deleteAssignment(req, res) {
    try {
      const { recordId, assignmentId } = req.params;

      // Check if assignment exists
      const existingAssignment = await MachineAssignment.findById(assignmentId);
      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Check if assignment belongs to the record
      if (existingAssignment.recordId !== parseInt(recordId)) {
        return res.status(400).json({
          success: false,
          message: "Assignment does not belong to this record",
        });
      }

      // Delete assignment
      await MachineAssignment.delete(assignmentId);

      res.json({
        success: true,
        message: "Assignment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/records/:recordId/assignments/stats - Get assignment statistics
  static async getAssignmentStats(req, res) {
    try {
      const { recordId } = req.params;

      // Check if record exists
      const record = await OrderRecord.findById(recordId);
      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      const stats = await MachineAssignment.getRecordStats(recordId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting assignment stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // PUT /api/records/:recordId/assignments/:assignmentId/complete - Mark assignment as completed
  static async completeAssignment(req, res) {
    try {
      const { recordId, assignmentId } = req.params;

      // Check if assignment exists
      const existingAssignment = await MachineAssignment.findById(assignmentId);
      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: "Assignment not found",
        });
      }

      // Check if assignment belongs to the record
      if (existingAssignment.recordId !== parseInt(recordId)) {
        return res.status(400).json({
          success: false,
          message: "Assignment does not belong to this record",
        });
      }

      // Update assignment status to completed
      const assignment = await MachineAssignment.update(assignmentId, {
        status: "Completed",
      });

      // Update the record status based on assignment completion
      const OrderRecord = require("../models/OrderRecord");
      await OrderRecord.updateRecordStatus(recordId);

      res.json({
        success: true,
        message: "Assignment marked as completed successfully",
        data: assignment,
      });
    } catch (error) {
      console.error("Error completing assignment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/machines - Get available machines
  static async getMachines(req, res) {
    try {
      const { page = 1, limit = 50, type = null, search = null } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Validate pagination parameters
      if (parseInt(limit) > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit cannot exceed 100",
        });
      }

      if (parseInt(page) < 1 || parseInt(limit) < 1) {
        return res.status(400).json({
          success: false,
          message: "Page and limit must be positive numbers",
        });
      }

      const options = {
        limit: parseInt(limit),
        offset,
        type,
        search,
      };

      // Get machines and total count
      const machines = await Machine.findAll(options);
      const totalRecords = await Machine.count(options);
      const totalPages = Math.ceil(totalRecords / parseInt(limit));

      res.json({
        success: true,
        data: {
          machines,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRecords,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error getting machines:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = MachineAssignmentController;
