const { eq, and, or, ilike, count, asc, desc, sum } = require("drizzle-orm");
const { db } = require("../config/db");
const {
  machineAssignments,
  orderRecords,
  orders,
  employees,
  customers,
  items,
} = require("../db/schema");

class MachineAssignment {
  // Find all machine assignments with filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        recordId = null,
        orderId = null,
        status = null,
        assignedById = null,
        search = null,
        sortBy = "id",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (recordId) {
        conditions.push(eq(machineAssignments.recordId, recordId));
      }

      if (orderId) {
        conditions.push(eq(machineAssignments.orderId, orderId));
      }

      if (status) {
        conditions.push(eq(machineAssignments.status, status));
      }

      if (assignedById) {
        conditions.push(eq(machineAssignments.assignedById, assignedById));
      }

      if (search) {
        conditions.push(
          or(
            ilike(machineAssignments.washingMachine, `%${search}%`),
            ilike(machineAssignments.dryingMachine, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(machineAssignments[sortBy])
          : desc(machineAssignments[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const assignmentList = await db
        .select()
        .from(machineAssignments)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Enhance with related data
      const enhancedAssignments = await Promise.all(
        assignmentList.map(async (assignment) => {
          const { assignedById, ...assignmentWithoutId } = assignment;
          return {
            ...assignmentWithoutId,
            assignedTo: await this.getEmployeeName(assignedById),
            orderRef: await this.getOrderReference(assignment.orderId),
            customerName: await this.getCustomerName(assignment.orderId),
            item: await this.getItemName(assignment.recordId),
          };
        })
      );

      return enhancedAssignments;
    } catch (error) {
      console.error("Error finding machine assignments:", error);
      throw error;
    }
  }

  // Find assignment by ID
  static async findById(id) {
    try {
      const [assignment] = await db
        .select()
        .from(machineAssignments)
        .where(eq(machineAssignments.id, id))
        .limit(1);

      if (!assignment) return null;

      // Enhance with related data
      const { assignedById, ...assignmentWithoutId } = assignment;
      return {
        ...assignmentWithoutId,
        assignedTo: await this.getEmployeeName(assignedById),
        orderRef: await this.getOrderReference(assignment.orderId),
        customerName: await this.getCustomerName(assignment.orderId),
        item: await this.getItemName(assignment.recordId),
      };
    } catch (error) {
      console.error("Error finding assignment by ID:", error);
      throw error;
    }
  }

  // Find assignments by record ID
  static async findByRecordId(recordId, options = {}) {
    try {
      return await this.findAll({ ...options, recordId });
    } catch (error) {
      console.error("Error finding assignments by record ID:", error);
      throw error;
    }
  }

  // Count assignments with filtering
  static async count(options = {}) {
    try {
      const {
        recordId = null,
        orderId = null,
        status = null,
        assignedById = null,
        search = null,
      } = options;

      const conditions = [];

      if (recordId) {
        conditions.push(eq(machineAssignments.recordId, recordId));
      }

      if (orderId) {
        conditions.push(eq(machineAssignments.orderId, orderId));
      }

      if (status) {
        conditions.push(eq(machineAssignments.status, status));
      }

      if (assignedById) {
        conditions.push(eq(machineAssignments.assignedById, assignedById));
      }

      if (search) {
        conditions.push(
          or(
            ilike(machineAssignments.washingMachine, `%${search}%`),
            ilike(machineAssignments.dryingMachine, `%${search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(machineAssignments)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting assignments:", error);
      throw error;
    }
  }

  // Create new assignment
  static async create(assignmentData) {
    try {
      const [assignment] = await db
        .insert(machineAssignments)
        .values({
          ...assignmentData,
          assignedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Enhance with related data
      const { assignedById, ...assignmentWithoutId } = assignment;
      return {
        ...assignmentWithoutId,
        assignedTo: await this.getEmployeeName(assignedById),
        orderRef: await this.getOrderReference(assignment.orderId),
        customerName: await this.getCustomerName(assignment.orderId),
        item: await this.getItemName(assignment.recordId),
      };
    } catch (error) {
      console.error("Error creating assignment:", error);
      throw error;
    }
  }

  // Update assignment
  static async update(id, updateData) {
    try {
      const [assignment] = await db
        .update(machineAssignments)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(machineAssignments.id, id))
        .returning();

      if (!assignment) return null;

      // Enhance with related data
      const { assignedById, ...assignmentWithoutId } = assignment;
      return {
        ...assignmentWithoutId,
        assignedTo: await this.getEmployeeName(assignedById),
        orderRef: await this.getOrderReference(assignment.orderId),
        customerName: await this.getCustomerName(assignment.orderId),
        item: await this.getItemName(assignment.recordId),
      };
    } catch (error) {
      console.error("Error updating assignment:", error);
      throw error;
    }
  }

  // Delete assignment
  static async delete(id) {
    try {
      const [assignment] = await db
        .delete(machineAssignments)
        .where(eq(machineAssignments.id, id))
        .returning();

      return assignment;
    } catch (error) {
      console.error("Error deleting assignment:", error);
      throw error;
    }
  }

  // Get assignment statistics for a record
  static async getRecordStats(recordId) {
    try {
      // Get total quantity from record
      const [record] = await db
        .select({ quantity: orderRecords.quantity })
        .from(orderRecords)
        .where(eq(orderRecords.id, recordId));

      if (!record) {
        throw new Error("Record not found");
      }

      // Get total assigned quantity
      const [assignedResult] = await db
        .select({ totalAssigned: sum(machineAssignments.quantity) })
        .from(machineAssignments)
        .where(eq(machineAssignments.recordId, recordId));

      // Get assignment counts by status
      const [totalResult] = await db
        .select({ count: count() })
        .from(machineAssignments)
        .where(eq(machineAssignments.recordId, recordId));

      const [completedResult] = await db
        .select({ count: count() })
        .from(machineAssignments)
        .where(
          and(
            eq(machineAssignments.recordId, recordId),
            eq(machineAssignments.status, "Completed")
          )
        );

      const [inProgressResult] = await db
        .select({ count: count() })
        .from(machineAssignments)
        .where(
          and(
            eq(machineAssignments.recordId, recordId),
            eq(machineAssignments.status, "In Progress")
          )
        );

      const totalQuantity = record.quantity;
      const assignedQuantity = assignedResult.totalAssigned || 0;
      const remainingQuantity = totalQuantity - assignedQuantity;
      const totalAssignments = totalResult.count;
      const completedAssignments = completedResult.count;
      const inProgressAssignments = inProgressResult.count;
      const completionPercentage =
        totalQuantity > 0
          ? Math.round((assignedQuantity / totalQuantity) * 100)
          : 0;

      return {
        totalQuantity,
        assignedQuantity,
        remainingQuantity,
        totalAssignments,
        completedAssignments,
        inProgressAssignments,
        completionPercentage,
      };
    } catch (error) {
      console.error("Error getting record stats:", error);
      throw error;
    }
  }

  // Helper methods
  static async getEmployeeName(employeeId) {
    try {
      if (!employeeId) return null;

      const [employee] = await db
        .select({
          firstName: employees.firstName,
          lastName: employees.lastName,
        })
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (!employee) return null;

      // Concatenate first and last name
      const fullName = `${employee.firstName || ""} ${
        employee.lastName || ""
      }`.trim();
      return fullName || null;
    } catch (error) {
      return null;
    }
  }

  static async getOrderReference(orderId) {
    try {
      const [order] = await db
        .select({ referenceNo: orders.referenceNo })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      return order?.referenceNo || null;
    } catch (error) {
      return null;
    }
  }

  static async getCustomerName(orderId) {
    try {
      const [order] = await db
        .select({ customerId: orders.customerId })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order?.customerId) return null;

      const [customer] = await db
        .select({ name: customers.name })
        .from(customers)
        .where(eq(customers.id, order.customerId))
        .limit(1);

      return customer?.name || null;
    } catch (error) {
      return null;
    }
  }

  static async getItemName(recordId) {
    try {
      const [record] = await db
        .select({ itemId: orderRecords.itemId })
        .from(orderRecords)
        .where(eq(orderRecords.id, recordId))
        .limit(1);

      if (!record?.itemId) return null;

      const [item] = await db
        .select({ name: items.name })
        .from(items)
        .where(eq(items.id, record.itemId))
        .limit(1);

      return item?.name || record.itemId;
    } catch (error) {
      return null;
    }
  }
}

module.exports = MachineAssignment;
