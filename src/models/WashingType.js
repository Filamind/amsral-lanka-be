const { db } = require("../config/db");
const { washingTypes } = require("../db/schema");
const { eq, desc, count, like, and } = require("drizzle-orm");

class WashingType {
  constructor(washingTypeData) {
    this.id = washingTypeData.id;
    this.name = washingTypeData.name;
    this.code = washingTypeData.code;
    this.description = washingTypeData.description;
    this.isActive =
      washingTypeData.isActive !== undefined
        ? washingTypeData.isActive
        : washingTypeData.is_active;
    this.createdAt = washingTypeData.createdAt || washingTypeData.created_at;
    this.updatedAt = washingTypeData.updatedAt || washingTypeData.updated_at;
  }

  // Get all washing types
  static async findAll(options = {}) {
    const { limit = 50, offset = 0, isActive = null, search = null } = options;

    try {
      let query = db.select().from(washingTypes);

      // Build where conditions
      const conditions = [];
      if (isActive !== null) {
        conditions.push(eq(washingTypes.isActive, isActive));
      }
      if (search) {
        conditions.push(like(washingTypes.name, `%${search}%`));
      }

      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(
          conditions.length === 1 ? conditions[0] : and(...conditions)
        );
      }

      const result = await query
        .orderBy(desc(washingTypes.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map((row) => new WashingType(row));
    } catch (error) {
      throw new Error(`Error fetching washing types: ${error.message}`);
    }
  }

  // Get washing type by ID
  static async findById(id) {
    try {
      const result = await db
        .select()
        .from(washingTypes)
        .where(eq(washingTypes.id, id));
      if (result.length === 0) {
        return null;
      }
      return new WashingType(result[0]);
    } catch (error) {
      throw new Error(`Error fetching washing type: ${error.message}`);
    }
  }

  // Get washing type by code
  static async findByCode(code) {
    try {
      const result = await db
        .select()
        .from(washingTypes)
        .where(eq(washingTypes.code, code));
      if (result.length === 0) {
        return null;
      }
      return new WashingType(result[0]);
    } catch (error) {
      throw new Error(`Error fetching washing type: ${error.message}`);
    }
  }

  // Count total washing types
  static async count(options = {}) {
    const { isActive = null, search = null } = options;

    try {
      let query = db.select({ count: count() }).from(washingTypes);

      // Build where conditions
      const conditions = [];
      if (isActive !== null) {
        conditions.push(eq(washingTypes.isActive, isActive));
      }
      if (search) {
        conditions.push(like(washingTypes.name, `%${search}%`));
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
      throw new Error(`Error counting washing types: ${error.message}`);
    }
  }

  // Create new washing type
  static async create(washingTypeData) {
    const { name, code, description = null } = washingTypeData;

    try {
      const result = await db
        .insert(washingTypes)
        .values({
          name,
          code,
          description,
        })
        .returning();

      return new WashingType(result[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Washing type code already exists");
      }
      throw new Error(`Error creating washing type: ${error.message}`);
    }
  }

  // Update washing type
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
        .update(washingTypes)
        .set(updateValues)
        .where(eq(washingTypes.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Washing type not found");
      }

      // Update current instance
      const updatedWashingType = new WashingType(result[0]);
      Object.assign(this, updatedWashingType);
      return this;
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Washing type code already exists");
      }
      throw new Error(`Error updating washing type: ${error.message}`);
    }
  }

  // Delete washing type (soft delete by setting is_active to false)
  async delete() {
    try {
      const result = await db
        .update(washingTypes)
        .set({ isActive: false })
        .where(eq(washingTypes.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Washing type not found");
      }
      this.isActive = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting washing type: ${error.message}`);
    }
  }

  // Get predefined washing types
  static getPredefinedWashingTypes() {
    return [
      {
        name: "Normal wash",
        code: "N/W",
        description: "Standard normal washing process",
      },
      {
        name: "Heavy wash",
        code: "Hy/W",
        description: "Heavy duty washing process",
      },
      {
        name: "Silicon wash",
        code: "Sil/W",
        description: "Silicon-based washing process",
      },
      {
        name: "Heavy silicon wash",
        code: "Hy/Sil/W",
        description: "Heavy duty silicon washing process",
      },
      {
        name: "Enzyme wash",
        code: "En/W",
        description: "Enzyme-based washing process",
      },
      {
        name: "Heavy enzyme wash",
        code: "Hy/En/W",
        description: "Heavy duty enzyme washing process",
      },
      {
        name: "Dark wash",
        code: "Dk/W",
        description: "Dark fabric washing process",
      },
      {
        name: "Mid wash",
        code: "Mid/W",
        description: "Medium intensity washing process",
      },
      {
        name: "Light wash",
        code: "Lit/W",
        description: "Light intensity washing process",
      },
      {
        name: "Sky wash",
        code: "Sky/W",
        description: "Sky blue washing process",
      },
      {
        name: "Acid wash",
        code: "Acid/W",
        description: "Acid-based washing process",
      },
      {
        name: "Tint wash",
        code: "Tint/W",
        description: "Tint-based washing process",
      },
      {
        name: "Chemical wash",
        code: "Chem/W",
        description: "Chemical-based washing process",
      },
    ];
  }
}

module.exports = WashingType;
