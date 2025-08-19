const WashingType = require("../models/WashingType");

class WashingTypeController {
  // GET /api/washing-types - Get all washing types with pagination
  static async getWashingTypes(req, res) {
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

      const [washingTypes, totalCount] = await Promise.all([
        WashingType.findAll({ limit, offset, isActive, search }),
        WashingType.count({ isActive, search }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          washingTypes,
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
      console.error("Error in getWashingTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/washing-types/:id - Get washing type by ID
  static async getWashingTypeById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid washing type ID",
        });
      }

      const washingType = await WashingType.findById(parseInt(id));

      if (!washingType) {
        return res.status(404).json({
          success: false,
          message: "Washing type not found",
        });
      }

      res.json({
        success: true,
        data: { washingType },
      });
    } catch (error) {
      console.error("Error in getWashingTypeById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/washing-types/code/:code - Get washing type by code
  static async getWashingTypeByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Washing type code is required",
        });
      }

      const washingType = await WashingType.findByCode(code.trim());

      if (!washingType) {
        return res.status(404).json({
          success: false,
          message: "Washing type not found",
        });
      }

      res.json({
        success: true,
        data: { washingType },
      });
    } catch (error) {
      console.error("Error in getWashingTypeByCode:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/washing-types/stats - Get washing type statistics
  static async getWashingTypeStats(req, res) {
    try {
      const [totalWashingTypes, activeWashingTypes, inactiveWashingTypes] =
        await Promise.all([
          WashingType.count(),
          WashingType.count({ isActive: true }),
          WashingType.count({ isActive: false }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalWashingTypes,
          active: activeWashingTypes,
          inactive: inactiveWashingTypes,
        },
      });
    } catch (error) {
      console.error("Error in getWashingTypeStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/washing-types - Create new washing type
  static async createWashingType(req, res) {
    try {
      const { name, code, description } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Name and code are required",
        });
      }

      const washingTypeData = {
        name: name.trim(),
        code: code.trim(),
        description: description?.trim() || null,
      };

      const washingType = await WashingType.create(washingTypeData);

      res.status(201).json({
        success: true,
        data: { washingType },
        message: "Washing type created successfully",
      });
    } catch (error) {
      console.error("Error in createWashingType:", error);

      if (error.message === "Washing type code already exists") {
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

  // GET /api/washing-types/predefined - Get predefined washing types
  static async getPredefinedWashingTypes(req, res) {
    try {
      const predefinedWashingTypes = WashingType.getPredefinedWashingTypes();

      res.json({
        success: true,
        data: {
          washingTypes: predefinedWashingTypes,
        },
      });
    } catch (error) {
      console.error("Error in getPredefinedWashingTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = WashingTypeController;
