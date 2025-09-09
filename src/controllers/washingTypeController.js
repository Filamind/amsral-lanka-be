const WashingType = require("../models/WashingType");

class WashingTypeController {
  // GET /api/washing-types - Get all washing types with pagination
  static async getWashingTypes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const sortBy = req.query.sortBy || "createdAt";
      const sortOrder = req.query.sortOrder || "desc";

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

      const [washingTypeList, totalCount] = await Promise.all([
        WashingType.findAll({ limit, offset, search, sortBy, sortOrder }),
        WashingType.count({ search }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          washingTypes: washingTypeList,
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalCount,
            limit,
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
      const totalWashingTypes = await WashingType.count();

      res.json({
        success: true,
        data: {
          total: totalWashingTypes,
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

      // Validate input data
      const validation = WashingType.validateWashingTypeData({
        name,
        code,
        description,
      });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
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
        message: "Washing type created successfully",
        data: washingType,
      });
    } catch (error) {
      console.error("Error in createWashingType:", error);

      if (
        error.message === "Washing type code already exists" ||
        error.message === "Washing type name already exists"
      ) {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            [error.message.includes("code") ? "code" : "name"]: error.message,
          },
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

  // PUT /api/washing-types/:id - Update existing washing type
  static async updateWashingType(req, res) {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid washing type ID",
        });
      }

      // Validate input data
      const validation = WashingType.validateWashingTypeData(
        { name, code, description },
        true
      );
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (code !== undefined) updateData.code = code.trim();
      if (description !== undefined)
        updateData.description = description?.trim() || null;

      const washingType = await WashingType.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: "Washing type updated successfully",
        data: washingType,
      });
    } catch (error) {
      console.error("Error in updateWashingType:", error);

      if (error.message === "Washing type not found") {
        return res.status(404).json({
          success: false,
          message: "Washing type not found",
        });
      }

      if (
        error.message === "Washing type code already exists" ||
        error.message === "Washing type name already exists"
      ) {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            [error.message.includes("code") ? "code" : "name"]: error.message,
          },
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

  // DELETE /api/washing-types/:id - Delete washing type
  static async deleteWashingType(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid washing type ID",
        });
      }

      await WashingType.delete(parseInt(id));

      res.json({
        success: true,
        message: "Washing type deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteWashingType:", error);

      if (error.message === "Washing type not found") {
        return res.status(404).json({
          success: false,
          message: "Washing type not found",
        });
      }

      if (
        error.message ===
        "Cannot delete washing type. It is being used in existing processes."
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete washing type. It is being used in existing processes.",
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

  // GET /api/washing-types/list - Get all washing types in simple format (for dropdowns/selects)
  static async getWashingTypesList(req, res) {
    try {
      const search = req.query.search;

      const washingTypes = await WashingType.findAll({
        limit: 1000, // Get all washing types for dropdown
        offset: 0,
        search,
        sortBy: "name",
        sortOrder: "asc",
      });

      // Format response for frontend dropdowns
      const washingTypesList = washingTypes.map((washingType) => ({
        id: washingType.id,
        value: washingType.id,
        label: `${washingType.name} (${washingType.code})`,
        name: washingType.name,
        code: washingType.code,
        description: washingType.description,
      }));

      res.json({
        success: true,
        data: washingTypesList,
      });
    } catch (error) {
      console.error("Error in getWashingTypesList:", error);
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
