const { eq, and, or, ilike, count, asc, desc } = require("drizzle-orm");
const { db } = require("../config/db");
const { processTypes } = require("../db/schema");

class ProcessType {
  // Create a new process type
  static async create(processTypeData) {
    try {
      // Check if process type code already exists
      const existingCode = await this.findByCode(processTypeData.code);
      if (existingCode) {
        throw new Error("Process type code already exists");
      }

      // Check if process type name already exists (case-insensitive)
      const existingName = await this.findByName(processTypeData.name);
      if (existingName) {
        throw new Error("Process type name already exists");
      }

      const [processType] = await db
        .insert(processTypes)
        .values({
          name: processTypeData.name,
          code: processTypeData.code,
          description: processTypeData.description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return processType;
    } catch (error) {
      console.error("Error creating process type:", error);
      throw error;
    }
  }

  // Find process type by ID
  static async findById(id) {
    try {
      const [processType] = await db
        .select()
        .from(processTypes)
        .where(eq(processTypes.id, id))
        .limit(1);

      return processType || null;
    } catch (error) {
      console.error("Error finding process type by ID:", error);
      throw error;
    }
  }

  // Find process type by code
  static async findByCode(code) {
    try {
      const [processType] = await db
        .select()
        .from(processTypes)
        .where(eq(processTypes.code, code))
        .limit(1);

      return processType || null;
    } catch (error) {
      console.error("Error finding process type by code:", error);
      throw error;
    }
  }

  // Find process type by name (case-insensitive)
  static async findByName(name) {
    try {
      const [processType] = await db
        .select()
        .from(processTypes)
        .where(ilike(processTypes.name, name))
        .limit(1);

      return processType || null;
    } catch (error) {
      console.error("Error finding process type by name:", error);
      throw error;
    }
  }

  // Find all process types with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        search = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(processTypes.name, `%${search}%`),
            ilike(processTypes.code, `%${search}%`),
            ilike(processTypes.description, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(processTypes[sortBy])
          : desc(processTypes[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const processTypeList = await db
        .select()
        .from(processTypes)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return processTypeList;
    } catch (error) {
      console.error("Error finding process types:", error);
      throw error;
    }
  }

  // Count process types with filtering
  static async count(options = {}) {
    try {
      const { search = null } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(processTypes.name, `%${search}%`),
            ilike(processTypes.code, `%${search}%`),
            ilike(processTypes.description, `%${search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(processTypes)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting process types:", error);
      throw error;
    }
  }

  // Update process type
  static async update(id, updateData) {
    try {
      // Check if process type exists
      const existingProcessType = await this.findById(id);
      if (!existingProcessType) {
        throw new Error("Process type not found");
      }

      // Check if code already exists (if being updated)
      if (updateData.code && updateData.code !== existingProcessType.code) {
        const existingCode = await this.findByCode(updateData.code);
        if (existingCode) {
          throw new Error("Process type code already exists");
        }
      }

      // Check if name already exists (if being updated and case-insensitive)
      if (
        updateData.name &&
        updateData.name.toLowerCase() !== existingProcessType.name.toLowerCase()
      ) {
        const existingName = await this.findByName(updateData.name);
        if (existingName) {
          throw new Error("Process type name already exists");
        }
      }

      const [processType] = await db
        .update(processTypes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(processTypes.id, id))
        .returning();

      return processType;
    } catch (error) {
      console.error("Error updating process type:", error);
      throw error;
    }
  }

  // Delete process type
  static async delete(id) {
    try {
      // Check if process type exists
      const existingProcessType = await this.findById(id);
      if (!existingProcessType) {
        throw new Error("Process type not found");
      }

      const [processType] = await db
        .delete(processTypes)
        .where(eq(processTypes.id, id))
        .returning();

      return processType;
    } catch (error) {
      console.error("Error deleting process type:", error);
      throw error;
    }
  }

  // Validate process type data
  static validateProcessTypeData(data, isUpdate = false) {
    const errors = {};

    // Name validation
    if (!isUpdate || data.name !== undefined) {
      if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.name = "Process type name is required";
      } else if (data.name.length > 100) {
        errors.name = "Process type name must not exceed 100 characters";
      }
    }

    // Code validation
    if (!isUpdate || data.code !== undefined) {
      if (
        !data.code ||
        typeof data.code !== "string" ||
        data.code.trim() === ""
      ) {
        errors.code = "Process type code is required";
      } else if (data.code.length > 20) {
        errors.code = "Process type code must not exceed 20 characters";
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
}

module.exports = ProcessType;
