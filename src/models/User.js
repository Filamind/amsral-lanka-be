const { db } = require("../config/db");
const { users, roles } = require("../db/schema");
const { eq, desc, count } = require("drizzle-orm");

class User {
  constructor(userData) {
    this.id = userData.id;
    this.email = userData.email;
    this.firstName = userData.firstName || userData.first_name;
    this.lastName = userData.lastName || userData.last_name;
    this.phone = userData.phone;
    this.dateOfBirth = userData.dateOfBirth || userData.date_of_birth;
    this.roleId = userData.roleId || userData.role_id;
    this.isActive =
      userData.isActive !== undefined ? userData.isActive : userData.is_active;
    this.createdAt = userData.createdAt || userData.created_at;
    this.updatedAt = userData.updatedAt || userData.updated_at;

    // Role information if included in query
    this.role = userData.role;
  }

  // Get all users
  static async findAll(options = {}) {
    const { limit = 50, offset = 0, isActive = null } = options;

    try {
      let query = db.select().from(users);

      if (isActive !== null) {
        query = query.where(eq(users.isActive, isActive));
      }

      const result = await query
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map((row) => new User(row));
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Get user by ID
  static async findById(id) {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      if (result.length === 0) {
        return null;
      }
      return new User(result[0]);
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Get user by email
  static async findByEmail(email) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (result.length === 0) {
        return null;
      }
      return new User(result[0]);
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }

  // Count total users
  static async count(isActive = null) {
    try {
      let query = db.select({ count: count() }).from(users);

      if (isActive !== null) {
        query = query.where(eq(users.isActive, isActive));
      }

      const result = await query;
      return result[0].count;
    } catch (error) {
      throw new Error(`Error counting users: ${error.message}`);
    }
  }

  // Create new user
  static async create(userData) {
    const {
      email,
      firstName,
      lastName,
      passwordHash,
      phone = null,
      dateOfBirth = null,
      roleId = null,
    } = userData;

    try {
      const result = await db
        .insert(users)
        .values({
          email,
          firstName,
          lastName,
          passwordHash,
          phone,
          dateOfBirth,
          roleId,
        })
        .returning();

      return new User(result[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        throw new Error("Email already exists");
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    const allowedFields = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "roleId",
      "isActive",
    ];
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
        .update(users)
        .set(updateValues)
        .where(eq(users.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("User not found");
      }

      // Update current instance
      const updatedUser = new User(result[0]);
      Object.assign(this, updatedUser);
      return this;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Delete user (soft delete by setting is_active to false)
  async delete() {
    try {
      const result = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("User not found");
      }
      this.isActive = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }
}

module.exports = User;
