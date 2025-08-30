const {
  eq,
  and,
  or,
  ilike,
  count,
  asc,
  desc,
  max,
  sql,
  isNotNull,
} = require("drizzle-orm");
const { db } = require("../config/db");
const {
  customerOrderLineProcesses,
  customerOrderLines,
  washingTypes,
  dryingTypes,
  customerOrders,
  itemTypes,
  customers,
  users,
} = require("../db/schema");

class CustomerOrderLineProcess {
  // Create a new customer order line process
  static async create(processData) {
    try {
      // Validate process type
      if (!["washing", "drying"].includes(processData.processType)) {
        throw new Error('Process type must be either "washing" or "drying"');
      }

      // Validate that the correct type ID is provided
      if (processData.processType === "washing" && !processData.washingTypeId) {
        throw new Error("Washing type ID is required for washing process");
      }

      if (processData.processType === "drying" && !processData.dryingTypeId) {
        throw new Error("Drying type ID is required for drying process");
      }

      // Ensure only the correct type ID is set
      const cleanProcessData = {
        ...processData,
        washingTypeId:
          processData.processType === "washing"
            ? processData.washingTypeId
            : null,
        dryingTypeId:
          processData.processType === "drying"
            ? processData.dryingTypeId
            : null,
      };

      const [process] = await db
        .insert(customerOrderLineProcesses)
        .values({
          ...cleanProcessData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return process;
    } catch (error) {
      console.error("Error creating customer order line process:", error);
      throw error;
    }
  }

  // Find customer order line process by ID
  static async findById(id) {
    try {
      const [process] = await db
        .select({
          id: customerOrderLineProcesses.id,
          customerOrderLineId: customerOrderLineProcesses.customerOrderLineId,
          sequenceNumber: customerOrderLineProcesses.sequenceNumber,
          washingTypeId: customerOrderLineProcesses.washingTypeId,
          dryingTypeId: customerOrderLineProcesses.dryingTypeId,
          processType: customerOrderLineProcesses.processType,
          status: customerOrderLineProcesses.status,
          startedAt: customerOrderLineProcesses.startedAt,
          completedAt: customerOrderLineProcesses.completedAt,
          notes: customerOrderLineProcesses.notes,
          isActive: customerOrderLineProcesses.isActive,
          createdAt: customerOrderLineProcesses.createdAt,
          updatedAt: customerOrderLineProcesses.updatedAt,
          washingType: {
            id: washingTypes.id,
            name: washingTypes.name,
            code: washingTypes.code,
          },
          dryingType: {
            id: dryingTypes.id,
            name: dryingTypes.name,
            code: dryingTypes.code,
          },
          customerOrderLine: {
            id: customerOrderLines.id,
            quantity: customerOrderLines.quantity,
            itemType: {
              id: itemTypes.id,
              name: itemTypes.name,
              code: itemTypes.code,
            },
            customerOrder: {
              id: customerOrders.id,
              orderNumber: customerOrders.orderNumber,
            },
          },
        })
        .from(customerOrderLineProcesses)
        .leftJoin(
          washingTypes,
          eq(customerOrderLineProcesses.washingTypeId, washingTypes.id)
        )
        .leftJoin(
          dryingTypes,
          eq(customerOrderLineProcesses.dryingTypeId, dryingTypes.id)
        )
        .leftJoin(
          customerOrderLines,
          eq(
            customerOrderLineProcesses.customerOrderLineId,
            customerOrderLines.id
          )
        )
        .leftJoin(itemTypes, eq(customerOrderLines.itemTypeId, itemTypes.id))
        .leftJoin(
          customerOrders,
          eq(customerOrderLines.customerOrderId, customerOrders.id)
        )
        .where(eq(customerOrderLineProcesses.id, id))
        .limit(1);

      return process || null;
    } catch (error) {
      console.error("Error finding customer order line process by ID:", error);
      throw error;
    }
  }

  // Find all customer order line processes with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        isActive = null,
        customerOrderLineId = null,
        processType = null,
        status = null,
        search = null,
        sortBy = "sequenceNumber",
        sortOrder = "asc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(customerOrderLineProcesses.isActive, isActive));
      }

      if (customerOrderLineId) {
        conditions.push(
          eq(
            customerOrderLineProcesses.customerOrderLineId,
            customerOrderLineId
          )
        );
      }

      if (processType) {
        conditions.push(
          eq(customerOrderLineProcesses.processType, processType)
        );
      }

      if (status) {
        conditions.push(eq(customerOrderLineProcesses.status, status));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customerOrderLineProcesses.notes, `%${search}%`),
            ilike(washingTypes.name, `%${search}%`),
            ilike(dryingTypes.name, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(customerOrderLineProcesses[sortBy])
          : desc(customerOrderLineProcesses[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const processList = await db
        .select({
          id: customerOrderLineProcesses.id,
          customerOrderLineId: customerOrderLineProcesses.customerOrderLineId,
          sequenceNumber: customerOrderLineProcesses.sequenceNumber,
          washingTypeId: customerOrderLineProcesses.washingTypeId,
          dryingTypeId: customerOrderLineProcesses.dryingTypeId,
          processType: customerOrderLineProcesses.processType,
          status: customerOrderLineProcesses.status,
          startedAt: customerOrderLineProcesses.startedAt,
          completedAt: customerOrderLineProcesses.completedAt,
          notes: customerOrderLineProcesses.notes,
          isActive: customerOrderLineProcesses.isActive,
          createdAt: customerOrderLineProcesses.createdAt,
          updatedAt: customerOrderLineProcesses.updatedAt,
          washingType: {
            id: washingTypes.id,
            name: washingTypes.name,
            code: washingTypes.code,
          },
          dryingType: {
            id: dryingTypes.id,
            name: dryingTypes.name,
            code: dryingTypes.code,
          },
          customerOrderLine: {
            id: customerOrderLines.id,
            quantity: customerOrderLines.quantity,
          },
        })
        .from(customerOrderLineProcesses)
        .leftJoin(
          washingTypes,
          eq(customerOrderLineProcesses.washingTypeId, washingTypes.id)
        )
        .leftJoin(
          dryingTypes,
          eq(customerOrderLineProcesses.dryingTypeId, dryingTypes.id)
        )
        .leftJoin(
          customerOrderLines,
          eq(
            customerOrderLineProcesses.customerOrderLineId,
            customerOrderLines.id
          )
        )
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return processList;
    } catch (error) {
      console.error("Error finding customer order line processes:", error);
      throw error;
    }
  }

  // Count customer order line processes with filtering
  static async count(options = {}) {
    try {
      const {
        isActive = null,
        customerOrderLineId = null,
        processType = null,
        status = null,
        search = null,
      } = options;

      // Build where conditions (same as findAll)
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(customerOrderLineProcesses.isActive, isActive));
      }

      if (customerOrderLineId) {
        conditions.push(
          eq(
            customerOrderLineProcesses.customerOrderLineId,
            customerOrderLineId
          )
        );
      }

      if (processType) {
        conditions.push(
          eq(customerOrderLineProcesses.processType, processType)
        );
      }

      if (status) {
        conditions.push(eq(customerOrderLineProcesses.status, status));
      }

      if (search) {
        conditions.push(
          or(ilike(customerOrderLineProcesses.notes, `%${search}%`))
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(customerOrderLineProcesses)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting customer order line processes:", error);
      throw error;
    }
  }

  // Update customer order line process
  static async update(id, updateData) {
    try {
      // Check if process exists
      const existingProcess = await this.findById(id);
      if (!existingProcess) {
        throw new Error("Customer order line process not found");
      }

      // Validate process type if being updated
      if (
        updateData.processType &&
        !["washing", "drying"].includes(updateData.processType)
      ) {
        throw new Error('Process type must be either "washing" or "drying"');
      }

      const [process] = await db
        .update(customerOrderLineProcesses)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLineProcesses.id, id))
        .returning();

      return process;
    } catch (error) {
      console.error("Error updating customer order line process:", error);
      throw error;
    }
  }

