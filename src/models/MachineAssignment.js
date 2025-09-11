const {
  eq,
  and,
  or,
  ilike,
  count,
  asc,
  desc,
  sum,
  isNull,
  ne,
} = require("drizzle-orm");
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
  // Generate tracking number for a new machine assignment
  static async generateTrackingNumber(recordId) {
    try {
      // Get the order record's tracking number
      const [record] = await db
        .select({ trackingNumber: orderRecords.trackingNumber })
        .from(orderRecords)
        .where(eq(orderRecords.id, recordId))
        .limit(1);

      if (!record || !record.trackingNumber) {
        throw new Error(
          `Order record with ID ${recordId} not found or has no tracking number`
        );
      }

      const orderRecordTrackingNumber = record.trackingNumber;

      // Get the latest assignment tracking number for this record
      const latestAssignment = await db
        .select({ trackingNumber: machineAssignments.trackingNumber })
        .from(machineAssignments)
        .where(eq(machineAssignments.recordId, recordId))
        .orderBy(desc(machineAssignments.id))
        .limit(1);

      if (
        !latestAssignment ||
        latestAssignment.length === 0 ||
        !latestAssignment[0].trackingNumber
      ) {
        // First assignment for this record - use '1'
        return `${orderRecordTrackingNumber}1`;
      }

      // Get the last number from the tracking number
      const lastTrackingNumber = latestAssignment[0].trackingNumber;
      const lastNumber = parseInt(lastTrackingNumber.slice(-1));

      // Generate next number (1 -> 2 -> 3, etc.)
      const nextNumber = lastNumber + 1;

      return `${orderRecordTrackingNumber}${nextNumber}`;
    } catch (error) {
      console.error(
        "Error generating machine assignment tracking number:",
        error
      );
      throw error;
    }
  }

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
      // Generate tracking number
      const trackingNumber = await this.generateTrackingNumber(
        assignmentData.recordId
      );

      const [assignment] = await db
        .insert(machineAssignments)
        .values({
          ...assignmentData,
          trackingNumber,
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

  // Update tracking numbers for existing assignments that have NULL tracking numbers
  static async updateNullTrackingNumbers() {
    try {
      // Get all assignments with NULL tracking numbers, grouped by recordId
      const assignmentsWithNullTracking = await db
        .select()
        .from(machineAssignments)
        .where(isNull(machineAssignments.trackingNumber))
        .orderBy(asc(machineAssignments.recordId), asc(machineAssignments.id));

      if (assignmentsWithNullTracking.length === 0) {
        return {
          updated: 0,
          message: "No assignments with NULL tracking numbers found",
        };
      }

      // Group by recordId and update tracking numbers
      const recordGroups = {};
      assignmentsWithNullTracking.forEach((assignment) => {
        if (!recordGroups[assignment.recordId]) {
          recordGroups[assignment.recordId] = [];
        }
        recordGroups[assignment.recordId].push(assignment);
      });

      let totalUpdated = 0;
      for (const [recordId, assignments] of Object.entries(recordGroups)) {
        // Get the order record's tracking number
        const [record] = await db
          .select({ trackingNumber: orderRecords.trackingNumber })
          .from(orderRecords)
          .where(eq(orderRecords.id, parseInt(recordId)))
          .limit(1);

        if (!record || !record.trackingNumber) {
          console.warn(
            `Skipping record ${recordId} - no tracking number found`
          );
          continue;
        }

        const orderRecordTrackingNumber = record.trackingNumber;

        // Get existing assignment tracking numbers for this record to determine starting number
        const existingAssignments = await db
          .select({ trackingNumber: machineAssignments.trackingNumber })
          .from(machineAssignments)
          .where(
            and(
              eq(machineAssignments.recordId, parseInt(recordId)),
              ne(machineAssignments.trackingNumber, null)
            )
          )
          .orderBy(desc(machineAssignments.id));

        let nextNumberIndex = 1;
        if (existingAssignments.length > 0) {
          // Find the highest number used
          const lastTrackingNumber = existingAssignments[0].trackingNumber;
          const lastNumber = parseInt(lastTrackingNumber.slice(-1));
          nextNumberIndex = lastNumber + 1;
        }

        // Update each assignment with NULL tracking number
        for (const assignment of assignments) {
          const trackingNumber = `${orderRecordTrackingNumber}${nextNumberIndex}`;

          await db
            .update(machineAssignments)
            .set({
              trackingNumber,
              updatedAt: new Date(),
            })
            .where(eq(machineAssignments.id, assignment.id));

          nextNumberIndex++;
          totalUpdated++;
        }
      }

      return {
        updated: totalUpdated,
        message: `Updated ${totalUpdated} assignments with tracking numbers`,
      };
    } catch (error) {
      console.error("Error updating NULL tracking numbers:", error);
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

      const totalQuantity = parseInt(record.quantity) || 0;
      const assignedQuantity = parseInt(assignedResult.totalAssigned) || 0;
      const remainingQuantity = totalQuantity - assignedQuantity;
      const totalAssignments = parseInt(totalResult.count) || 0;
      const completedAssignments = parseInt(completedResult.count) || 0;
      const inProgressAssignments = parseInt(inProgressResult.count) || 0;
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
