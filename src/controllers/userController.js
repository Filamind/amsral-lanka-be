const User = require("../models/User");

class UserController {
  // GET /api/users - Get all users with pagination
  static async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const includeDeleted = req.query.includeDeleted === "true";
      const search = req.query.search;

      const offset = (page - 1) * limit;

      // Validate pagination parameters
      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: "Limit cannot exceed 100",
        });
      }

      if (page < 1 || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Page and limit must be positive numbers",
        });
      }

      const [users, totalCount] = await Promise.all([
        User.findAll({ limit, offset, isActive, includeDeleted, search }),
        User.count(isActive, includeDeleted, search),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalCount,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getUsers:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/users/:id - Get user by ID
  static async getUserById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const user = await User.findById(parseInt(id));

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Error in getUserById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/users/email/:email - Get user by email
  static async getUserByEmail(req, res) {
    try {
      const { email } = req.params;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/users/stats - Get user statistics
  static async getUserStats(req, res) {
    try {
      const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
        User.count(),
        User.count(true),
        User.count(false),
      ]);

      res.json({
        success: true,
        data: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },
      });
    } catch (error) {
      console.error("Error in getUserStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/users/login - User authentication
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      const user = await User.authenticate(email, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // Generate JWT token (you'll need to implement this in User model)
      const token = User.generateToken(user);

      res.json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/users - Create new user
  static async createUser(req, res) {
    try {
      const {
        username,
        email,
        firstName,
        lastName,
        passwordHash,
        phone,
        dateOfBirth,
        roleId,
        isActive = true,
      } = req.body;

      // Validate required fields
      if (!username || !email || !firstName || !lastName || !passwordHash) {
        return res.status(400).json({
          success: false,
          message:
            "Username, email, firstName, lastName, and passwordHash are required",
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Check if username already exists
      const existingUserByUsername = await User.findByUsername(username.trim());
      if (existingUserByUsername) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Check if email already exists
      const existingUserByEmail = await User.findByEmail(
        email.trim().toLowerCase()
      );
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Validate roleId if provided
      if (roleId && (isNaN(roleId) || roleId < 1)) {
        return res.status(400).json({
          success: false,
          message: "Invalid roleId. Must be a positive number",
        });
      }

      const userData = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash,
        phone: phone?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        roleId: roleId ? parseInt(roleId) : null,
        isActive,
      };

      const user = await User.create(userData);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          roleId: user.roleId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in createUser:", error);

      if (error.message === "Email already exists") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/users/:id - Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const {
        username,
        email,
        firstName,
        lastName,
        passwordHash,
        phone,
        dateOfBirth,
        roleId,
        isActive,
      } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Validate email if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }

        // Check if email already exists (excluding current user)
        const existingUserByEmail = await User.findByEmail(
          email.trim().toLowerCase()
        );
        if (existingUserByEmail && existingUserByEmail.id !== parseInt(id)) {
          return res.status(409).json({
            success: false,
            message: "Email already exists",
          });
        }
      }

      // Validate username if provided
      if (username) {
        // Check if username already exists (excluding current user)
        const existingUserByUsername = await User.findByUsername(
          username.trim()
        );
        if (
          existingUserByUsername &&
          existingUserByUsername.id !== parseInt(id)
        ) {
          return res.status(409).json({
            success: false,
            message: "Username already exists",
          });
        }
      }

      // Validate roleId if provided
      if (roleId && (isNaN(roleId) || roleId < 1)) {
        return res.status(400).json({
          success: false,
          message: "Invalid roleId. Must be a positive number",
        });
      }

      const userData = {};
      if (username !== undefined) userData.username = username.trim();
      if (email !== undefined) userData.email = email.trim().toLowerCase();
      if (firstName !== undefined) userData.firstName = firstName.trim();
      if (lastName !== undefined) userData.lastName = lastName.trim();
      if (passwordHash !== undefined) userData.passwordHash = passwordHash;
      if (phone !== undefined) userData.phone = phone?.trim() || null;
      if (dateOfBirth !== undefined) userData.dateOfBirth = dateOfBirth;
      if (roleId !== undefined)
        userData.roleId = roleId ? parseInt(roleId) : null;
      if (isActive !== undefined) userData.isActive = isActive;

      const user = await User.update(parseInt(id), userData);

      res.json({
        success: true,
        message: "User updated successfully",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          roleId: user.roleId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in updateUser:", error);

      if (error.message === "Email already exists") {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // DELETE /api/users/:id - Delete user (soft delete)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await User.delete(parseInt(id));

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteUser:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/users/:id/restore - Restore deleted user
  static async restoreUser(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const user = await User.update(parseInt(id), { isDeleted: false });

      res.json({
        success: true,
        data: { user },
        message: "User restored successfully",
      });
    } catch (error) {
      console.error("Error in restoreUser:", error);

      if (error.message === "User not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/users/:id/change-password - Change user password
  static async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      // Check if user exists (with password for verification)
      const existingUser = await User.findByIdWithPassword(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify current password
      const bcrypt = require("bcrypt");
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.passwordHash
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const user = await User.update(parseInt(id), {
        passwordHash: hashedNewPassword,
      });

      res.json({
        success: true,
        message: "Password changed successfully",
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Error in changePassword:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/users/:id/change-username - Change username
  static async changeUsername(req, res) {
    try {
      const { id } = req.params;
      const { username } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Validate required fields
      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required",
        });
      }

      // Validate username format
      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Username must be at least 3 characters long",
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if username already exists (excluding current user)
      const existingUserByUsername = await User.findByUsername(username.trim());
      if (
        existingUserByUsername &&
        existingUserByUsername.id !== parseInt(id)
      ) {
        return res.status(409).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Update username
      const user = await User.update(parseInt(id), {
        username: username.trim(),
      });

      res.json({
        success: true,
        message: "Username changed successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Error in changeUsername:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/users/:id/change-email - Change email
  static async changeEmail(req, res) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Validate required fields
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if email already exists (excluding current user)
      const existingUserByEmail = await User.findByEmail(
        email.trim().toLowerCase()
      );
      if (existingUserByEmail && existingUserByEmail.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Update email
      const user = await User.update(parseInt(id), {
        email: email.trim().toLowerCase(),
      });

      res.json({
        success: true,
        message: "Email changed successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      console.error("Error in changeEmail:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/users/:id/profile - Update user profile (personal details)
  static async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, dateOfBirth } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Check if user exists
      const existingUser = await User.findById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Build update data
      const userData = {};
      if (firstName !== undefined) userData.firstName = firstName.trim();
      if (lastName !== undefined) userData.lastName = lastName.trim();
      if (phone !== undefined) userData.phone = phone?.trim() || null;
      if (dateOfBirth !== undefined) userData.dateOfBirth = dateOfBirth || null;

      // Update profile
      const user = await User.update(parseInt(id), userData);

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          roleId: user.roleId,
          isActive: user.isActive,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in updateProfile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = UserController;
