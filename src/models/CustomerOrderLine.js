const {
  eq,
  and,
  or,
  ilike,
  count,
  asc,
  desc,
  sum,
  sql,
} = require("drizzle-orm");
const { db } = require("../config/db");
const {
  customerOrderLines,
  customerOrders,
  itemTypes,
  customers,
  washingTypes,
} = require("../db/schema");

class CustomerOrderLine {
  // Create a new customer order line
  static async create(orderLineData) {
    try {
      const [orderLine] = await db
        .insert(customerOrderLines)
        .values({
          ...orderLineData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return orderLine;
    } catch (error) {
      console.error("Error creating customer order line:", error);
      throw error;
    }
  }

  // Find customer order line by ID
  static async findById(id) {
    try {
      const [orderLine] = await db
        .select({
          id: customerOrderLines.id,
          customerOrderId: customerOrderLines.customerOrderId,
          itemTypeId: customerOrderLines.itemTypeId,
          quantity: customerOrderLines.quantity,
          unitPrice: customerOrderLines.unitPrice,
          totalPrice: customerOrderLines.totalPrice,
          description: customerOrderLines.description,
          notes: customerOrderLines.notes,
          isActive: customerOrderLines.isActive,
          createdAt: customerOrderLines.createdAt,
          updatedAt: customerOrderLines.updatedAt,
          itemType: {
            id: itemTypes.id,
            name: itemTypes.name,
            code: itemTypes.code,
            category: itemTypes.category,
          },
          customerOrder: {
            id: customerOrders.id,
            orderNumber: customerOrders.orderNumber,
            status: customerOrders.status,
          },
        })
        .from(customerOrderLines)
        .leftJoin(itemTypes, eq(customerOrderLines.itemTypeId, itemTypes.id))
        .leftJoin(
          customerOrders,
          eq(customerOrderLines.customerOrderId, customerOrders.id)
        )
        .where(eq(customerOrderLines.id, id))
        .limit(1);

      return orderLine || null;
    } catch (error) {
      console.error("Error finding customer order line by ID:", error);
      throw error;
    }
  }

  // Find all customer order lines with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        isActive = null,
        customerOrderId = null,
        itemTypeId = null,
        search = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(customerOrderLines.isActive, isActive));
      }

      if (customerOrderId) {
        conditions.push(
          eq(customerOrderLines.customerOrderId, customerOrderId)
        );
      }

