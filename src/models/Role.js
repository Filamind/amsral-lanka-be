const { db } = require("../config/db");
const { roles } = require("../db/schema");
const { eq, desc, count } = require("drizzle-orm");

class Role {
  constructor(roleData) {
    this.id = roleData.id;
    this.name = roleData.name;
    this.description = roleData.description;
    this.isActive =
      roleData.isActive !== undefined ? roleData.isActive : roleData.is_active;
    this.createdAt = roleData.createdAt || roleData.created_at;
    this.updatedAt = roleData.updatedAt || roleData.updated_at;
  }

  // Get all roles
  static async findAll(options = {}) {
    const { limit = 50, offset = 0, isActive = null } = options;

    try {
      let query = db.select().from(roles);

      if (isActive !== null) {
        query = query.where(eq(roles.isActive, isActive));
      }

      const result = await query
        .orderBy(desc(roles.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map((row) => new Role(row));
    } catch (error) {
      throw new Error(`Error fetching roles: ${error.message}`);
    }
  }

  // Get role by ID
  static async findById(id) {
    try {
      const result = await db.select().from(roles).where(eq(roles.id, id));
      if (result.length === 0) {
        return null;
      }
      return new Role(result[0]);
    } catch (error) {
      throw new Error(`Error fetching role: ${error.message}`);
    }
  }

  // Get role by name
  static async findByName(name) {
    try {
      const result = await db.select().from(roles).where(eq(roles.name, name));
      if (result.length === 0) {
        return null;
      }
      return new Role(result[0]);
    } catch (error) {
      throw new Error(`Error fetching role: ${error.message}`);
    }
  }

  // Count total roles
  static async count(isActive = null) {
    try {
      let query = db.select({ count: count() }).from(roles);

      if (isActive !== null) {
        query = query.where(eq(roles.isActive, isActive));
      }

      const result = await query;
      return result[0].count;
    } catch (error) {
      throw new Error(`Error counting roles: ${error.message}`);
    }
  }

  // Create new role
  static async create(roleData) {
    const { name, description = null } = roleData;

    try {
      const result = await db
        .insert(roles)
        .values({
          name,
          description,
        })
        .returning();

      return new Role(result[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Role name already exists");
      }
      throw new Error(`Error creating role: ${error.message}`);
    }
  }

  // Update role
  async update(updateData) {
    const allowedFields = ["name", "description", "isActive"];
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
        .update(roles)
        .set(updateValues)
        .where(eq(roles.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Role not found");
      }

      // Update current instance
      const updatedRole = new Role(result[0]);
      Object.assign(this, updatedRole);
      return this;
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Role name already exists");
      }
      throw new Error(`Error updating role: ${error.message}`);
    }
  }

  // Delete role (soft delete by setting is_active to false)
  async delete() {
    try {
      const result = await db
        .update(roles)
        .set({ isActive: false })
        .where(eq(roles.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Role not found");
      }
      this.isActive = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting role: ${error.message}`);
    }
  }

  // Get roles as a map with id and name for dropdowns/selects
  static async getRoleMap() {
    try {
      const result = await db
        .select({
          id: roles.id,
          name: roles.name,
        })
        .from(roles)
        .where(eq(roles.isActive, true))
        .orderBy(roles.name);

      return result;
    } catch (error) {
      throw new Error(`Error fetching role map: ${error.message}`);
    }
  }

  // Get predefined roles
  static getPredefinedRoles() {
    return [
      { name: "admin", description: "Administrator with full system access" },
      {
        name: "finance",
        description: "Finance team member with financial data access",
      },
      {
        name: "sales",
        description: "Sales team member with sales data access",
      },
    ];
  }
}

module.exports = Role;
