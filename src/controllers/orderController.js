const Order = require("../models/Order");
const OrderRecord = require("../models/OrderRecord");
const { db } = require("../config/db");
const { eq, asc, inArray } = require("drizzle-orm");
const {
  customers,
  items,
  processTypes,
  orderRecords,
} = require("../db/schema");

class OrderController {
  // PUT /api/orders/:orderId/records/:recordId - Update order record
  static async updateOrderRecord(req, res) {
    try {
      const { orderId, recordId } = req.params;
      const { itemId, quantity, washType, processTypes } = req.body;

      // Basic validation
      const errors = {};
      if (!itemId) errors.itemId = "Item ID is required";
      if (!quantity || quantity <= 0)
        errors.quantity = "Quantity must be greater than 0";
      if (!washType) errors.washType = "Wash type is required";
      if (
        !processTypes ||
        !Array.isArray(processTypes) ||
        processTypes.length === 0
      )
        errors.processTypes = "Process types are required";

      if (Object.keys(errors).length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Validation failed", errors });
      }

      // Check if order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Check if record exists
      const record = await OrderRecord.findById(recordId);
      if (!record || record.orderId != orderId) {
        return res
          .status(404)
          .json({ success: false, message: "Order record not found" });
      }

      // Update record
      const updateData = {
        itemId,
        quantity: parseInt(quantity),
        washType,
        processTypes,
      };
      try {
        const updated = await OrderRecord.update(recordId, updateData);
        res.json({
          success: true,
          data: {
            id: updated.id,
            orderId: updated.orderId,
            itemId: updated.itemId,
            quantity: updated.quantity,
            washType: updated.washType,
            processTypes: updated.processTypes,
            trackingNumber: updated.trackingNumber,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        });
      } catch (err) {
        res.status(400).json({ success: false, message: err.message });
      }
    } catch (error) {
      console.error("Error updating order record:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // DELETE /api/orders/:orderId/records/:recordId - Delete order record
  static async deleteOrderRecord(req, res) {
    try {
      const { orderId, recordId } = req.params;

      // Check if order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Check if record exists
      const record = await OrderRecord.findById(recordId);
      if (!record || record.orderId != orderId) {
        return res
          .status(404)
          .json({ success: false, message: "Order record not found" });
      }

      await OrderRecord.delete(recordId);
      res.json({ success: true, message: "Record deleted successfully" });
    } catch (error) {
      console.error("Error deleting order record:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
  // POST /api/orders/:orderId/records - Add order record
  static async addOrderRecord(req, res) {
    try {
      const { orderId } = req.params;
      const { quantity, washType, processTypes } = req.body;

      // Basic validation
      const errors = {};
      if (!quantity || quantity <= 0)
        errors.quantity = "Quantity must be greater than 0";
      if (!washType) errors.washType = "Wash type is required";
      if (
        !processTypes ||
        !Array.isArray(processTypes) ||
        processTypes.length === 0
      )
        errors.processTypes = "Process types are required";

      if (Object.keys(errors).length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Validation failed", errors });
      }

      // Check if order exists and get itemId from order
      const order = await Order.findById(orderId);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Create record using itemId from order
      const recordData = {
        orderId: parseInt(orderId),
        itemId: order.itemId, // Fetch itemId from order table
        quantity: parseInt(quantity),
        washType,
        processTypes,
      };
      try {
        console.log("📝 TABLE UPDATE: order_records");
        const record = await OrderRecord.create(recordData);
        res.status(201).json({
          success: true,
          data: {
            id: record.id,
            orderId: record.orderId,
            itemId: record.itemId,
            quantity: record.quantity,
            washType: record.washType,
            processTypes: record.processTypes,
            trackingNumber: record.trackingNumber,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          },
        });
      } catch (err) {
        res.status(400).json({ success: false, message: err.message });
      }
    } catch (error) {
      console.error("Error adding order record:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
  // GET /api/orders - Get all orders with pagination and search
  static async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = null,
        status = null,
        customerId = null,
        customerName = null,
        orderId = null,
        excludeDelivered = false,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const options = {
        limit: parseInt(limit),
        offset,
        search,
        status,
        customerId,
        customerName,
        orderId: orderId ? parseInt(orderId) : null,
        excludeDelivered: excludeDelivered === "true",
      };

      // Get orders and total count
      const orders = await Order.findAll(options);
      const totalRecords = await Order.count(options);
      const totalPages = Math.ceil(totalRecords / parseInt(limit));

      // Format orders for response
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      const formattedOrders = orders.map((order) => {
        // Check if delivery date is overdue
        const deliveryDate = new Date(order.deliveryDate);
        deliveryDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        const isOverdue = deliveryDate < today && order.status !== "Delivered";

        return {
          id: order.id,
          date: order.date,
          referenceNo: order.referenceNo,
          customerId: order.customerId,
          customerName: order.customerName,
          quantity: order.quantity,
          notes: order.notes,
          deliveryDate: order.deliveryDate,
          status: order.status,
          billingStatus: order.billingStatus || "pending",
          recordsCount: order.recordsCount || 0,
          complete: order.complete || false,
          returnQuantity: order.returnQuantity || 0,
          deliveryQuantity: order.deliveryQuantity || 0,
          overdue: isOverdue,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          records: [],
        };
      });
      res.json({
        success: true,
        data: {
          orders: formattedOrders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRecords,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error getting orders:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/:id - Get single order with records
  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      // Get records for this order
      const records = await OrderRecord.findByOrderId(id);
      // Format records as per response spec
      const formattedRecords = records.map((rec) => ({
        id: rec.id,
        orderId: rec.orderId,
        itemId: rec.itemId,
        quantity: rec.quantity,
        washType: rec.washType,
        processTypes: rec.processTypes,
        trackingNumber: rec.trackingNumber,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
      }));
      res.json({
        success: true,
        data: {
          id: order.id,
          date: order.date,
          referenceNo: order.referenceNo,
          customerId: order.customerId,
          customerName: order.customerName,
          quantity: order.quantity,
          notes: order.notes,
          deliveryDate: order.deliveryDate,
          status: order.status,
          recordsCount: formattedRecords.length,
          complete: order.complete || false,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          records: formattedRecords,
        },
      });
    } catch (error) {
      console.error("Error getting order by ID:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/:id/details - Get comprehensive order details with records, assignments, and completion percentage
  static async getOrderDetails(req, res) {
    try {
      const { id } = req.params;

      // Get order details
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Get records for this order
      const records = await OrderRecord.findByOrderId(id);

      // Get assignments and completion stats for each record
      const MachineAssignment = require("../models/MachineAssignment");
      const recordsWithAssignments = await Promise.all(
        records.map(async (record) => {
          // Get assignments for this record
          const assignments = await MachineAssignment.findByRecordId(record.id);

          // Get completion statistics for this record
          const stats = await MachineAssignment.getRecordStats(record.id);

          // Get return quantity for this record
          const returnQuantity =
            await MachineAssignment.getReturnQuantityByRecord(record.id);

          // Check if record is complete
          const isComplete = await OrderRecord.isRecordComplete(record.id);

          // Get item name
          let itemName = null;
          if (record.itemId) {
            try {
              const [item] = await db
                .select({ name: items.name })
                .from(items)
                .where(eq(items.id, record.itemId))
                .limit(1);
              itemName = item?.name || null;
            } catch (error) {
              console.log(
                `Could not fetch item name for itemId: ${record.itemId}`
              );
            }
          }

          return {
            id: record.id,
            orderId: record.orderId,
            itemId: record.itemId,
            itemName: itemName,
            quantity: record.quantity,
            washType: record.washType,
            processTypes: record.processTypes,
            trackingNumber: record.trackingNumber,
            status: record.status,
            complete: isComplete,
            returnQuantity: returnQuantity,
            damageCount: record.damageCount || 0,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            assignments: assignments.map((assignment) => ({
              id: assignment.id,
              recordId: assignment.recordId,
              orderId: assignment.orderId,
              assignedById: assignment.assignedById,
              assignedTo: assignment.assignedTo,
              quantity: assignment.quantity,
              washingMachine: assignment.washingMachine,
              dryingMachine: assignment.dryingMachine,
              trackingNumber: assignment.trackingNumber,
              status: assignment.status,
              assignedAt: assignment.assignedAt,
              createdAt: assignment.createdAt,
              updatedAt: assignment.updatedAt,
            })),
            stats: {
              totalQuantity: stats.totalQuantity,
              assignedQuantity: stats.assignedQuantity,
              remainingQuantity: stats.remainingQuantity,
              totalAssignments: stats.totalAssignments,
              completedAssignments: stats.completedAssignments,
              inProgressAssignments: stats.inProgressAssignments,
              completionPercentage: stats.completionPercentage,
            },
          };
        })
      );

      // Calculate overall completion percentage
      const totalOrderQuantity = order.quantity;
      const totalAssignedQuantity = recordsWithAssignments.reduce(
        (sum, record) => sum + parseInt(record.stats.assignedQuantity || 0),
        0
      );
      const totalCompletedQuantity = recordsWithAssignments.reduce(
        (sum, record) => {
          const completedAssignments = record.assignments.filter(
            (assignment) => assignment.status === "Completed"
          );
          return (
            sum +
            completedAssignments.reduce(
              (assignmentSum, assignment) =>
                assignmentSum + parseInt(assignment.quantity || 0),
              0
            )
          );
        },
        0
      );

      // Calculate overall completion percentage based on completed work
      const overallCompletionPercentage =
        totalOrderQuantity > 0
          ? Math.round((totalCompletedQuantity / totalOrderQuantity) * 100)
          : 0;

      // Calculate overall assignment statistics
      const totalAssignments = recordsWithAssignments.reduce(
        (sum, record) => sum + record.stats.totalAssignments,
        0
      );
      const completedAssignments = recordsWithAssignments.reduce(
        (sum, record) => sum + record.stats.completedAssignments,
        0
      );
      const inProgressAssignments = recordsWithAssignments.reduce(
        (sum, record) => sum + record.stats.inProgressAssignments,
        0
      );

      res.json({
        success: true,
        data: {
          order: {
            id: order.id,
            date: order.date,
            referenceNo: order.referenceNo,
            customerId: order.customerId,
            customerName: order.customerName,
            quantity: order.quantity,
            notes: order.notes,
            deliveryDate: order.deliveryDate,
            status: order.status,
            complete: order.complete || false,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          },
          records: recordsWithAssignments,
          overallStats: {
            totalQuantity: totalOrderQuantity,
            totalAssignedQuantity,
            totalCompletedQuantity,
            remainingQuantity: Math.max(
              0,
              totalOrderQuantity - totalAssignedQuantity
            ),
            totalAssignments,
            completedAssignments,
            inProgressAssignments,
            overallCompletionPercentage,
            recordsCount: recordsWithAssignments.length,
            completeRecordsCount: recordsWithAssignments.filter(
              (record) => record.complete
            ).length,
            // Assignment completeness details
            assignmentCompleteness: {
              totalAssignments,
              completedAssignments,
              inProgressAssignments,
              cancelledAssignments: recordsWithAssignments.reduce(
                (sum, record) =>
                  sum +
                  record.assignments.filter(
                    (assignment) => assignment.status === "Cancelled"
                  ).length,
                0
              ),
              assignmentCompletionPercentage:
                totalAssignments > 0
                  ? Math.round((completedAssignments / totalAssignments) * 100)
                  : 0,
            },
            // Work completion details
            workCompletion: {
              totalQuantity: totalOrderQuantity,
              assignedQuantity: totalAssignedQuantity,
              completedQuantity: totalCompletedQuantity,
              remainingQuantity: Math.max(
                0,
                totalOrderQuantity - totalAssignedQuantity
              ),
              workCompletionPercentage: overallCompletionPercentage,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error getting order details:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // POST /api/orders - Create new order with records
  static async createOrder(req, res) {
    try {
      const {
        date,
        customerId,
        itemId,
        quantity,
        notes,
        deliveryDate,
        gpNo,
        records = [],
      } = req.body;

      // Validation
      const errors = {};

      if (!date) errors.date = "Date is required";
      if (!customerId) errors.customerId = "Customer is required";
      if (!itemId) errors.itemId = "Item is required";
      if (!quantity || quantity <= 0)
        errors.quantity = "Quantity must be greater than 0";
      if (!deliveryDate) errors.deliveryDate = "Delivery date is required";

      // Validate records
      if (records && records.length > 0) {
        const totalRecordQuantity = records.reduce(
          (sum, record) => sum + (record.quantity || 0),
          0
        );
        if (totalRecordQuantity > quantity) {
          errors.records =
            "Records total quantity cannot exceed order quantity";
        }

        // Validate each record
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          if (!record.quantity || record.quantity <= 0) {
            errors[`records.${i}.quantity`] =
              "Record quantity must be greater than 0";
          }
          if (!record.washType) {
            errors[`records.${i}.washType`] = "Wash type is required";
          }
          if (
            !record.processTypes ||
            !Array.isArray(record.processTypes) ||
            record.processTypes.length === 0
          ) {
            errors[`records.${i}.processTypes`] = "Process types are required";
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Create order
        const orderData = {
          date: new Date(date),
          customerId,
          itemId,
          quantity: parseInt(quantity),
          notes,
          deliveryDate: new Date(deliveryDate),
          gpNo: gpNo || null,
          status: "Pending",
        };

        console.log("📝 TABLE UPDATE: orders");
        const order = await Order.create(orderData);

        // Create records (only if records array is not empty)
        let createdRecords = [];
        if (records && records.length > 0) {
          const recordsData = records.map((record) => ({
            orderId: order.id,
            itemId: itemId, // Use the same itemId as the order
            quantity: parseInt(record.quantity),
            washType: record.washType,
            processTypes: record.processTypes,
          }));

          console.log("📝 TABLE UPDATE: order_records");
          createdRecords = await OrderRecord.bulkCreate(recordsData);
        }

        return { order, records: createdRecords };
      });

      // Get the complete order with enhanced data
      const completeOrder = await Order.findById(result.order.id);

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          ...completeOrder,
          records: result.records,
        },
      });
    } catch (error) {
      console.error("Error creating order:", error);

      if (error.message === "Reference number already exists") {
        return res.status(400).json({
          success: false,
          message: "Reference number already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // PUT /api/orders/:id - Update order and records
  static async updateOrder(req, res) {
    try {
      const { id } = req.params;
      const {
        date,
        customerId,
        itemId,
        quantity,
        notes,
        deliveryDate,
        status,
        gpNo,
        deliveryCount,
        records = [],
      } = req.body;

      // Check if order exists
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Validation
      const errors = {};

      if (quantity && quantity <= 0)
        errors.quantity = "Quantity must be greater than 0";

      if (deliveryCount !== undefined && deliveryCount < 0)
        errors.deliveryCount =
          "Delivery count must be greater than or equal to 0";

      // Validate records if provided
      if (records && records.length > 0) {
        const totalRecordQuantity = records.reduce(
          (sum, record) => sum + (record.quantity || 0),
          0
        );
        const finalQuantity = quantity || existingOrder.quantity;

        if (totalRecordQuantity > finalQuantity) {
          errors.records =
            "Records total quantity cannot exceed order quantity";
        }

        // Validate each record
        for (let i = 0; i < records.length; i++) {
          const record = records[i];
          if (record.quantity && record.quantity <= 0) {
            errors[`records.${i}.quantity`] =
              "Record quantity must be greater than 0";
          }
          if (
            record.washType &&
            !OrderRecord.getValidWashTypes().find(
              (wt) => wt.value === record.washType
            )
          ) {
            errors[`records.${i}.washType`] = "Invalid wash type";
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Start transaction
      const result = await db.transaction(async (tx) => {
        // Update order
        const orderUpdateData = {};
        if (date) orderUpdateData.date = new Date(date);
        if (customerId) orderUpdateData.customerId = customerId;
        if (itemId) orderUpdateData.itemId = itemId;
        if (quantity) orderUpdateData.quantity = parseInt(quantity);
        if (notes !== undefined) orderUpdateData.notes = notes;
        if (deliveryDate) orderUpdateData.deliveryDate = new Date(deliveryDate);
        if (status) orderUpdateData.status = status;
        if (gpNo !== undefined) orderUpdateData.gpNo = gpNo;

        // Handle delivery count - add to existing delivery quantity
        if (deliveryCount !== undefined) {
          const currentDeliveryQuantity = existingOrder.deliveryQuantity || 0;
          orderUpdateData.deliveryQuantity =
            currentDeliveryQuantity + parseInt(deliveryCount);
        }

        const updatedOrder = await Order.update(id, orderUpdateData);

        // Handle records if provided
        let updatedRecords = [];
        if (records && records.length > 0) {
          // Get existing records
          const existingRecords = await OrderRecord.findByOrderId(id);
          const existingRecordIds = existingRecords.map((r) => r.id);

          // Track which records to keep
          const recordsToKeep = [];
          const recordsToUpdate = [];
          const recordsToCreate = [];

          // Process each record in the request
          for (const record of records) {
            if (record.id) {
              // Existing record - update it
              recordsToKeep.push(record.id);
              recordsToUpdate.push(record);
            } else {
              // New record - create it
              recordsToCreate.push({
                orderId: id,
                quantity: parseInt(record.quantity),
                washType: record.washType,
                processTypes: record.processTypes,
              });
            }
          }

          // Delete records not in the new list
          const recordsToDelete = existingRecordIds.filter(
            (recordId) => !recordsToKeep.includes(recordId)
          );
          for (const recordId of recordsToDelete) {
            await OrderRecord.delete(recordId);
          }

          // Update existing records
          for (const record of recordsToUpdate) {
            const updateData = {};
            if (record.quantity)
              updateData.quantity = parseInt(record.quantity);
            if (record.washType) updateData.washType = record.washType;
            if (record.processTypes)
              updateData.processTypes = record.processTypes;

            await OrderRecord.update(record.id, updateData);
          }

          // Create new records
          if (recordsToCreate.length > 0) {
            await OrderRecord.bulkCreate(recordsToCreate);
          }

          // Get all current records
          updatedRecords = await OrderRecord.findByOrderId(id);
        }

        return { order: updatedOrder, records: updatedRecords };
      });

      // Get the complete updated order
      const completeOrder = await Order.findById(id);

      res.json({
        success: true,
        message: "Order updated successfully",
        data: {
          ...completeOrder,
          records:
            result.records.length > 0
              ? result.records
              : await OrderRecord.findByOrderId(id),
        },
      });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // DELETE /api/orders/:id - Delete order (cascade delete records)
  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;

      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Delete order and all related records
      const result = await Order.deleteWithRelatedRecords(id);

      res.json({
        success: true,
        message: "Order and all associated records deleted successfully",
        data: {
          deletedOrderId: id,
          deletedRecords: result,
        },
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // DELETE /api/orders - Delete all orders (for testing purposes)
  static async deleteAllOrders(req, res) {
    try {
      // Check if this is a test environment or has proper authorization
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Delete all orders is not allowed in production environment",
        });
      }

      // Delete all orders and related records
      const result = await Order.deleteAllWithRelatedRecords();

      res.json({
        success: true,
        message: "All orders and associated records deleted successfully",
        data: {
          deletedOrdersCount: result.ordersCount,
          deletedRecords: result.recordsCount,
        },
      });
    } catch (error) {
      console.error("Error deleting all orders:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/wash-types - Get valid wash types
  static async getWashTypes(req, res) {
    try {
      const washTypes = await OrderRecord.getValidWashTypes();
      res.json({
        success: true,
        data: washTypes,
      });
    } catch (error) {
      console.error("Error getting wash types:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/process-types - Get valid process types
  static async getProcessTypes(req, res) {
    try {
      const processTypes = await OrderRecord.getValidProcessTypes();
      res.json({
        success: true,
        data: processTypes,
      });
    } catch (error) {
      console.error("Error getting process types:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/records - Get all order records with pagination and filtering
  static async getAllOrderRecords(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        orderId = null,
        washType = null,
        search = null,
        sortBy = "id",
        sortOrder = "desc",
      } = req.query;

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
        orderId: orderId ? parseInt(orderId) : null,
        washType,
        search,
        sortBy,
        sortOrder,
      };

      // Get order records and total count
      const records = await OrderRecord.findAll(options);
      const totalRecords = await OrderRecord.count(options);
      const totalPages = Math.ceil(totalRecords / parseInt(limit));

      // Format records for response with enhanced data
      const formattedRecords = await Promise.all(
        records.map(async (record) => {
          // Get order details
          const order = await Order.findById(record.orderId);

          // Get assignment statistics
          const MachineAssignment = require("../models/MachineAssignment");
          const stats = await MachineAssignment.getRecordStats(record.id);

          // Check if all assignments are completed
          const isComplete = await OrderRecord.isRecordComplete(record.id);

          return {
            id: record.id,
            orderId: record.orderId,
            itemId: record.itemId,
            quantity: record.quantity,
            washType: record.washType,
            processTypes: record.processTypes,
            trackingNumber: record.trackingNumber,
            status: record.status, // Database status (Pending/Complete)
            complete: isComplete, // Boolean: true if all assignments are completed
            orderRef: order?.referenceNo || null,
            customerName: order?.customerName || null,
            itemName: record.itemId, // You might want to get actual item name from items table
            remainingQuantity: stats.remainingQuantity,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          };
        })
      );

      res.json({
        success: true,
        data: {
          records: formattedRecords,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalRecords,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error getting order records:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get order summary with customer and records details
  static async getOrderSummary(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid order ID is required",
        });
      }

      const orderDetails = await Order.getOrderDetails(parseInt(id));

      if (!orderDetails) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Generate invoice number for existing orders that don't have one
      if (!orderDetails.invoiceNo) {
        try {
          const invoiceNo = await Order.generateInvoiceNumberForExistingOrder(
            parseInt(id)
          );
          orderDetails.invoiceNo = invoiceNo;
        } catch (error) {
          console.log(
            `Could not generate invoice number for order ${id}:`,
            error.message
          );
        }
      }

      // Calculate total actual quantity from all records
      const recordsWithActualQuantity = await Promise.all(
        orderDetails.records.map(async (record) => {
          const { machineAssignments } = require("../db/schema");

          // Get all machine assignments for this record
          const assignments = await db
            .select({
              returnQuantity: machineAssignments.returnQuantity,
            })
            .from(machineAssignments)
            .where(eq(machineAssignments.recordId, record.id));

          // Sum up the return quantities
          const totalReturnQuantity = assignments.reduce((sum, assignment) => {
            return (
              sum +
              (assignment.returnQuantity
                ? parseFloat(assignment.returnQuantity)
                : 0)
            );
          }, 0);

          return totalReturnQuantity > 0
            ? totalReturnQuantity
            : record.quantity;
        })
      );

      const totalActualQuantity = recordsWithActualQuantity.reduce(
        (sum, qty) => sum + qty,
        0
      );

      // Get customer balance
      const [customer] = await db
        .select({ balance: customers.balance })
        .from(customers)
        .where(eq(customers.id, parseInt(orderDetails.customerId)))
        .limit(1);

      const customerBalance = customer?.balance
        ? parseFloat(customer.balance)
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          id: orderDetails.id,
          customerId: orderDetails.customerId,
          customerName: orderDetails.customerName,
          orderDate: orderDetails.date,
          totalQuantity: totalActualQuantity, // Use actual total quantity
          originalTotalQuantity: orderDetails.quantity, // Keep original for reference
          createdDate: orderDetails.createdAt,
          referenceNo: orderDetails.referenceNo,
          deliveryDate: orderDetails.deliveryDate,
          status: orderDetails.status,
          billingStatus: orderDetails.billingStatus || "pending",
          gpNo: orderDetails.gpNo,
          invoiceNo: orderDetails.invoiceNo,
          notes: orderDetails.notes,
          balance: customerBalance, // Add customer balance
          records: await Promise.all(
            orderDetails.records.map(async (record) => {
              // Get actual output quantity from machine assignments
              const { machineAssignments } = require("../db/schema");
              const { sum } = require("drizzle-orm");

              // Get all machine assignments for this record
              const assignments = await db
                .select({
                  returnQuantity: machineAssignments.returnQuantity,
                })
                .from(machineAssignments)
                .where(eq(machineAssignments.recordId, record.id));

              // Sum up the return quantities
              const totalReturnQuantity = assignments.reduce(
                (sum, assignment) => {
                  return (
                    sum +
                    (assignment.returnQuantity
                      ? parseFloat(assignment.returnQuantity)
                      : 0)
                  );
                },
                0
              );

              // Subtract damage count from return quantity
              const damageCount = record.damageCount || 0;
              const actualQuantity =
                totalReturnQuantity > 0
                  ? Math.max(0, totalReturnQuantity - damageCount)
                  : record.quantity;

              return {
                id: record.id,
                quantity: actualQuantity, // Use actual output quantity instead of original
                originalQuantity: record.quantity, // Keep original for reference
                washType: record.washType,
                processTypes: record.processTypes,
                itemName: record.itemName,
                itemId: record.itemId,
                status: record.status,
                trackingNumber: record.trackingNumber,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
              };
            })
          ),
        },
      });
    } catch (error) {
      console.error("Error getting order summary:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/invoice-preview/:customerId - Get next invoice number for a customer
  static async getInvoicePreview(req, res) {
    try {
      const { customerId } = req.params;

      if (!customerId || isNaN(parseInt(customerId))) {
        return res.status(400).json({
          success: false,
          message: "Valid customer ID is required",
        });
      }

      // Get customer details
      const [customer] = await db
        .select({
          id: customers.id,
          customerCode: customers.customerCode,
          firstName: customers.firstName,
          lastName: customers.lastName,
          incrementNumber: customers.incrementNumber,
        })
        .from(customers)
        .where(eq(customers.id, parseInt(customerId)))
        .limit(1);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      // Generate the next invoice number (without updating the counter)
      const currentIncrement = customer.incrementNumber || 0;
      const nextIncrement = currentIncrement + 1;
      const nextInvoiceNo = `${customer.customerCode}${nextIncrement
        .toString()
        .padStart(3, "0")}`;

      res.json({
        success: true,
        data: {
          customerId: customer.id,
          customerCode: customer.customerCode,
          customerName: `${customer.firstName} ${customer.lastName}`,
          currentIncrement: currentIncrement,
          nextIncrement: nextIncrement,
          nextInvoiceNo: nextInvoiceNo,
        },
      });
    } catch (error) {
      console.error("Error getting invoice preview:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // POST /api/orders/generate-invoice-batch - Generate invoice number for multiple orders
  static async generateInvoiceBatch(req, res) {
    try {
      const { orderIds } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Order IDs array is required",
        });
      }

      // Validate that all order IDs are valid numbers
      const validOrderIds = orderIds
        .filter((id) => !isNaN(parseInt(id)))
        .map((id) => parseInt(id));

      if (validOrderIds.length !== orderIds.length) {
        return res.status(400).json({
          success: false,
          message: "All order IDs must be valid numbers",
        });
      }

      // Generate invoice number for all orders
      const invoiceNo = await Order.generateInvoiceNumberForMultipleOrders(
        validOrderIds
      );

      res.json({
        success: true,
        message: "Invoice number generated successfully",
        data: {
          invoiceNo: invoiceNo,
          orderIds: validOrderIds,
          count: validOrderIds.length,
        },
      });
    } catch (error) {
      console.error("Error generating batch invoice:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // GET /api/orders/:id/records-details - Get order details with records and remaining quantity
  static async getOrderRecordsDetails(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: "Valid order ID is required",
        });
      }

      const orderId = parseInt(id);

      // Get order details
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Get customer name
      let customerName = null;
      try {
        const [customer] = await db
          .select({
            firstName: customers.firstName,
            lastName: customers.lastName,
          })
          .from(customers)
          .where(eq(customers.id, parseInt(order.customerId)));

        if (customer) {
          customerName = `${customer.firstName} ${customer.lastName}`;
        }
      } catch (error) {
        console.log(
          `Could not fetch customer name for customerId: ${order.customerId}`
        );
      }

      // Get order records with item names and process type names
      const records = await db
        .select({
          id: orderRecords.id,
          orderId: orderRecords.orderId,
          itemId: orderRecords.itemId,
          quantity: orderRecords.quantity,
          washType: orderRecords.washType,
          processTypes: orderRecords.processTypes,
          trackingNumber: orderRecords.trackingNumber,
          status: orderRecords.status,
          createdAt: orderRecords.createdAt,
          updatedAt: orderRecords.updatedAt,
        })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .orderBy(asc(orderRecords.id));

      // Get item names and process type names for each record
      const recordsWithDetails = await Promise.all(
        records.map(async (record) => {
          let itemName = null;
          if (record.itemId) {
            try {
              const [item] = await db
                .select({ name: items.name })
                .from(items)
                .where(eq(items.id, record.itemId));
              itemName = item?.name || null;
            } catch (error) {
              console.log(
                `Could not fetch item name for itemId: ${record.itemId}`
              );
            }
          }

          // Get process type names
          let processTypeNames = [];
          if (record.processTypes && Array.isArray(record.processTypes)) {
            try {
              const processTypeDetails = await db
                .select({
                  id: processTypes.id,
                  name: processTypes.name,
                  code: processTypes.code,
                })
                .from(processTypes)
                .where(inArray(processTypes.code, record.processTypes));

              processTypeNames = processTypeDetails.map((pt) => pt.name);
            } catch (error) {
              console.log(
                `Could not fetch process type names for codes: ${record.processTypes}`
              );
            }
          }

          return {
            trackingId: record.trackingNumber,
            itemName: itemName,
            washType: record.washType,
            processType: processTypeNames.join(", "), // Join multiple process types with comma
            quantity: record.quantity,
            status: record.status,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          };
        })
      );

      // Calculate total quantity from records
      const totalRecordsQuantity = recordsWithDetails.reduce(
        (sum, record) => sum + (record.quantity || 0),
        0
      );

      // Calculate remaining quantity
      const remainingQuantity = Math.max(
        0,
        order.quantity - totalRecordsQuantity
      );

      return res.status(200).json({
        success: true,
        data: {
          orderId: order.id,
          customerName: customerName,
          orderQuantity: order.quantity,
          orderRecords: recordsWithDetails,
          remainingQuantity: remainingQuantity,
        },
      });
    } catch (error) {
      console.error("Error getting order records details:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // POST /api/orders/:orderId/damage-records - Update damage counts for order records
  static async updateDamageRecords(req, res) {
    try {
      const { orderId } = req.params;
      const { damageCounts } = req.body;

      // Validate input
      if (!damageCounts || typeof damageCounts !== "object") {
        return res.status(400).json({
          success: false,
          message: "damageCounts object is required",
        });
      }

      // Check if order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Validate that all record IDs belong to this order
      const recordIds = Object.keys(damageCounts);
      if (recordIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one record ID is required",
        });
      }

      // Get all records for this order
      const records = await OrderRecord.findByOrderId(orderId);
      const validRecordIds = records.map((record) => record.id.toString());

      // Validate record IDs
      for (const recordId of recordIds) {
        if (!validRecordIds.includes(recordId)) {
          return res.status(400).json({
            success: false,
            message: `Record ID ${recordId} does not belong to order ${orderId}`,
          });
        }

        const damageCount = damageCounts[recordId];
        if (typeof damageCount !== "number" || damageCount < 0) {
          return res.status(400).json({
            success: false,
            message: `Damage count for record ${recordId} must be a non-negative number`,
          });
        }
      }

      // Update damage counts
      const updatePromises = recordIds.map(async (recordId) => {
        const damageCount = damageCounts[recordId];
        return await OrderRecord.update(recordId, { damageCount });
      });

      await Promise.all(updatePromises);

      // Change order status to "QC" if current status is "Complete"
      if (order.status === "Complete") {
        await Order.update(orderId, { status: "QC" });
      }

      res.json({
        success: true,
        data: {
          message: "Damage records saved successfully",
        },
      });
    } catch (error) {
      console.error("Error updating damage records:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = OrderController;