      if (itemTypeId) {
        conditions.push(eq(customerOrderLines.itemTypeId, itemTypeId));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customerOrderLines.description, `%${search}%`),
            ilike(customerOrderLines.notes, `%${search}%`),
            ilike(itemTypes.name, `%${search}%`),
            ilike(itemTypes.code, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(customerOrderLines[sortBy])
          : desc(customerOrderLines[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const orderLineList = await db
        .select({
          id: customerOrderLines.id,
          customerOrderId: customerOrderLines.customerOrderId,
          itemTypeId: customerOrderLines.itemTypeId,
          quantity: customerOrderLines.quantity,
          unitPrice: customerOrderLines.unitPrice,
          totalPrice: customerOrderLines.totalPrice,
          description: customerOrderLines.description,
          notes: customerOrderLines.notes,
          isActive: customerOrderLines.isActive,
          createdAt: customerOrderLines.createdAt,
          updatedAt: customerOrderLines.updatedAt,
          itemType: {
            id: itemTypes.id,
            name: itemTypes.name,
            code: itemTypes.code,
            category: itemTypes.category,
          },
          customerOrder: {
            id: customerOrders.id,
            orderNumber: customerOrders.orderNumber,
            status: customerOrders.status,
          },
        })
        .from(customerOrderLines)
        .leftJoin(itemTypes, eq(customerOrderLines.itemTypeId, itemTypes.id))
        .leftJoin(
          customerOrders,
          eq(customerOrderLines.customerOrderId, customerOrders.id)
        )
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return orderLineList;
    } catch (error) {
      console.error("Error finding customer order lines:", error);
      throw error;
    }
  }

  // Count customer order lines with filtering
  static async count(options = {}) {
    try {
      const {
        isActive = null,
        customerOrderId = null,
        itemTypeId = null,
        search = null,
      } = options;

      // Build where conditions (same as findAll)
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(customerOrderLines.isActive, isActive));
      }

      if (customerOrderId) {
        conditions.push(
          eq(customerOrderLines.customerOrderId, customerOrderId)
        );
      }

      if (itemTypeId) {
        conditions.push(eq(customerOrderLines.itemTypeId, itemTypeId));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customerOrderLines.description, `%${search}%`),
            ilike(customerOrderLines.notes, `%${search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(customerOrderLines)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting customer order lines:", error);
      throw error;
    }
  }

  // Update customer order line
  static async update(id, updateData) {
    try {
      // Check if order line exists
      const existingOrderLine = await this.findById(id);
      if (!existingOrderLine) {
        throw new Error("Customer order line not found");
      }

      const [orderLine] = await db
        .update(customerOrderLines)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLines.id, id))
        .returning();

      return orderLine;
    } catch (error) {
      console.error("Error updating customer order line:", error);
      throw error;
    }
  }

  // Delete customer order line (soft delete)
  static async delete(id) {
    try {
      const [orderLine] = await db
        .update(customerOrderLines)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLines.id, id))
        .returning();

      return orderLine;
    } catch (error) {
      console.error("Error deleting customer order line:", error);
      throw error;
    }
  }

  // Hard delete customer order line
  static async hardDelete(id) {
    try {
      const [orderLine] = await db
        .delete(customerOrderLines)
        .where(eq(customerOrderLines.id, id))
        .returning();

      return orderLine;
    } catch (error) {
      console.error("Error hard deleting customer order line:", error);
      throw error;
    }
  }

  // Find order lines by customer order
  static async findByCustomerOrder(customerOrderId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const orderLineList = await db
        .select({
          id: customerOrderLines.id,
          customerOrderId: customerOrderLines.customerOrderId,
          itemTypeId: customerOrderLines.itemTypeId,
          quantity: customerOrderLines.quantity,
          unitPrice: customerOrderLines.unitPrice,
          totalPrice: customerOrderLines.totalPrice,
          description: customerOrderLines.description,
          notes: customerOrderLines.notes,
          isActive: customerOrderLines.isActive,
          createdAt: customerOrderLines.createdAt,
          updatedAt: customerOrderLines.updatedAt,
          itemType: {
            id: itemTypes.id,
            name: itemTypes.name,
            code: itemTypes.code,
            category: itemTypes.category,
          },
        })
        .from(customerOrderLines)
        .leftJoin(itemTypes, eq(customerOrderLines.itemTypeId, itemTypes.id))
        .where(
          and(
            eq(customerOrderLines.isActive, true),
            eq(customerOrderLines.customerOrderId, customerOrderId)
          )
        )
        .orderBy(asc(customerOrderLines.id))
        .limit(limit)
        .offset(offset);

      return orderLineList;
    } catch (error) {
      console.error("Error finding order lines by customer order:", error);
      throw error;
    }
  }

  // Find order lines by item type
  static async findByItemType(itemTypeId, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const orderLineList = await db
        .select()
        .from(customerOrderLines)
        .where(
          and(
            eq(customerOrderLines.isActive, true),
            eq(customerOrderLines.itemTypeId, itemTypeId)
          )
        )
        .orderBy(desc(customerOrderLines.createdAt))
        .limit(limit)
        .offset(offset);

      return orderLineList;
    } catch (error) {
      console.error("Error finding order lines by item type:", error);
      throw error;
    }
  }

  // Calculate total for customer order
  static async calculateOrderTotal(customerOrderId) {
    try {
      const [result] = await db
        .select({
          totalAmount: sum(customerOrderLines.totalPrice),
          totalQuantity: sum(customerOrderLines.quantity),
        })
        .from(customerOrderLines)
        .where(
          and(
            eq(customerOrderLines.isActive, true),
            eq(customerOrderLines.customerOrderId, customerOrderId)
          )
        );

      return {
        totalAmount: result.totalAmount || 0,
        totalQuantity: result.totalQuantity || 0,
      };
    } catch (error) {
      console.error("Error calculating order total:", error);
      throw error;
    }
  }

  // Bulk create order lines
  static async bulkCreate(orderLinesData) {
    try {
      const orderLines = await db
        .insert(customerOrderLines)
        .values(
          orderLinesData.map((data) => ({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .returning();

      return orderLines;
    } catch (error) {
      console.error("Error bulk creating customer order lines:", error);
      throw error;
    }
  }

  // Find all order lines with details for production workflow
  static async findAllWithDetails(options = {}) {
    try {
      const { status, search, includeProcesses = false } = options;

      let query = db
        .select({
          id: customerOrderLines.id,
          customerOrderId: customerOrderLines.customerOrderId,
          quantity: customerOrderLines.quantity,
          remainingQuantity: customerOrderLines.remainingQuantity,
          status: customerOrderLines.status,
          itemType: itemTypes.name,
          item: itemTypes.name,
          orderNumber: customerOrders.orderNumber,
          referenceNo: customerOrders.orderNumber,
          customerName: sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
          washingType: washingTypes.name,
        })
        .from(customerOrderLines)
        .leftJoin(
          customerOrders,
          eq(customerOrderLines.customerOrderId, customerOrders.id)
        )
        .leftJoin(customers, eq(customerOrders.customerId, customers.id))
        .leftJoin(itemTypes, eq(customerOrderLines.itemTypeId, itemTypes.id))
        .leftJoin(
          washingTypes,
          eq(customerOrderLines.washingTypeId, washingTypes.id)
        )
        .where(eq(customerOrderLines.isActive, true));

      if (status) {
        query = query.where(eq(customerOrderLines.status, status));
      }

      if (search) {
        query = query.where(
          or(
            ilike(customerOrders.orderNumber, `%${search}%`),
            ilike(customers.firstName, `%${search}%`),
            ilike(customers.lastName, `%${search}%`),
            ilike(itemTypes.name, `%${search}%`)
          )
        );
      }

      const result = await query.orderBy(desc(customerOrderLines.createdAt));

      // Add processes if requested
      if (includeProcesses) {
        // This would require joining with CustomerOrderLineProcess table
        // For now, return basic structure
        return result.map((record) => ({
          ...record,
          processes: [], // Placeholder - implement actual process joining
        }));
      }

      return result;
    } catch (error) {
      console.error("Error finding order lines with details:", error);
      throw error;
    }
  }

  // Update remaining quantity for production workflow
  static async updateRemainingQuantity(id, remainingQuantity) {
    try {
      const [orderLine] = await db
        .update(customerOrderLines)
        .set({
          remainingQuantity,
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLines.id, id))
        .returning();

      return orderLine;
    } catch (error) {
      console.error("Error updating remaining quantity:", error);
      throw error;
    }
  }

  // Update status for production workflow
  static async updateStatus(id, status) {
    try {
      const [orderLine] = await db
        .update(customerOrderLines)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLines.id, id))
        .returning();

      return orderLine;
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  }
}

module.exports = CustomerOrderLine;
