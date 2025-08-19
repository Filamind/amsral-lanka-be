const {
  eq,
  and,
  or,
  ilike,
  count,
  asc,
  desc,
  sum,
  gte,
  lte,
} = require("drizzle-orm");
const { db } = require("../config/db");
const { customerOrders, customers } = require("../db/schema");

class CustomerOrder {
  // Create a new customer order
  static async create(orderData) {
    try {
      // Generate order number if not provided
      let orderNumber = orderData.orderNumber;
      if (!orderNumber) {
        orderNumber = await this.generateOrderNumber();
      }

      // Check if order number already exists
      const existingOrder = await this.findByOrderNumber(orderNumber);
      if (existingOrder) {
        throw new Error("Order number already exists");
      }

      const [order] = await db
        .insert(customerOrders)
        .values({
          ...orderData,
          orderNumber,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return order;
    } catch (error) {
      console.error("Error creating customer order:", error);
      throw error;
    }
  }

  // Find customer order by ID
  static async findById(id) {
    try {
      const [order] = await db
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          customerId: customerOrders.customerId,
          orderDate: customerOrders.orderDate,
          deliveryDate: customerOrders.deliveryDate,
          status: customerOrders.status,
          totalAmount: customerOrders.totalAmount,
          notes: customerOrders.notes,
          isActive: customerOrders.isActive,
          createdAt: customerOrders.createdAt,
          updatedAt: customerOrders.updatedAt,
          customer: {
            id: customers.id,
            customerCode: customers.customerCode,
            firstName: customers.firstName,
            lastName: customers.lastName,
            email: customers.email,
            phone: customers.phone,
          },
        })
        .from(customerOrders)
        .leftJoin(customers, eq(customerOrders.customerId, customers.id))
        .where(eq(customerOrders.id, id))
        .limit(1);

      return order || null;
    } catch (error) {
      console.error("Error finding customer order by ID:", error);
      throw error;
    }
  }

  // Find customer order by order number
  static async findByOrderNumber(orderNumber) {
    try {
      const [order] = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.orderNumber, orderNumber))
        .limit(1);

