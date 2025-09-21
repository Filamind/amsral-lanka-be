const DryingType = require("../models/DryingType");

// Controller for managing drying types

class DryingTypeController {
  // GET /api/drying-types - Get all drying types with pagination
  static async getDryingTypes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
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

      const [dryingTypes, totalCount] = await Promise.all([
        DryingType.findAll({ limit, offset, isActive, search }),
        DryingType.count({ isActive, search }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          dryingTypes,
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
      console.error("Error in getDryingTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/drying-types/:id - Get drying type by ID
  static async getDryingTypeById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid drying type ID",
        });
      }

      const dryingType = await DryingType.findById(parseInt(id));

      if (!dryingType) {
        return res.status(404).json({
          success: false,
          message: "Drying type not found",
        });
      }

      res.json({
        success: true,
        data: { dryingType },
      });
    } catch (error) {
      console.error("Error in getDryingTypeById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/drying-types/code/:code - Get drying type by code
  static async getDryingTypeByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Drying type code is required",
        });
      }

      const dryingType = await DryingType.findByCode(code.trim());

      if (!dryingType) {
        return res.status(404).json({
          success: false,
          message: "Drying type not found",
        });
      }

      res.json({
        success: true,
        data: { dryingType },
      });
    } catch (error) {
      console.error("Error in getDryingTypeByCode:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/drying-types/stats - Get drying type statistics
  static async getDryingTypeStats(req, res) {
    try {
      const [totalDryingTypes, activeDryingTypes, inactiveDryingTypes] =
        await Promise.all([
          DryingType.count(),
          DryingType.count({ isActive: true }),
          DryingType.count({ isActive: false }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalDryingTypes,
          active: activeDryingTypes,
          inactive: inactiveDryingTypes,
        },
      });
    } catch (error) {
      console.error("Error in getDryingTypeStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/drying-types - Create new drying type
  static async createDryingType(req, res) {
    try {
      const { name, code, description } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Name and code are required",
        });
      }

      const dryingTypeData = {
        name: name.trim(),
        code: code.trim(),
        description: description?.trim() || null,
      };

      const dryingType = await DryingType.create(dryingTypeData);

      res.status(201).json({
        success: true,
        data: { dryingType },
        message: "Drying type created successfully",
      });
    } catch (error) {
      console.error("Error in createDryingType:", error);

      if (error.message === "Drying type code already exists") {
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

  // GET /api/drying-types/predefined - Get predefined drying types
  static async getPredefinedDryingTypes(req, res) {
    try {
      const predefinedDryingTypes = DryingType.getPredefinedDryingTypes();

      res.json({
        success: true,
        data: {
          dryingTypes: predefinedDryingTypes,
        },
      });
    } catch (error) {
      console.error("Error in getPredefinedDryingTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = DryingTypeController;
