const CustomerOrderLine = require("../models/CustomerOrderLine");
const CustomerOrderLineProcess = require("../models/CustomerOrderLineProcess");
const CustomerOrder = require("../models/CustomerOrder");

class CustomerOrderLineController {
  // GET /api/customer-order-lines - Get all customer order lines with pagination
  static async getCustomerOrderLines(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const search = req.query.search;
      const customerOrderId = req.query.customerOrderId
        ? parseInt(req.query.customerOrderId)
        : null;
      const itemTypeId = req.query.itemTypeId
        ? parseInt(req.query.itemTypeId)
        : null;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "desc";

      const offset = (page - 1) * limit;

      // Validate pagination parameters
      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit cannot exceed 100",
        });
      }

      if (page < 1 || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Page and limit must be positive numbers",
        });
      }

      const [orderLines, totalCount] = await Promise.all([
        CustomerOrderLine.findAll({
          limit,
          offset,
          isActive,
          search,
          customerOrderId,
          itemTypeId,
          sortBy,
          sortOrder,
        }),
        CustomerOrderLine.count({
          isActive,
          search,
          customerOrderId,
          itemTypeId,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          orderLines,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getCustomerOrderLines:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-order-lines/:id - Get customer order line by ID
  static async getCustomerOrderLineById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line ID",
        });
      }

      const [orderLine, processes] = await Promise.all([
        CustomerOrderLine.findById(parseInt(id)),
        CustomerOrderLineProcess.findByCustomerOrderLine(parseInt(id)),
      ]);

      if (!orderLine) {
        return res.status(404).json({
          success: false,
          message: "Customer order line not found",
        });
      }

      res.json({
        success: true,
        data: {
          orderLine: {
            ...orderLine,
            processes,
          },
        },
      });
    } catch (error) {
      console.error("Error in getCustomerOrderLineById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/customer-order-lines - Create new customer order line
  static async createCustomerOrderLine(req, res) {
    try {
      const {
        customerOrderId,
        itemTypeId,
        quantity,
        unitPrice,
        description,
        notes,
        processes = [],
      } = req.body;

      // Validate required fields
      if (!customerOrderId || !itemTypeId || !quantity) {
        return res.status(400).json({
          success: false,
          message: "Customer order ID, item type ID, and quantity are required",
        });
      }

      // Calculate total price
      const totalPrice = (
        parseFloat(unitPrice || 0) * parseInt(quantity)
      ).toFixed(2);

      const orderLineData = {
        customerOrderId: parseInt(customerOrderId),
        itemTypeId: parseInt(itemTypeId),
        quantity: parseInt(quantity),
        unitPrice: unitPrice || "0.00",
        totalPrice,
        description: description?.trim() || null,
        notes: notes?.trim() || null,
      };

      const orderLine = await CustomerOrderLine.create(orderLineData);

      // Create processes if provided
      let createdProcesses = [];
      if (processes.length > 0) {
        const processData = processes.map((process, index) => ({
          customerOrderLineId: orderLine.id,
          sequenceNumber: index + 1,
          processType: process.processType,
          washingTypeId:
            process.processType === "washing"
              ? parseInt(process.washingTypeId)
              : null,
          dryingTypeId:
            process.processType === "drying"
              ? parseInt(process.dryingTypeId)
              : null,
          notes: process.notes?.trim() || null,
        }));

        createdProcesses = await CustomerOrderLineProcess.bulkCreate(
          processData
        );
      }

      // Update order total
      const { totalAmount } = await CustomerOrderLine.calculateOrderTotal(
        orderLine.customerOrderId
      );
      await CustomerOrder.update(orderLine.customerOrderId, {
        totalAmount: totalAmount.toString(),
      });

      res.status(201).json({
        success: true,
        data: {
          orderLine: {
            ...orderLine,
            processes: createdProcesses,
          },
        },
        message: "Customer order line created successfully",
      });
    } catch (error) {
      console.error("Error in createCustomerOrderLine:", error);

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/customer-order-lines/:id - Update customer order line
  static async updateCustomerOrderLine(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line ID",
        });
      }

      const updateData = { ...req.body };

      // Clean up string fields
      Object.keys(updateData).forEach((key) => {
        if (typeof updateData[key] === "string") {
          updateData[key] = updateData[key].trim() || null;
        }
      });

      // Remove processes from update data if present
      delete updateData.processes;

      // Recalculate total price if quantity or unit price changed
      if (updateData.quantity || updateData.unitPrice) {
        const existingOrderLine = await CustomerOrderLine.findById(
          parseInt(id)
        );
        if (!existingOrderLine) {
          return res.status(404).json({
            success: false,
            message: "Customer order line not found",
          });
        }

        const quantity = updateData.quantity || existingOrderLine.quantity;
        const unitPrice = updateData.unitPrice || existingOrderLine.unitPrice;
        updateData.totalPrice = (
          parseFloat(unitPrice) * parseInt(quantity)
        ).toFixed(2);
      }

      const orderLine = await CustomerOrderLine.update(
        parseInt(id),
        updateData
      );

      // Update order total if price changed
      if (updateData.totalPrice) {
        const { totalAmount } = await CustomerOrderLine.calculateOrderTotal(
          orderLine.customerOrderId
        );
        await CustomerOrder.update(orderLine.customerOrderId, {
          totalAmount: totalAmount.toString(),
        });
      }

      res.json({
        success: true,
        data: { orderLine },
        message: "Customer order line updated successfully",
      });
    } catch (error) {
      console.error("Error in updateCustomerOrderLine:", error);

      if (error.message === "Customer order line not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // DELETE /api/customer-order-lines/:id - Delete customer order line (soft delete)
  static async deleteCustomerOrderLine(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line ID",
        });
      }

      const orderLine = await CustomerOrderLine.delete(parseInt(id));

      // Update order total
      const { totalAmount } = await CustomerOrderLine.calculateOrderTotal(
        orderLine.customerOrderId
      );
      await CustomerOrder.update(orderLine.customerOrderId, {
        totalAmount: totalAmount.toString(),
      });

      res.json({
        success: true,
        data: { orderLine },
        message: "Customer order line deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteCustomerOrderLine:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-order-lines/order/:customerOrderId - Get order lines by customer order
  static async getOrderLinesByCustomerOrder(req, res) {
    try {
      const { customerOrderId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const orderLines = await CustomerOrderLine.findByCustomerOrder(
        parseInt(customerOrderId),
        { limit, offset }
      );

      res.json({
        success: true,
        data: { orderLines },
      });
    } catch (error) {
      console.error("Error in getOrderLinesByCustomerOrder:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-order-lines/item-type/:itemTypeId - Get order lines by item type
  static async getOrderLinesByItemType(req, res) {
    try {
      const { itemTypeId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const orderLines = await CustomerOrderLine.findByItemType(
        parseInt(itemTypeId),
        { limit, offset }
      );

      res.json({
        success: true,
        data: { orderLines },
      });
    } catch (error) {
      console.error("Error in getOrderLinesByItemType:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = CustomerOrderLineController;
