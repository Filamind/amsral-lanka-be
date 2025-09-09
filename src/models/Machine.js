const { eq, and, or, ilike, count, asc, desc, sql } = require("drizzle-orm");
const { db } = require("../config/db");
const { machineTypes } = require("../db/schema");

class Machine {
  // Find all machines with filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type = null,
        status = null,
        search = null,
        sortBy = "id",
        sortOrder = "asc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (type) {
        conditions.push(sql`LOWER(${machineTypes.type}) = LOWER(${type})`);
      }

      if (search) {
        conditions.push(
          or(
            ilike(machineTypes.name, `%${search}%`),
            ilike(machineTypes.type, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(machineTypes[sortBy])
          : desc(machineTypes[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const machineList = await db
        .select({
          id: machineTypes.id,
          name: machineTypes.name,
          type: machineTypes.type,
          description: machineTypes.description,
          createdAt: machineTypes.createdAt,
          updatedAt: machineTypes.updatedAt,
        })
        .from(machineTypes)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return machineList;
    } catch (error) {
      console.error("Error finding machines:", error);
      throw error;
    }
  }

  // Find machine by ID
  static async findById(id) {
    try {
      const [machine] = await db
        .select({
          id: machineTypes.id,
          name: machineTypes.name,
          type: machineTypes.type,
          description: machineTypes.description,
          createdAt: machineTypes.createdAt,
          updatedAt: machineTypes.updatedAt,
        })
        .from(machineTypes)
        .where(eq(machineTypes.id, id))
        .limit(1);

      return machine || null;
    } catch (error) {
      console.error("Error finding machine by ID:", error);
      throw error;
    }
  }

  // Count machines with filtering
  static async count(options = {}) {
    try {
      const { type = null, search = null } = options;

      const conditions = [];

      if (type) {
        conditions.push(sql`LOWER(${machineTypes.type}) = LOWER(${type})`);
      }

      if (search) {
        conditions.push(
          or(
            ilike(machineTypes.name, `%${search}%`),
            ilike(machineTypes.type, `%${search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(machineTypes)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting machines:", error);
      throw error;
    }
  }

  // Create new machine
  static async create(machineData) {
    try {
      const [machine] = await db
        .insert(machineTypes)
        .values({
          name: machineData.name,
          type: machineData.type,
          description: machineData.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return machine;
    } catch (error) {
      console.error("Error creating machine:", error);
      throw error;
    }
  }

  // Update machine
  static async update(id, updateData) {
    try {
      const updateFields = {};
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.type !== undefined) updateFields.type = updateData.type;
      if (updateData.description !== undefined)
        updateFields.description = updateData.description;
      updateFields.updatedAt = new Date();

      const [machine] = await db
        .update(machineTypes)
        .set(updateFields)
        .where(eq(machineTypes.id, id))
        .returning();

      return machine;
    } catch (error) {
      console.error("Error updating machine:", error);
      throw error;
    }
  }

  // Delete machine
  static async delete(id) {
    try {
      const [machine] = await db
        .delete(machineTypes)
        .where(eq(machineTypes.id, id))
        .returning();

      return machine;
    } catch (error) {
      console.error("Error deleting machine:", error);
      throw error;
    }
  }
}

module.exports = Machine;
