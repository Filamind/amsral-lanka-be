const { db } = require("../config/db");
const { washingTypes } = require("../db/schema");
const { eq, desc, count, ilike, and, or } = require("drizzle-orm");

class WashingType {
  constructor(washingTypeData) {
    this.id = washingTypeData.id;
    this.name = washingTypeData.name;
    this.code = washingTypeData.code;
    this.description = washingTypeData.description;
    this.createdAt = washingTypeData.createdAt || washingTypeData.created_at;
    this.updatedAt = washingTypeData.updatedAt || washingTypeData.updated_at;
  }

  // Get all washing types
  static async findAll(options = {}) {
    const {
      limit = 10,
      offset = 0,
      search = null,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    try {
      // Build where conditions
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(washingTypes.name, `%${search}%`),
            ilike(washingTypes.code, `%${search}%`),
            ilike(washingTypes.description, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc" ? washingTypes[sortBy] : desc(washingTypes[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select()
        .from(washingTypes)
        .where(whereClause)
        .orderBy(orderBy)
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
        .where(eq(washingTypes.code, code))
        .limit(1);
      if (result.length === 0) {
        return null;
      }
      return new WashingType(result[0]);
    } catch (error) {
      throw new Error(`Error fetching washing type: ${error.message}`);
    }
  }

  // Get washing type by name
  static async findByName(name) {
    try {
      const result = await db
        .select()
        .from(washingTypes)
        .where(ilike(washingTypes.name, name))
        .limit(1);
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
    const { search = null } = options;

    try {
      // Build where conditions
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(washingTypes.name, `%${search}%`),
            ilike(washingTypes.code, `%${search}%`),
            ilike(washingTypes.description, `%${search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db
        .select({ count: count() })
        .from(washingTypes)
        .where(whereClause);

      return result[0].count;
    } catch (error) {
      throw new Error(`Error counting washing types: ${error.message}`);
    }
  }

  // Create new washing type
  static async create(washingTypeData) {
    try {
      // Check if code already exists
      const existingCode = await this.findByCode(washingTypeData.code);
      if (existingCode) {
        throw new Error("Washing type code already exists");
      }

      // Check if name already exists (case-insensitive)
      const existingName = await this.findByName(washingTypeData.name);
      if (existingName) {
        throw new Error("Washing type name already exists");
      }

      const result = await db
        .insert(washingTypes)
        .values({
          name: washingTypeData.name,
          code: washingTypeData.code,
          description: washingTypeData.description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return new WashingType(result[0]);
    } catch (error) {
      console.error("Error creating washing type:", error);
      throw error;
    }
  }

  // Update washing type
  static async update(id, updateData) {
    try {
      // Check if washing type exists
      const existingWashingType = await this.findById(id);
      if (!existingWashingType) {
        throw new Error("Washing type not found");
      }

      // Check if code already exists (if being updated)
      if (updateData.code && updateData.code !== existingWashingType.code) {
        const existingCode = await this.findByCode(updateData.code);
        if (existingCode) {
          throw new Error("Washing type code already exists");
        }
      }

      // Check if name already exists (if being updated and case-insensitive)
      if (
        updateData.name &&
        updateData.name.toLowerCase() !== existingWashingType.name.toLowerCase()
      ) {
        const existingName = await this.findByName(updateData.name);
        if (existingName) {
          throw new Error("Washing type name already exists");
        }
      }

      const result = await db
        .update(washingTypes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(washingTypes.id, id))
        .returning();

      return new WashingType(result[0]);
    } catch (error) {
      console.error("Error updating washing type:", error);
      throw error;
    }
  }

  // Delete washing type (hard delete)
  static async delete(id) {
    try {
      // Check if washing type exists
      const existingWashingType = await this.findById(id);
      if (!existingWashingType) {
        throw new Error("Washing type not found");
      }

      // Check if washing type is referenced in any processes
      const isReferenced = await this.isReferencedInProcesses(id);
      if (isReferenced) {
        throw new Error(
          "Cannot delete washing type. It is being used in existing processes."
        );
      }

      const result = await db
        .delete(washingTypes)
        .where(eq(washingTypes.id, id))
        .returning();

      return result[0];
    } catch (error) {
      console.error("Error deleting washing type:", error);
      throw error;
    }
  }

  // Check if washing type is referenced in processes
  static async isReferencedInProcesses(washingTypeId) {
    try {
      // Import schema here to avoid circular dependency
      const { customerOrderLineProcesses } = require("../db/schema");

      const [result] = await db
        .select({ count: count() })
        .from(customerOrderLineProcesses)
        .where(eq(customerOrderLineProcesses.washingTypeId, washingTypeId));

      return result.count > 0;
    } catch (error) {
      console.error("Error checking washing type references:", error);
      return false; // If we can't check, allow deletion but log the error
    }
  }

  // Validate washing type data
  static validateWashingTypeData(data, isUpdate = false) {
    const errors = {};

    // Name validation
    if (!isUpdate || data.name !== undefined) {
      if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.name = "Washing type name is required";
      } else if (data.name.length > 100) {
        errors.name = "Washing type name must not exceed 100 characters";
      }
    }

    // Code validation
    if (!isUpdate || data.code !== undefined) {
      if (
        !data.code ||
        typeof data.code !== "string" ||
        data.code.trim() === ""
      ) {
        errors.code = "Washing type code is required";
      } else if (data.code.length > 20) {
        errors.code = "Washing type code must not exceed 20 characters";
      }
    }

    // Description validation
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== "string") {
        errors.description = "Description must be a string";
      } else if (data.description.length > 1000) {
        errors.description = "Description must not exceed 1000 characters";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
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
