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
  sql,
} = require("drizzle-orm");
const { db } = require("../config/db");
const { orders, orderRecords, customers, itemTypes } = require("../db/schema");

class Order {
  // Create a new order
  static async create(orderData) {
    try {
      // Generate reference number if not provided
      let referenceNo = orderData.referenceNo;
      if (!referenceNo) {
        referenceNo = await this.generateReferenceNumber();
      }

      // Check if reference number already exists
      const existingOrder = await this.findByReferenceNo(referenceNo);
      if (existingOrder) {
        throw new Error("Reference number already exists");
      }

      const [order] = await db
        .insert(orders)
        .values({
          ...orderData,
          referenceNo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // Find order by ID with customer and item details
  static async findById(id) {
    try {
      const [order] = await db
        .select({
          id: orders.id,
          date: orders.date,
          referenceNo: orders.referenceNo,
          customerId: orders.customerId,
          itemId: orders.itemId,
          quantity: orders.quantity,
          notes: orders.notes,
          deliveryDate: orders.deliveryDate,
          status: orders.status,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) return null;

      // Get customer and item names (you'll need to implement these lookups)
      // For now, returning the order structure expected by FE
      return {
        ...order,
        customerName: await this.getCustomerName(order.customerId),
        itemName: await this.getItemName(order.itemId),
        recordsCount: await this.getRecordsCount(id),
      };
    } catch (error) {
      console.error("Error finding order by ID:", error);
      throw error;
    }
  }

  // Find order by reference number
  static async findByReferenceNo(referenceNo) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.referenceNo, referenceNo))
        .limit(1);

      return order || null;
    } catch (error) {
      console.error("Error finding order by reference number:", error);
      throw error;
    }
  }

  // Find all orders with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        search = null,
        status = null,
        customerId = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(orders.referenceNo, `%${search}%`),
            ilike(orders.customerId, `%${search}%`),
            ilike(orders.itemId, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(orders.status, status));
      }

      if (customerId) {
        conditions.push(eq(orders.customerId, customerId));
      }

      // Build order by
      const orderBy =
        sortOrder === "asc" ? asc(orders[sortBy]) : desc(orders[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const orderList = await db
        .select({
          id: orders.id,
          date: orders.date,
          referenceNo: orders.referenceNo,
          customerId: orders.customerId,
          itemId: orders.itemId,
          quantity: orders.quantity,
          notes: orders.notes,
          deliveryDate: orders.deliveryDate,
          status: orders.status,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Enhance with customer names, item names, and records count
      const enhancedOrders = await Promise.all(
        orderList.map(async (order) => ({
          ...order,
          customerName: await this.getCustomerName(order.customerId),
          itemName: await this.getItemName(order.itemId),
          recordsCount: await this.getRecordsCount(order.id),
          records: await this.getOrderRecords(order.id),
        }))
      );

      return enhancedOrders;
    } catch (error) {
      console.error("Error finding orders:", error);
      throw error;
    }
  }

  // Count orders with filtering
  static async count(options = {}) {
    try {
      const { search = null, status = null, customerId = null } = options;

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(orders.referenceNo, `%${search}%`),
            ilike(orders.customerId, `%${search}%`),
            ilike(orders.itemId, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(orders.status, status));
      }

      if (customerId) {
        conditions.push(eq(orders.customerId, customerId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting orders:", error);
      throw error;
    }
  }

  // Update order
  static async update(id, updateData) {
    try {
      const existingOrder = await this.findById(id);
      if (!existingOrder) {
        throw new Error("Order not found");
      }

      if (
        updateData.referenceNo &&
        updateData.referenceNo !== existingOrder.referenceNo
      ) {
        const existingRef = await this.findByReferenceNo(
          updateData.referenceNo
        );
        if (existingRef) {
          throw new Error("Reference number already exists");
        }
      }

      const [order] = await db
        .update(orders)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }

  // Delete order (cascade delete will handle records)
  static async delete(id) {
    try {
      const [order] = await db
        .delete(orders)
        .where(eq(orders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  // Generate next reference number
  static async generateReferenceNumber() {
    try {
      // Find the latest order number
      const [latestOrder] = await db
        .select({ referenceNo: orders.referenceNo })
        .from(orders)
        .where(ilike(orders.referenceNo, "ORD%"))
        .orderBy(desc(orders.referenceNo))
        .limit(1);

      if (!latestOrder) {
        return "ORD001";
      }

      // Extract number and increment
      const match = latestOrder.referenceNo.match(/ORD(\d+)$/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `ORD${nextNumber.toString().padStart(3, "0")}`;
      }

      return "ORD001";
    } catch (error) {
      console.error("Error generating reference number:", error);
      throw error;
    }
  }

  // Helper methods
  static async getCustomerName(customerId) {
    try {
      // Implement customer lookup by customerId
      // For now, return placeholder
      return `Customer ${customerId}`;
    } catch (error) {
      return `Customer ${customerId}`;
    }
  }

  static async getItemName(itemId) {
    try {
      // Implement item lookup by itemId
      // For now, return placeholder
      return `Item ${itemId}`;
    } catch (error) {
      return `Item ${itemId}`;
    }
  }

  static async getRecordsCount(orderId) {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId));

      return result.count;
    } catch (error) {
      return 0;
    }
  }

  static async getOrderRecords(orderId) {
    try {
      const records = await db
        .select()
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .orderBy(asc(orderRecords.id));

      return records;
    } catch (error) {
      return [];
    }
  }
}

module.exports = Order;
