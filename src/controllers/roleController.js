const Role = require("../models/Role");

class RoleController {
  // GET /api/roles - Get all roles with pagination
  static async getRoles(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;

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

      const [roles, totalCount] = await Promise.all([
        Role.findAll({ limit, offset, isActive }),
        Role.count(isActive),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          roles,
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
      console.error("Error in getRoles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/roles/:id - Get role by ID
  static async getRoleById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID",
        });
      }

      const role = await Role.findById(parseInt(id));

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      res.json({
        success: true,
        data: { role },
      });
    } catch (error) {
      console.error("Error in getRoleById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/roles/name/:name - Get role by name
  static async getRoleByName(req, res) {
    try {
      const { name } = req.params;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Role name is required",
        });
      }

      const role = await Role.findByName(name.trim().toLowerCase());

      if (!role) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }

      res.json({
        success: true,
        data: { role },
      });
    } catch (error) {
      console.error("Error in getRoleByName:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/roles/stats - Get role statistics
  static async getRoleStats(req, res) {
    try {
      const [totalRoles, activeRoles, inactiveRoles] = await Promise.all([
        Role.count(),
        Role.count(true),
        Role.count(false),
      ]);

      res.json({
        success: true,
        data: {
          total: totalRoles,
          active: activeRoles,
          inactive: inactiveRoles,
        },
      });
    } catch (error) {
      console.error("Error in getRoleStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/roles - Create new role
  static async createRole(req, res) {
    try {
      const { name, description } = req.body;

      // Validate required fields
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Role name is required",
        });
      }

      const roleData = {
        name: name.trim().toLowerCase(),
        description: description?.trim() || null,
      };

      const role = await Role.create(roleData);

      res.status(201).json({
        success: true,
        data: { role },
        message: "Role created successfully",
      });
    } catch (error) {
      console.error("Error in createRole:", error);

      if (error.message === "Role name already exists") {
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

  // GET /api/roles/map - Get roles as id-name map for dropdowns
  static async getRoleMap(req, res) {
    try {
      const roleMap = await Role.getRoleMap();

      res.json({
        success: true,
        data: {
          roles: roleMap,
        },
      });
    } catch (error) {
      console.error("Error in getRoleMap:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/roles/predefined - Get predefined roles
  static async getPredefinedRoles(req, res) {
    try {
      const predefinedRoles = Role.getPredefinedRoles();

      res.json({
        success: true,
        data: {
          roles: predefinedRoles,
        },
      });
    } catch (error) {
      console.error("Error in getPredefinedRoles:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = RoleController;
