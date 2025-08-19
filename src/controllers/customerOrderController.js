const CustomerOrder = require("../models/CustomerOrder");
const CustomerOrderLine = require("../models/CustomerOrderLine");

class CustomerOrderController {
  // GET /api/customer-orders - Get all customer orders with pagination
  static async getCustomerOrders(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const search = req.query.search;
      const status = req.query.status;
      const customerId = req.query.customerId
        ? parseInt(req.query.customerId)
        : null;
      const orderDateFrom = req.query.orderDateFrom;
      const orderDateTo = req.query.orderDateTo;
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

      const [orders, totalCount] = await Promise.all([
        CustomerOrder.findAll({
          limit,
          offset,
          isActive,
          search,
          status,
          customerId,
          orderDateFrom,
          orderDateTo,
          sortBy,
          sortOrder,
        }),
        CustomerOrder.count({
          isActive,
          search,
          status,
          customerId,
          orderDateFrom,
          orderDateTo,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          orders,
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
      console.error("Error in getCustomerOrders:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-orders/:id - Get customer order by ID
  static async getCustomerOrderById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order ID",
        });
      }

      const [order, orderLines] = await Promise.all([
        CustomerOrder.findById(parseInt(id)),
        CustomerOrderLine.findByCustomerOrder(parseInt(id)),
      ]);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Customer order not found",
        });
      }

      res.json({
        success: true,
        data: {
          order: {
            ...order,
            orderLines,
          },
        },
      });
    } catch (error) {
      console.error("Error in getCustomerOrderById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-orders/order-number/:orderNumber - Get customer order by order number
  static async getCustomerOrderByOrderNumber(req, res) {
    try {
      const { orderNumber } = req.params;

      if (!orderNumber || orderNumber.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Order number is required",
        });
      }

      const order = await CustomerOrder.findByOrderNumber(orderNumber.trim());

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Customer order not found",
        });
      }

      // Get order lines
      const orderLines = await CustomerOrderLine.findByCustomerOrder(order.id);

      res.json({
        success: true,
        data: {
          order: {
            ...order,
            orderLines,
          },
        },
      });
    } catch (error) {
      console.error("Error in getCustomerOrderByOrderNumber:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-orders/stats - Get customer order statistics
  static async getCustomerOrderStats(req, res) {
    try {
      const stats = await CustomerOrder.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error in getCustomerOrderStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/customer-orders - Create new customer order
  static async createCustomerOrder(req, res) {
    try {
      const {
        orderNumber,
        customerId,
        orderDate,
        deliveryDate,
        status,
        notes,
        orderLines = [],
      } = req.body;

      // Validate required fields
      if (!customerId || !orderDate) {
        return res.status(400).json({
          success: false,
          message: "Customer ID and order date are required",
        });
      }

      // Create the order
      const orderData = {
        orderNumber: orderNumber?.trim() || null,
        customerId: parseInt(customerId),
        orderDate,
        deliveryDate: deliveryDate || null,
        status: status || "pending",
        notes: notes?.trim() || null,
        totalAmount: "0.00",
      };

      const order = await CustomerOrder.create(orderData);

      // Create order lines if provided
      let createdOrderLines = [];
      if (orderLines.length > 0) {
        const orderLineData = orderLines.map((line) => ({
          customerOrderId: order.id,
          itemTypeId: parseInt(line.itemTypeId),
          quantity: parseInt(line.quantity),
          unitPrice: line.unitPrice || "0.00",
          totalPrice: (
            parseFloat(line.unitPrice || 0) * parseInt(line.quantity)
          ).toFixed(2),
          description: line.description?.trim() || null,
          notes: line.notes?.trim() || null,
        }));

        createdOrderLines = await CustomerOrderLine.bulkCreate(orderLineData);

        // Calculate and update total amount
        const { totalAmount } = await CustomerOrderLine.calculateOrderTotal(
          order.id
        );
        await CustomerOrder.update(order.id, {
          totalAmount: totalAmount.toString(),
        });
      }

      // Get the complete order with lines
      const completeOrder = await CustomerOrder.findById(order.id);

      res.status(201).json({
        success: true,
        data: {
          order: {
            ...completeOrder,
            orderLines: createdOrderLines,
          },
        },
        message: "Customer order created successfully",
      });
    } catch (error) {
      console.error("Error in createCustomerOrder:", error);

      if (error.message === "Order number already exists") {
        return res.status(409).json({
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

  // PUT /api/customer-orders/:id - Update customer order
  static async updateCustomerOrder(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order ID",
        });
      }

      const updateData = { ...req.body };

      // Clean up string fields
      Object.keys(updateData).forEach((key) => {
        if (typeof updateData[key] === "string") {
          updateData[key] = updateData[key].trim() || null;
        }
      });

      // Remove orderLines from update data if present
      delete updateData.orderLines;

      const order = await CustomerOrder.update(parseInt(id), updateData);

      res.json({
        success: true,
        data: { order },
        message: "Customer order updated successfully",
      });
    } catch (error) {
      console.error("Error in updateCustomerOrder:", error);

      if (error.message === "Customer order not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === "Order number already exists") {
        return res.status(409).json({
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

  // DELETE /api/customer-orders/:id - Delete customer order (soft delete)
  static async deleteCustomerOrder(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order ID",
        });
      }

      const order = await CustomerOrder.delete(parseInt(id));

      res.json({
        success: true,
        data: { order },
        message: "Customer order deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteCustomerOrder:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-orders/customer/:customerId - Get orders by customer
  static async getOrdersByCustomer(req, res) {
    try {
      const { customerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const orders = await CustomerOrder.findByCustomer(parseInt(customerId), {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: { orders },
      });
    } catch (error) {
      console.error("Error in getOrdersByCustomer:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-orders/status/:status - Get orders by status
  static async getOrdersByStatus(req, res) {
    try {
      const { status } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const orders = await CustomerOrder.findByStatus(status, {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: { orders },
      });
    } catch (error) {
      console.error("Error in getOrdersByStatus:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-orders/generate-order-number - Generate next order number
  static async generateOrderNumber(req, res) {
    try {
      const orderNumber = await CustomerOrder.generateOrderNumber();

      res.json({
        success: true,
        data: { orderNumber },
      });
    } catch (error) {
      console.error("Error in generateOrderNumber:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = CustomerOrderController;
