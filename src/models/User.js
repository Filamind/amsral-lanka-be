const { db } = require("../config/db");
const { users, roles } = require("../db/schema");
const { eq, desc, count } = require("drizzle-orm");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      role = "user",
      isActive = true,
    } = userData;

    try {
      // Hash password if it's not already hashed
      let hashedPassword = passwordHash;
      if (!passwordHash.startsWith("$2b$")) {
        hashedPassword = await bcrypt.hash(passwordHash, 10);
      }

      const result = await db
        .insert(users)
        .values({
          email,
          firstName,
          lastName,
          passwordHash: hashedPassword,
          phone,
          dateOfBirth,
          roleId,
          isActive,
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

  // Static method to update user by ID
  static async update(id, updateData) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error("User not found");
      }

      const allowedFields = [
        "email",
        "firstName",
        "lastName",
        "passwordHash",
        "phone",
        "dateOfBirth",
        "roleId",
        "role",
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

      // Hash password if being updated
      if (
        updateValues.passwordHash &&
        !updateValues.passwordHash.startsWith("$2b$")
      ) {
        updateValues.passwordHash = await bcrypt.hash(
          updateValues.passwordHash,
          10
        );
      }

      const result = await db
        .update(users)
        .set(updateValues)
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("User not found");
      }

      return new User(result[0]);
    } catch (error) {
      if (error.message === "Email already exists" || error.code === "23505") {
        throw new Error("Email already exists");
      }
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Static method to delete user by ID
  static async delete(id) {
    try {
      const result = await db
        .update(users)
        .set({ isActive: false })
        .where(eq(users.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("User not found");
      }
      return true;
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (result.length === 0) {
        return null;
      }

      const user = new User(result[0]);

      // Check if user is active
      if (!user.isActive) {
        return null;
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(
        password,
        result[0].passwordHash || result[0].password_hash
      );

      if (!isValidPassword) {
        return null;
      }

      return user;
    } catch (error) {
      throw new Error(`Error authenticating user: ${error.message}`);
    }
  }

  // Generate JWT token
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role || "user",
    };

    return jwt.sign(payload, process.env.JWT_SECRET || "default-secret", {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
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
