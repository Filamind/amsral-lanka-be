const { db } = require("../config/db");
const { dryingTypes } = require("../db/schema");
const { eq, desc, count, like, and } = require("drizzle-orm");

class DryingType {
  constructor(dryingTypeData) {
    this.id = dryingTypeData.id;
    this.name = dryingTypeData.name;
    this.code = dryingTypeData.code;
    this.description = dryingTypeData.description;
    this.isActive =
      dryingTypeData.isActive !== undefined
        ? dryingTypeData.isActive
        : dryingTypeData.is_active;
    this.createdAt = dryingTypeData.createdAt || dryingTypeData.created_at;
    this.updatedAt = dryingTypeData.updatedAt || dryingTypeData.updated_at;
  }

  // Get all drying types
  static async findAll(options = {}) {
    const { limit = 50, offset = 0, isActive = null, search = null } = options;

    try {
      let query = db.select().from(dryingTypes);

      // Build where conditions
      const conditions = [];
      if (isActive !== null) {
        conditions.push(eq(dryingTypes.isActive, isActive));
      }
      if (search) {
        conditions.push(like(dryingTypes.name, `%${search}%`));
      }

      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(
          conditions.length === 1 ? conditions[0] : and(...conditions)
        );
      }

      const result = await query
        .orderBy(desc(dryingTypes.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map((row) => new DryingType(row));
    } catch (error) {
      throw new Error(`Error fetching drying types: ${error.message}`);
    }
  }

  // Get drying type by ID
  static async findById(id) {
    try {
      const result = await db
        .select()
        .from(dryingTypes)
        .where(eq(dryingTypes.id, id));
      if (result.length === 0) {
        return null;
      }
      return new DryingType(result[0]);
    } catch (error) {
      throw new Error(`Error fetching drying type: ${error.message}`);
    }
  }

  // Get drying type by code
  static async findByCode(code) {
    try {
      const result = await db
        .select()
        .from(dryingTypes)
        .where(eq(dryingTypes.code, code));
      if (result.length === 0) {
        return null;
      }
      return new DryingType(result[0]);
    } catch (error) {
      throw new Error(`Error fetching drying type: ${error.message}`);
    }
  }

  // Count total drying types
  static async count(options = {}) {
    const { isActive = null, search = null } = options;

    try {
      let query = db.select({ count: count() }).from(dryingTypes);

      // Build where conditions
      const conditions = [];
      if (isActive !== null) {
        conditions.push(eq(dryingTypes.isActive, isActive));
      }
      if (search) {
        conditions.push(like(dryingTypes.name, `%${search}%`));
      }

      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(
          conditions.length === 1 ? conditions[0] : and(...conditions)
        );
      }

      const result = await query;
      return result[0].count;
    } catch (error) {
      throw new Error(`Error counting drying types: ${error.message}`);
    }
  }

  // Create new drying type
  static async create(dryingTypeData) {
    const { name, code, description = null } = dryingTypeData;

    try {
      const result = await db
        .insert(dryingTypes)
        .values({
          name,
          code,
          description,
        })
        .returning();

      return new DryingType(result[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Drying type code already exists");
      }
      throw new Error(`Error creating drying type: ${error.message}`);
    }
  }

  // Update drying type
  async update(updateData) {
    const allowedFields = ["name", "code", "description", "isActive"];
    const updateValues = {};

    // Map the allowed fields
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateValues[key] = value;
      }
    }

    if (Object.keys(updateValues).length === 0) {
      throw new Error("No valid fields to update");
    }

    try {
      const result = await db
        .update(dryingTypes)
        .set(updateValues)
        .where(eq(dryingTypes.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Drying type not found");
      }

      // Update current instance
      const updatedDryingType = new DryingType(result[0]);
      Object.assign(this, updatedDryingType);
      return this;
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Drying type code already exists");
      }
      throw new Error(`Error updating drying type: ${error.message}`);
    }
  }

  // Delete drying type (soft delete by setting is_active to false)
  async delete() {
    try {
      const result = await db
        .update(dryingTypes)
        .set({ isActive: false })
        .where(eq(dryingTypes.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Drying type not found");
      }
      this.isActive = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting drying type: ${error.message}`);
    }
  }

  // Get predefined drying types
  static getPredefinedDryingTypes() {
    return [
      { name: "Reese", code: "Reese", description: "Reese drying technique" },
      {
        name: "Sand Blast",
        code: "S/B",
        description: "Sand blast drying process",
      },
      { name: "Viscose", code: "V", description: "Viscose drying method" },
      { name: "Chevron", code: "Chev", description: "Chevron pattern drying" },
      {
        name: "Hand Sand",
        code: "H/S",
        description: "Hand sand drying technique",
      },
      { name: "Rib", code: "Rib", description: "Rib pattern drying" },
      { name: "Tool", code: "Tool", description: "Tool-based drying process" },
      { name: "Grind", code: "Grnd", description: "Grinding drying technique" },
    ];
  }
}

module.exports = DryingType;