      return order || null;
    } catch (error) {
      console.error("Error finding customer order by order number:", error);
      throw error;
    }
  }

  // Find all customer orders with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        isActive = null,
        search = null,
        status = null,
        customerId = null,
        orderDateFrom = null,
        orderDateTo = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(customerOrders.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customerOrders.orderNumber, `%${search}%`),
            ilike(customerOrders.notes, `%${search}%`),
            ilike(customers.firstName, `%${search}%`),
            ilike(customers.lastName, `%${search}%`),
            ilike(customers.customerCode, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(customerOrders.status, status));
      }

      if (customerId) {
        conditions.push(eq(customerOrders.customerId, customerId));
      }

      if (orderDateFrom) {
        conditions.push(gte(customerOrders.orderDate, orderDateFrom));
      }

      if (orderDateTo) {
        conditions.push(lte(customerOrders.orderDate, orderDateTo));
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(customerOrders[sortBy])
          : desc(customerOrders[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const orderList = await db
        .select({
          id: customerOrders.id,
          orderNumber: customerOrders.orderNumber,
          customerId: customerOrders.customerId,
          orderDate: customerOrders.orderDate,
          deliveryDate: customerOrders.deliveryDate,
          status: customerOrders.status,
          totalAmount: customerOrders.totalAmount,
          notes: customerOrders.notes,
          isActive: customerOrders.isActive,
          createdAt: customerOrders.createdAt,
          updatedAt: customerOrders.updatedAt,
          customer: {
            id: customers.id,
            customerCode: customers.customerCode,
            firstName: customers.firstName,
            lastName: customers.lastName,
            email: customers.email,
            phone: customers.phone,
          },
        })
        .from(customerOrders)
        .leftJoin(customers, eq(customerOrders.customerId, customers.id))
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return orderList;
    } catch (error) {
      console.error("Error finding customer orders:", error);
      throw error;
    }
  }

  // Count customer orders with filtering
  static async count(options = {}) {
    try {
      const {
        isActive = null,
        search = null,
        status = null,
        customerId = null,
        orderDateFrom = null,
        orderDateTo = null,
      } = options;

      // Build where conditions (same as findAll)
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(customerOrders.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customerOrders.orderNumber, `%${search}%`),
            ilike(customerOrders.notes, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(customerOrders.status, status));
      }

      if (customerId) {
        conditions.push(eq(customerOrders.customerId, customerId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(customerOrders)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting customer orders:", error);
      throw error;
    }
  }

  // Update customer order
  static async update(id, updateData) {
    try {
      // Check if order exists
      const existingOrder = await this.findById(id);
      if (!existingOrder) {
        throw new Error("Customer order not found");
      }

      // Check if order number already exists (if being updated)
      if (
        updateData.orderNumber &&
        updateData.orderNumber !== existingOrder.orderNumber
      ) {
        const existingOrderNumber = await this.findByOrderNumber(
          updateData.orderNumber
        );
        if (existingOrderNumber) {
          throw new Error("Order number already exists");
        }
      }

      const [order] = await db
        .update(customerOrders)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(customerOrders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error("Error updating customer order:", error);
      throw error;
    }
  }

  // Delete customer order (soft delete)
  static async delete(id) {
    try {
      const [order] = await db
        .update(customerOrders)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(customerOrders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error("Error deleting customer order:", error);
      throw error;
    }
  }

  // Generate next order number
  static async generateOrderNumber() {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const prefix = `ORD-${year}${month}-`;

      // Find the latest order number for this month
      const [latestOrder] = await db
        .select({ orderNumber: customerOrders.orderNumber })
        .from(customerOrders)
        .where(ilike(customerOrders.orderNumber, `${prefix}%`))
        .orderBy(desc(customerOrders.orderNumber))
        .limit(1);

      if (!latestOrder) {
        return `${prefix}001`;
      }

      // Extract number and increment
      const match = latestOrder.orderNumber.match(/(\d+)$/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
      }

      return `${prefix}001`;
    } catch (error) {
      console.error("Error generating order number:", error);
      throw error;
    }
  }

  // Get orders by status
  static async findByStatus(status, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const orderList = await db
        .select()
        .from(customerOrders)
        .where(
          and(
            eq(customerOrders.isActive, true),
            eq(customerOrders.status, status)
          )
        )
        .orderBy(desc(customerOrders.createdAt))
        .limit(limit)
        .offset(offset);

      return orderList;
    } catch (error) {
      console.error("Error finding orders by status:", error);
      throw error;
    }
  }

  // Get orders by customer
  static async findByCustomer(customerId, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const orderList = await db
        .select()
        .from(customerOrders)
        .where(
          and(
            eq(customerOrders.isActive, true),
            eq(customerOrders.customerId, customerId)
          )
        )
        .orderBy(desc(customerOrders.createdAt))
        .limit(limit)
        .offset(offset);

      return orderList;
    } catch (error) {
      console.error("Error finding orders by customer:", error);
      throw error;
    }
  }

  // Get order statistics
  static async getStatistics() {
    try {
      const [stats] = await db
        .select({
          totalOrders: count(),
          totalAmount: sum(customerOrders.totalAmount),
        })
        .from(customerOrders)
        .where(eq(customerOrders.isActive, true));

      const [statusStats] = await db
        .select({
          status: customerOrders.status,
          count: count(),
        })
        .from(customerOrders)
        .where(eq(customerOrders.isActive, true))
        .groupBy(customerOrders.status);

      return {
        total: stats.totalOrders,
        totalAmount: stats.totalAmount || 0,
        byStatus: statusStats || [],
      };
    } catch (error) {
      console.error("Error getting order statistics:", error);
      throw error;
    }
  }
}

module.exports = CustomerOrder;
