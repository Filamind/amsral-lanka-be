const {
  eq,
  and,
  or,
  ilike,
  count,
  asc,
  desc,
  inArray,
  ne,
  sum,
  isNull,
} = require("drizzle-orm");
const { db } = require("../config/db");
const {
  orderRecords,
  orders,
  washingTypes,
  processTypes,
  machineAssignments,
} = require("../db/schema");

class OrderRecord {
  // Generate tracking number for a new order record
  static async generateTrackingNumber(orderId) {
    try {
      // Get the latest tracking number for this order
      const latestRecord = await db
        .select({ trackingNumber: orderRecords.trackingNumber })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .orderBy(desc(orderRecords.id))
        .limit(1);

      if (!latestRecord || latestRecord.length === 0) {
        // First record for this order - use 'A'
        return `${orderId}A`;
      }

      // If the latest record has no tracking number, count existing records to determine the next letter
      if (!latestRecord[0].trackingNumber) {
        const recordCount = await db
          .select({ count: count() })
          .from(orderRecords)
          .where(eq(orderRecords.orderId, orderId));

        const nextLetter = String.fromCharCode(
          65 + (recordCount[0].count || 0)
        ); // 65 is 'A'
        return `${orderId}${nextLetter}`;
      }

      // Get the last letter from the tracking number
      const lastTrackingNumber = latestRecord[0].trackingNumber;
      const lastLetter = lastTrackingNumber.slice(-1);

      // Generate next letter (A -> B -> C, etc.)
      const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);

      return `${orderId}${nextLetter}`;
    } catch (error) {
      console.error("Error generating tracking number:", error);
      throw error;
    }
  }

  // Create a new order record
  static async create(recordData) {
    try {
      // Generate tracking number
      const trackingNumber = await this.generateTrackingNumber(
        recordData.orderId
      );

      // Map numeric IDs to string values if needed
      const mappedData = {
        ...recordData,
        trackingNumber,
        washType: await this.mapWashTypeId(recordData.washType),
        processTypes: await this.mapProcessTypeIds(recordData.processTypes),
      };

      // Validate wash type against database
      const washTypes = await this.getWashTypes();
      const validWashTypeCodes = washTypes.map((wt) => wt.code);

      if (!validWashTypeCodes.includes(mappedData.washType)) {
        throw new Error(`Invalid wash type: ${mappedData.washType}`);
      }

      // Validate process types against database
      const processTypesList = await this.getProcessTypes();
      const validProcessTypeCodes = processTypesList.map((pt) => pt.code);

      if (mappedData.processTypes && Array.isArray(mappedData.processTypes)) {
        const invalidTypes = mappedData.processTypes.filter(
          (type) => !validProcessTypeCodes.includes(type)
        );
        if (invalidTypes.length > 0) {
          throw new Error(`Invalid process types: ${invalidTypes.join(", ")}`);
        }
      }

      const [record] = await db
        .insert(orderRecords)
        .values({
          ...mappedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return record;
    } catch (error) {
      console.error("Error creating order record:", error);
      throw error;
    }
  }

  // Find order record by ID
  static async findById(id) {
    try {
      const [record] = await db
        .select()
        .from(orderRecords)
        .where(eq(orderRecords.id, id))
        .limit(1);

      return record || null;
    } catch (error) {
      console.error("Error finding order record by ID:", error);
      throw error;
    }
  }

  // Find all order records with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderId = null,
        washType = null,
        search = null,
        sortBy = "id",
        sortOrder = "asc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (orderId) {
        conditions.push(eq(orderRecords.orderId, orderId));
      }

      if (washType) {
        conditions.push(eq(orderRecords.washType, washType));
      }

      if (search) {
        conditions.push(or(ilike(orderRecords.washType, `%${search}%`)));
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(orderRecords[sortBy])
          : desc(orderRecords[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const recordList = await db
        .select()
        .from(orderRecords)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return recordList;
    } catch (error) {
      console.error("Error finding order records:", error);
      throw error;
    }
  }

  // Find records by order ID
  static async findByOrderId(orderId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const recordList = await db
        .select()
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .orderBy(asc(orderRecords.id))
        .limit(limit)
        .offset(offset);

      return recordList;
    } catch (error) {
      console.error("Error finding records by order ID:", error);
      throw error;
    }
  }

  // Count order records with filtering
  static async count(options = {}) {
    try {
      const { orderId = null, washType = null, search = null } = options;

      const conditions = [];

      if (orderId) {
        conditions.push(eq(orderRecords.orderId, orderId));
      }

      if (washType) {
        conditions.push(eq(orderRecords.washType, washType));
      }

      if (search) {
        conditions.push(or(ilike(orderRecords.washType, `%${search}%`)));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(orderRecords)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting order records:", error);
      throw error;
    }
  }

  // Update order record
  static async update(id, updateData) {
    try {
      const existingRecord = await this.findById(id);
      if (!existingRecord) {
        throw new Error("Order record not found");
      }

      // Map numeric IDs to string values if needed
      const mappedData = {
        ...updateData,
        washType: updateData.washType
          ? await this.mapWashTypeId(updateData.washType)
          : updateData.washType,
        processTypes: updateData.processTypes
          ? await this.mapProcessTypeIds(updateData.processTypes)
          : updateData.processTypes,
      };

      // Validate wash type if being updated
      if (mappedData.washType) {
        const washTypes = await this.getWashTypes();
        const validWashTypeCodes = washTypes.map((wt) => wt.code);

        if (!validWashTypeCodes.includes(mappedData.washType)) {
          throw new Error(`Invalid wash type: ${mappedData.washType}`);
        }
      }

      // Validate process types if being updated
      if (mappedData.processTypes) {
        const processTypesList = await this.getProcessTypes();
        const validProcessTypeCodes = processTypesList.map((pt) => pt.code);

        if (Array.isArray(mappedData.processTypes)) {
          const invalidTypes = mappedData.processTypes.filter(
            (type) => !validProcessTypeCodes.includes(type)
          );
          if (invalidTypes.length > 0) {
            throw new Error(
              `Invalid process types: ${invalidTypes.join(", ")}`
            );
          }
        }
      }

      const [record] = await db
        .update(orderRecords)
        .set({
          ...mappedData,
          updatedAt: new Date(),
        })
        .where(eq(orderRecords.id, id))
        .returning();

      return record;
    } catch (error) {
      console.error("Error updating order record:", error);
      throw error;
    }
  }

  // Delete order record
  static async delete(id) {
    try {
      const [record] = await db
        .delete(orderRecords)
        .where(eq(orderRecords.id, id))
        .returning();

      return record;
    } catch (error) {
      console.error("Error deleting order record:", error);
      throw error;
    }
  }

  // Delete all records for an order
  static async deleteByOrderId(orderId) {
    try {
      const records = await db
        .delete(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .returning();

      return records;
    } catch (error) {
      console.error("Error deleting records by order ID:", error);
      throw error;
    }
  }

  // Bulk create records
  static async bulkCreate(recordsData) {
    try {
      // Generate tracking numbers for all records
      const recordsWithTrackingNumbers = [];
      for (let i = 0; i < recordsData.length; i++) {
        const recordData = recordsData[i];
        const trackingNumber = await this.generateTrackingNumber(
          recordData.orderId
        );
        recordsWithTrackingNumbers.push({
          ...recordData,
          trackingNumber,
        });
      }

      // Map numeric IDs to string values for all records
      const mappedRecordsData = await Promise.all(
        recordsWithTrackingNumbers.map(async (recordData) => ({
          ...recordData,
          washType: await this.mapWashTypeId(recordData.washType),
          processTypes: await this.mapProcessTypeIds(recordData.processTypes),
        }))
      );

      // Get valid codes from database
      const washTypes = await this.getWashTypes();
      const processTypesList = await this.getProcessTypes();
      const validWashTypeCodes = washTypes.map((wt) => wt.code);
      const validProcessTypeCodes = processTypesList.map((pt) => pt.code);

      // Validate all records
      for (const recordData of mappedRecordsData) {
        if (!validWashTypeCodes.includes(recordData.washType)) {
          throw new Error(`Invalid wash type: ${recordData.washType}`);
        }

        if (recordData.processTypes && Array.isArray(recordData.processTypes)) {
          const invalidTypes = recordData.processTypes.filter(
            (type) => !validProcessTypeCodes.includes(type)
          );
          if (invalidTypes.length > 0) {
            throw new Error(
              `Invalid process types: ${invalidTypes.join(", ")}`
            );
          }
        }
      }

      const records = await db
        .insert(orderRecords)
        .values(
          mappedRecordsData.map((data) => ({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        )
        .returning();

      return records;
    } catch (error) {
      console.error("Error bulk creating order records:", error);
      throw error;
    }
  }

  // Get valid wash types from database
  static async getValidWashTypes() {
    try {
      const washTypes = await this.getWashTypes();
      return washTypes.map((wt) => ({
        id: wt.id,
        value: wt.code,
        label: wt.name,
        code: wt.code,
      }));
    } catch (error) {
      console.error("Error getting valid wash types:", error);
      throw error;
    }
  }

  // Get valid process types from database
  static async getValidProcessTypes() {
    try {
      const processTypesList = await this.getProcessTypes();
      return processTypesList.map((pt) => ({
        id: pt.id,
        value: pt.code,
        label: pt.name,
        code: pt.code,
      }));
    } catch (error) {
      console.error("Error getting valid process types:", error);
      throw error;
    }
  }

  // Fetch all wash types from database
  static async getWashTypes() {
    try {
      const washTypes = await db
        .select({
          id: washingTypes.id,
          name: washingTypes.name,
          code: washingTypes.code,
        })
        .from(washingTypes)
        .orderBy(asc(washingTypes.id));

      return washTypes;
    } catch (error) {
      console.error("Error fetching wash types:", error);
      throw error;
    }
  }

  // Fetch all process types from database
  static async getProcessTypes() {
    try {
      const processTypesList = await db
        .select({
          id: processTypes.id,
          name: processTypes.name,
          code: processTypes.code,
        })
        .from(processTypes)
        .orderBy(asc(processTypes.id));

      return processTypesList;
    } catch (error) {
      console.error("Error fetching process types:", error);
      throw error;
    }
  }

  // Map wash type ID to code value from database
  static async mapWashTypeId(washTypeId) {
    try {
      const washTypes = await this.getWashTypes();
      const washType = washTypes.find((wt) => wt.id === parseInt(washTypeId));
      return washType ? washType.code : washTypeId;
    } catch (error) {
      console.error("Error mapping wash type ID:", error);
      return washTypeId;
    }
  }

  // Map process type ID to code value from database
  static async mapProcessTypeId(processTypeId) {
    try {
      const processTypesList = await this.getProcessTypes();
      const processType = processTypesList.find(
        (pt) => pt.id === parseInt(processTypeId)
      );
      return processType ? processType.code : processTypeId;
    } catch (error) {
      console.error("Error mapping process type ID:", error);
      return processTypeId;
    }
  }

  // Map array of process type IDs to code values from database
  static async mapProcessTypeIds(processTypeIds) {
    if (!Array.isArray(processTypeIds)) {
      return processTypeIds;
    }
    const mappedIds = await Promise.all(
      processTypeIds.map((id) => this.mapProcessTypeId(id))
    );
    return mappedIds;
  }

  // Validate total quantity against order quantity
  static async validateTotalQuantity(orderId, excludeRecordId = null) {
    try {
      const conditions = [eq(orderRecords.orderId, orderId)];

      if (excludeRecordId) {
        conditions.push(ne(orderRecords.id, excludeRecordId));
      }

      const [result] = await db
        .select({
          totalRecordQuantity: sum(orderRecords.quantity),
        })
        .from(orderRecords)
        .where(and(...conditions));

      // Get order quantity
      const [order] = await db
        .select({ quantity: orders.quantity })
        .from(orders)
        .where(eq(orders.id, orderId));

      return {
        orderQuantity: order?.quantity || 0,
        recordsQuantity: result.totalRecordQuantity || 0,
        isValid: (result.totalRecordQuantity || 0) <= (order?.quantity || 0),
      };
    } catch (error) {
      console.error("Error validating total quantity:", error);
      throw error;
    }
  }

  // Check if all machine assignments for a record are completed
  static async isRecordComplete(recordId) {
    try {
      // Get the record quantity
      const [record] = await db
        .select({ quantity: orderRecords.quantity })
        .from(orderRecords)
        .where(eq(orderRecords.id, recordId));

      if (!record) return false;

      // Get total assignments for this record
      const [totalResult] = await db
        .select({ count: count() })
        .from(machineAssignments)
        .where(eq(machineAssignments.recordId, recordId));

      // Get completed assignments for this record
      const [completedResult] = await db
        .select({ count: count() })
        .from(machineAssignments)
        .where(
          and(
            eq(machineAssignments.recordId, recordId),
            eq(machineAssignments.status, "Completed")
          )
        );

      // Get sum of completed assignment quantities
      const [completedQuantityResult] = await db
        .select({ totalQuantity: sum(machineAssignments.quantity) })
        .from(machineAssignments)
        .where(
          and(
            eq(machineAssignments.recordId, recordId),
            eq(machineAssignments.status, "Completed")
          )
        );

      const totalAssignments = parseInt(totalResult.count) || 0;
      const completedAssignments = parseInt(completedResult.count) || 0;
      const completedQuantity =
        parseInt(completedQuantityResult.totalQuantity) || 0;
      const recordQuantity = record.quantity;

      // Record is complete if:
      // 1. There are assignments
      // 2. All assignments are completed
      // 3. Sum of completed quantities equals record quantity
      return (
        totalAssignments > 0 &&
        totalAssignments === completedAssignments &&
        completedQuantity === recordQuantity
      );
    } catch (error) {
      console.error("Error checking record completion:", error);
      return false;
    }
  }

  // Update tracking numbers for existing records that have NULL tracking numbers
  static async updateNullTrackingNumbers() {
    try {
      // Get all records with NULL tracking numbers, grouped by orderId
      const recordsWithNullTracking = await db
        .select()
        .from(orderRecords)
        .where(isNull(orderRecords.trackingNumber))
        .orderBy(asc(orderRecords.orderId), asc(orderRecords.id));

      if (recordsWithNullTracking.length === 0) {
        return {
          updated: 0,
          message: "No records with NULL tracking numbers found",
        };
      }

      // Group by orderId and update tracking numbers
      const orderGroups = {};
      recordsWithNullTracking.forEach((record) => {
        if (!orderGroups[record.orderId]) {
          orderGroups[record.orderId] = [];
        }
        orderGroups[record.orderId].push(record);
      });

      let totalUpdated = 0;
      for (const [orderId, records] of Object.entries(orderGroups)) {
        // Get existing tracking numbers for this order to determine starting letter
        const existingRecords = await db
          .select({ trackingNumber: orderRecords.trackingNumber })
          .from(orderRecords)
          .where(
            and(
              eq(orderRecords.orderId, parseInt(orderId)),
              ne(orderRecords.trackingNumber, null)
            )
          )
          .orderBy(desc(orderRecords.id));

        let nextLetterIndex = 0;
        if (existingRecords.length > 0) {
          // Find the highest letter used
          const lastTrackingNumber = existingRecords[0].trackingNumber;
          const lastLetter = lastTrackingNumber.slice(-1);
          nextLetterIndex = lastLetter.charCodeAt(0) - 64; // A=1, B=2, etc.
        }

        // Update each record with NULL tracking number
        for (const record of records) {
          const trackingNumber = `${orderId}${String.fromCharCode(
            65 + nextLetterIndex
          )}`;

          await db
            .update(orderRecords)
            .set({
              trackingNumber,
              updatedAt: new Date(),
            })
            .where(eq(orderRecords.id, record.id));

          nextLetterIndex++;
          totalUpdated++;
        }
      }

      return {
        updated: totalUpdated,
        message: `Updated ${totalUpdated} records with tracking numbers`,
      };
    } catch (error) {
      console.error("Error updating NULL tracking numbers:", error);
      throw error;
    }
  }

  // Update record status based on assignment completion
  static async updateRecordStatus(recordId, forceStatus = null) {
    try {
      let newStatus;

      if (forceStatus) {
        // Force a specific status (e.g., "Pending" when assignment changes from Complete to In Progress)
        newStatus = forceStatus;
      } else {
        // Check if record should be complete based on assignments
        const isComplete = await this.isRecordComplete(recordId);
        newStatus = isComplete ? "Complete" : "Pending";
      }

      const [updatedRecord] = await db
        .update(orderRecords)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orderRecords.id, recordId))
        .returning();

      // Update the order status based on record status change
      const Order = require("./Order");
      if (forceStatus) {
        // If record is forced to Pending, force order to Pending
        await Order.updateOrderStatus(updatedRecord.orderId, "Pending");
      } else {
        // Check if order should be complete based on all records
        await Order.updateOrderStatus(updatedRecord.orderId);
      }

      return updatedRecord;
    } catch (error) {
      console.error("Error updating record status:", error);
      throw error;
    }
  }
}

module.exports = OrderRecord;
