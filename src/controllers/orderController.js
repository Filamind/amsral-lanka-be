const Order = require("../models/Order");
const OrderRecord = require("../models/OrderRecord");
const { db } = require("../config/db");

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

      // Create record
      const recordData = {
        orderId: parseInt(orderId),
        itemId,
        quantity: parseInt(quantity),
        washType,
        processTypes,
      };
      try {
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
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const options = {
        limit: parseInt(limit),
        offset,
        search,
        status,
        customerId,
      };

      // Get orders and total count
      const orders = await Order.findAll(options);
      const totalRecords = await Order.count(options);
      const totalPages = Math.ceil(totalRecords / parseInt(limit));

      // Format orders for response
      const formattedOrders = orders.map((order) => ({
        id: order.id,
        date: order.date,
        referenceNo: order.referenceNo,
        customerId: order.customerId,
        customerName: order.customerName,
        quantity: order.quantity,
        notes: order.notes,
        deliveryDate: order.deliveryDate,
        status: order.status,
        recordsCount: order.recordsCount || 0,
        complete: order.complete || false,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        records: [],
      }));
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
        records = [],
      } = req.body;

      // Validatione ta
      const errors = {};

      if (!date) errors.date = "Date is required";
      if (!customerId) errors.customerId = "Customer is required";
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
          quantity: parseInt(quantity),
          notes,
          deliveryDate: new Date(deliveryDate),
          status: "Pending",
        };

        const order = await Order.create(orderData);

        // Create records (only if records array is not empty)
        let createdRecords = [];
        if (records && records.length > 0) {
          const recordsData = records.map((record) => ({
            orderId: order.id,
            quantity: parseInt(record.quantity),
            washType: record.washType,
            processTypes: record.processTypes,
          }));

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

        const updatedOrder = await Order.update(id, orderUpdateData);

        // Handle records if provided
        let updatedRecords = [];
        if (records && records.length >= 0) {
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

      // Delete order (cascade delete will handle records)
      await Order.delete(id);

      res.json({
        success: true,
        message: "Order and all associated records deleted successfully",
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
        sortOrder = "asc",
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
}

module.exports = OrderController;
