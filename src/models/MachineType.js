const { eq, and, or, ilike, count, asc, desc } = require("drizzle-orm");
const { db } = require("../config/db");
const { machineTypes } = require("../db/schema");

class MachineType {
  // Create a new machine type
  static async create(machineTypeData) {
    try {
      // Check if machine type name already exists (case-insensitive)
      const existingName = await this.findByName(machineTypeData.name);
      if (existingName) {
        throw new Error("Machine type name already exists");
      }

      const [machineType] = await db
        .insert(machineTypes)
        .values({
          name: machineTypeData.name,
          type: machineTypeData.type,
          description: machineTypeData.description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return machineType;
    } catch (error) {
      console.error("Error creating machine type:", error);
      throw error;
    }
  }

  // Find machine type by ID
  static async findById(id) {
    try {
      const [machineType] = await db
        .select()
        .from(machineTypes)
        .where(eq(machineTypes.id, id))
        .limit(1);

      return machineType || null;
    } catch (error) {
      console.error("Error finding machine type by ID:", error);
      throw error;
    }
  }

  // Find machine type by name (case-insensitive)
  static async findByName(name) {
    try {
      const [machineType] = await db
        .select()
        .from(machineTypes)
        .where(ilike(machineTypes.name, name))
        .limit(1);

      return machineType || null;
    } catch (error) {
      console.error("Error finding machine type by name:", error);
      throw error;
    }
  }

  // Find all machine types with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        search = null,
        type = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(machineTypes.name, `%${search}%`),
            ilike(machineTypes.type, `%${search}%`),
            ilike(machineTypes.description, `%${search}%`)
          )
        );
      }

      if (type) {
        conditions.push(ilike(machineTypes.type, `%${type}%`));
      }

      // Build order by
      const orderBy =
        sortOrder === "asc"
          ? asc(machineTypes[sortBy])
          : desc(machineTypes[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const machineTypeList = await db
        .select()
        .from(machineTypes)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return machineTypeList;
    } catch (error) {
      console.error("Error finding machine types:", error);
      throw error;
    }
  }

  // Count machine types with filtering
  static async count(options = {}) {
    try {
      const { search = null, type = null } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(machineTypes.name, `%${search}%`),
            ilike(machineTypes.type, `%${search}%`),
            ilike(machineTypes.description, `%${search}%`)
          )
        );
      }

      if (type) {
        conditions.push(ilike(machineTypes.type, `%${type}%`));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(machineTypes)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting machine types:", error);
      throw error;
    }
  }

  // Update machine type
  static async update(id, updateData) {
    try {
      // Check if machine type exists
      const existingMachineType = await this.findById(id);
      if (!existingMachineType) {
        throw new Error("Machine type not found");
      }

      // Check if name already exists (if being updated and case-insensitive)
      if (
        updateData.name &&
        updateData.name.toLowerCase() !== existingMachineType.name.toLowerCase()
      ) {
        const existingName = await this.findByName(updateData.name);
        if (existingName) {
          throw new Error("Machine type name already exists");
        }
      }

      const [machineType] = await db
        .update(machineTypes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(machineTypes.id, id))
        .returning();

      return machineType;
    } catch (error) {
      console.error("Error updating machine type:", error);
      throw error;
    }
  }

  // Delete machine type
  static async delete(id) {
    try {
      // Check if machine type exists
      const existingMachineType = await this.findById(id);
      if (!existingMachineType) {
        throw new Error("Machine type not found");
      }

      const [machineType] = await db
        .delete(machineTypes)
        .where(eq(machineTypes.id, id))
        .returning();

      return machineType;
    } catch (error) {
      console.error("Error deleting machine type:", error);
      throw error;
    }
  }

  // Get unique machine types
  static async getUniqueTypes() {
    try {
      const result = await db
        .selectDistinct({ type: machineTypes.type })
        .from(machineTypes)
        .orderBy(asc(machineTypes.type));

      return result.map((row) => row.type);
    } catch (error) {
      console.error("Error getting unique machine types:", error);
      throw error;
    }
  }

  // Validate machine type data
  static validateMachineTypeData(data, isUpdate = false) {
    const errors = {};

    // Name validation
    if (!isUpdate || data.name !== undefined) {
      if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.name = "Machine type name is required";
      } else if (data.name.length > 100) {
        errors.name = "Machine type name must not exceed 100 characters";
      }
    }

    // Type validation
    if (!isUpdate || data.type !== undefined) {
      if (
        !data.type ||
        typeof data.type !== "string" ||
        data.type.trim() === ""
      ) {
        errors.type = "Machine type is required";
      } else if (data.type.length > 50) {
        errors.type = "Machine type must not exceed 50 characters";
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

module.exports = MachineType;
