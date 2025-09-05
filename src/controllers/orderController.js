const Order = require("../models/Order");
const OrderRecord = require("../models/OrderRecord");
const { db } = require("../config/db");

class OrderController {
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

      res.json({
        success: true,
        data: {
          orders,
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

      res.json({
        success: true,
        data: {
          ...order,
          records,
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

      // Validation
      const errors = {};

      if (!date) errors.date = "Date is required";
      if (!customerId) errors.customerId = "Customer is required";
      if (!itemId) errors.itemId = "Item is required";
      if (!quantity || quantity <= 0)
        errors.quantity = "Quantity must be greater than 0";
      if (!deliveryDate) errors.deliveryDate = "Delivery date is required";
      if (!records || records.length === 0)
        errors.records = "At least one record is required";

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
          status: "Pending",
        };

        const order = await Order.create(orderData);

        // Create records
        const recordsData = records.map((record) => ({
          orderId: order.id,
          quantity: parseInt(record.quantity),
          washType: record.washType,
          processTypes: record.processTypes,
        }));

        const createdRecords = await OrderRecord.bulkCreate(recordsData);

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
      const washTypes = OrderRecord.getValidWashTypes();
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
      const processTypes = OrderRecord.getValidProcessTypes();
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
}

module.exports = OrderController;
