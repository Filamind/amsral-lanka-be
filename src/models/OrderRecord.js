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
} = require("drizzle-orm");
const { db } = require("../config/db");
const { orderRecords, orders } = require("../db/schema");

class OrderRecord {
  // Create a new order record
  static async create(recordData) {
    try {
      // Validate wash type
      const validWashTypes = [
        "normal",
        "heavy",
        "silicon",
        "heavy_silicon",
        "enzyme",
        "heavy_enzyme",
        "dark",
        "mid",
        "light",
        "sky",
        "acid",
        "tint",
        "chemical",
      ];

      if (!validWashTypes.includes(recordData.washType)) {
        throw new Error("Invalid wash type");
      }

      // Validate process types
      const validProcessTypes = [
        "reese",
        "sand_blast",
        "viscose",
        "chevron",
        "hand_sand",
        "rib",
        "tool",
        "grind",
      ];

      if (recordData.processTypes && Array.isArray(recordData.processTypes)) {
        const invalidTypes = recordData.processTypes.filter(
          (type) => !validProcessTypes.includes(type)
        );
        if (invalidTypes.length > 0) {
          throw new Error(`Invalid process types: ${invalidTypes.join(", ")}`);
        }
      }

      const [record] = await db
        .insert(orderRecords)
        .values({
          ...recordData,
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
      const { orderId = null, washType = null } = options;

      const conditions = [];

      if (orderId) {
        conditions.push(eq(orderRecords.orderId, orderId));
      }

      if (washType) {
        conditions.push(eq(orderRecords.washType, washType));
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

      // Validate wash type if being updated
      if (updateData.washType) {
        const validWashTypes = [
          "normal",
          "heavy",
          "silicon",
          "heavy_silicon",
          "enzyme",
          "heavy_enzyme",
          "dark",
          "mid",
          "light",
          "sky",
          "acid",
          "tint",
          "chemical",
        ];

        if (!validWashTypes.includes(updateData.washType)) {
          throw new Error("Invalid wash type");
        }
      }

      // Validate process types if being updated
      if (updateData.processTypes) {
        const validProcessTypes = [
          "reese",
          "sand_blast",
          "viscose",
          "chevron",
          "hand_sand",
          "rib",
          "tool",
          "grind",
        ];

        if (Array.isArray(updateData.processTypes)) {
          const invalidTypes = updateData.processTypes.filter(
            (type) => !validProcessTypes.includes(type)
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
          ...updateData,
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
      // Validate all records
      const validWashTypes = [
        "normal",
        "heavy",
        "silicon",
        "heavy_silicon",
        "enzyme",
        "heavy_enzyme",
        "dark",
        "mid",
        "light",
        "sky",
        "acid",
        "tint",
        "chemical",
      ];

      const validProcessTypes = [
        "reese",
        "sand_blast",
        "viscose",
        "chevron",
        "hand_sand",
        "rib",
        "tool",
        "grind",
      ];

      for (const recordData of recordsData) {
        if (!validWashTypes.includes(recordData.washType)) {
          throw new Error(`Invalid wash type: ${recordData.washType}`);
        }

        if (recordData.processTypes && Array.isArray(recordData.processTypes)) {
          const invalidTypes = recordData.processTypes.filter(
            (type) => !validProcessTypes.includes(type)
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
          recordsData.map((data) => ({
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

  // Get valid wash types
  static getValidWashTypes() {
    return [
      { value: "normal", label: "Normal Wash (N/W)" },
      { value: "heavy", label: "Heavy Wash (Hy/W)" },
      { value: "silicon", label: "Silicon Wash (Sil/W)" },
      { value: "heavy_silicon", label: "Heavy Silicon Wash (Hy/Sil/W)" },
      { value: "enzyme", label: "Enzyme Wash (En/W)" },
      { value: "heavy_enzyme", label: "Heavy Enzyme Wash (Hy/En/W)" },
      { value: "dark", label: "Dark Wash (Dk/W)" },
      { value: "mid", label: "Mid Wash (Mid/W)" },
      { value: "light", label: "Light Wash (Lit/W)" },
      { value: "sky", label: "Sky Wash (Sky/W)" },
      { value: "acid", label: "Acid Wash (Acid/W)" },
      { value: "tint", label: "Tint Wash (Tint/W)" },
      { value: "chemical", label: "Chemical Wash (Chem/W)" },
    ];
  }

  // Get valid process types
  static getValidProcessTypes() {
    return [
      { value: "reese", label: "Reese" },
      { value: "sand_blast", label: "Sand Blast (S/B)" },
      { value: "viscose", label: "Viscose (V)" },
      { value: "chevron", label: "Chevron (Chev)" },
      { value: "hand_sand", label: "Hand Sand (H/S)" },
      { value: "rib", label: "Rib" },
      { value: "tool", label: "Tool" },
      { value: "grind", label: "Grind (Grnd)" },
    ];
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
}

module.exports = OrderRecord;