  // Delete customer order line process (soft delete)
  static async delete(id) {
    try {
      const [process] = await db
        .update(customerOrderLineProcesses)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLineProcesses.id, id))
        .returning();

      return process;
    } catch (error) {
      console.error("Error deleting customer order line process:", error);
      throw error;
    }
  }

  // Find processes by customer order line
  static async findByCustomerOrderLine(customerOrderLineId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const processList = await db
        .select({
          id: customerOrderLineProcesses.id,
          customerOrderLineId: customerOrderLineProcesses.customerOrderLineId,
          sequenceNumber: customerOrderLineProcesses.sequenceNumber,
          washingTypeId: customerOrderLineProcesses.washingTypeId,
          dryingTypeId: customerOrderLineProcesses.dryingTypeId,
          processType: customerOrderLineProcesses.processType,
          status: customerOrderLineProcesses.status,
          startedAt: customerOrderLineProcesses.startedAt,
          completedAt: customerOrderLineProcesses.completedAt,
          notes: customerOrderLineProcesses.notes,
          isActive: customerOrderLineProcesses.isActive,
          createdAt: customerOrderLineProcesses.createdAt,
          updatedAt: customerOrderLineProcesses.updatedAt,
          washingType: {
            id: washingTypes.id,
            name: washingTypes.name,
            code: washingTypes.code,
          },
          dryingType: {
            id: dryingTypes.id,
            name: dryingTypes.name,
            code: dryingTypes.code,
          },
        })
        .from(customerOrderLineProcesses)
        .leftJoin(
          washingTypes,
          eq(customerOrderLineProcesses.washingTypeId, washingTypes.id)
        )
        .leftJoin(
          dryingTypes,
          eq(customerOrderLineProcesses.dryingTypeId, dryingTypes.id)
        )
        .where(
          and(
            eq(customerOrderLineProcesses.isActive, true),
            eq(
              customerOrderLineProcesses.customerOrderLineId,
              customerOrderLineId
            )
          )
        )
        .orderBy(asc(customerOrderLineProcesses.sequenceNumber))
        .limit(limit)
        .offset(offset);

      return processList;
    } catch (error) {
      console.error("Error finding processes by customer order line:", error);
      throw error;
    }
  }

  // Start process
  static async startProcess(id) {
    try {
      const [process] = await db
        .update(customerOrderLineProcesses)
        .set({
          status: "in_progress",
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLineProcesses.id, id))
        .returning();

      return process;
    } catch (error) {
      console.error("Error starting process:", error);
      throw error;
    }
  }

  // Complete process
  static async completeProcess(id) {
    try {
      const [process] = await db
        .update(customerOrderLineProcesses)
        .set({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customerOrderLineProcesses.id, id))
        .returning();

      return process;
    } catch (error) {
      console.error("Error completing process:", error);
      throw error;
    }
  }

  // Bulk create processes
  static async bulkCreate(processesData) {
    try {
      const processes = await db
        .insert(customerOrderLineProcesses)
        .values(
          processesData.map((data) => ({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .returning();

      return processes;
    } catch (error) {
      console.error(
        "Error bulk creating customer order line processes:",
        error
      );
      throw error;
    }
  }

  // Get next sequence number for order line
  static async getNextSequenceNumber(customerOrderLineId) {
    try {
      const [result] = await db
        .select({
          maxSeq: max(customerOrderLineProcesses.sequenceNumber),
        })
        .from(customerOrderLineProcesses)
        .where(
          eq(
            customerOrderLineProcesses.customerOrderLineId,
            customerOrderLineId
          )
        );

      return (result.maxSeq || 0) + 1;
    } catch (error) {
      console.error("Error getting next sequence number:", error);
      throw error;
    }
  }

  // Find all processes with machine assignments for production workflow
  static async findAllWithMachineAssignments(options = {}) {
    try {
      const processList = await db
        .select({
          id: customerOrderLineProcesses.id,
          customerOrderId: customerOrderLines.customerOrderId,
          customerOrderLineId: customerOrderLineProcesses.customerOrderLineId,
          quantity: customerOrderLineProcesses.quantity,
          washingMachine: customerOrderLineProcesses.washingMachine,
          dryingMachine: customerOrderLineProcesses.dryingMachine,
          assignedBy: customerOrderLineProcesses.assignedBy,
          assignedAt: customerOrderLineProcesses.assignedAt,
          createdAt: customerOrderLineProcesses.createdAt,
          orderNumber: customerOrders.orderNumber,
          referenceNo: customerOrders.orderNumber,
          customerName: sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
          itemType: itemTypes.name,
          item: itemTypes.name,
          assignedByName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(customerOrderLineProcesses)
        .leftJoin(
          customerOrderLines,
          eq(
            customerOrderLineProcesses.customerOrderLineId,
            customerOrderLines.id
          )
        )
        .leftJoin(
          customerOrders,
          eq(customerOrderLines.customerOrderId, customerOrders.id)
        )
        .leftJoin(customers, eq(customerOrders.customerId, customers.id))
        .leftJoin(itemTypes, eq(customerOrderLines.itemTypeId, itemTypes.id))
        .leftJoin(users, eq(customerOrderLineProcesses.assignedBy, users.id))
        .where(
          and(
            eq(customerOrderLineProcesses.isActive, true),
            isNotNull(customerOrderLineProcesses.washingMachine),
            isNotNull(customerOrderLineProcesses.dryingMachine)
          )
        )
        .orderBy(desc(customerOrderLineProcesses.createdAt));

      return processList;
    } catch (error) {
      console.error("Error finding processes with machine assignments:", error);
      throw error;
    }
  }
}

module.exports = CustomerOrderLineProcess;
