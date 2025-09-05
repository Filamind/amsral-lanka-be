const ProcessType = require("../models/ProcessType");

class ProcessTypeController {
  // GET /api/process-types - Get all process types with pagination
  static async getProcessTypes(req, res) {
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

      const [processTypeList, totalCount] = await Promise.all([
        ProcessType.findAll({
          limit,
          offset,
          search,
          sortBy,
          sortOrder,
        }),
        ProcessType.count({ search }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          processTypes: processTypeList,
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalCount,
            limit,
          },
        },
      });
    } catch (error) {
      console.error("Error in getProcessTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/process-types/:id - Get process type by ID
  static async getProcessTypeById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid process type ID",
        });
      }

      const processType = await ProcessType.findById(parseInt(id));

      if (!processType) {
        return res.status(404).json({
          success: false,
          message: "Process type not found",
        });
      }

      res.json({
        success: true,
        data: processType,
      });
    } catch (error) {
      console.error("Error in getProcessTypeById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/process-types/code/:code - Get process type by code
  static async getProcessTypeByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Process type code is required",
        });
      }

      const processType = await ProcessType.findByCode(code.trim());

      if (!processType) {
        return res.status(404).json({
          success: false,
          message: "Process type not found",
        });
      }

      res.json({
        success: true,
        data: processType,
      });
    } catch (error) {
      console.error("Error in getProcessTypeByCode:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/process-types - Create new process type
  static async createProcessType(req, res) {
    try {
      const { name, code, description } = req.body;

      // Validate input data
      const validation = ProcessType.validateProcessTypeData({
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

      const processTypeData = {
        name: name.trim(),
        code: code.trim(),
        description: description?.trim() || null,
      };

      const processType = await ProcessType.create(processTypeData);

      res.status(201).json({
        success: true,
        message: "Process type created successfully",
        data: processType,
      });
    } catch (error) {
      console.error("Error in createProcessType:", error);

      if (error.message === "Process type code already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            code_unique: "Process type code already exists",
          },
        });
      }

      if (error.message === "Process type name already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            name_unique: "Process type name already exists",
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

  // PUT /api/process-types/:id - Update existing process type
  static async updateProcessType(req, res) {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid process type ID",
        });
      }

      // Validate input data
      const validation = ProcessType.validateProcessTypeData(
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

      const processType = await ProcessType.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: "Process type updated successfully",
        data: processType,
      });
    } catch (error) {
      console.error("Error in updateProcessType:", error);

      if (error.message === "Process type not found") {
        return res.status(404).json({
          success: false,
          message: "Process type not found",
        });
      }

      if (error.message === "Process type code already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            code_unique: "Process type code already exists",
          },
        });
      }

      if (error.message === "Process type name already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            name_unique: "Process type name already exists",
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

  // DELETE /api/process-types/:id - Delete process type
  static async deleteProcessType(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid process type ID",
        });
      }

      await ProcessType.delete(parseInt(id));

      res.json({
        success: true,
        message: "Process type deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteProcessType:", error);

      if (error.message === "Process type not found") {
        return res.status(404).json({
          success: false,
          message: "Process type not found",
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

  // GET /api/process-types/stats - Get process type statistics
  static async getProcessTypeStats(req, res) {
    try {
      const totalProcessTypes = await ProcessType.count();

      res.json({
        success: true,
        data: {
          total: totalProcessTypes,
        },
      });
    } catch (error) {
      console.error("Error in getProcessTypeStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/process-types/list - Get all process types in simple format (for dropdowns/selects)
  static async getProcessTypesList(req, res) {
    try {
      const search = req.query.search;

      const processTypes = await ProcessType.findAll({
        limit: 1000, // Get all process types for dropdown
        offset: 0,
        search,
        sortBy: "name",
        sortOrder: "asc",
      });

      // Format response for frontend dropdowns
      const processTypesList = processTypes.map((processType) => ({
        id: processType.id,
        value: processType.id,
        label: processType.name,
        name: processType.name,
        code: processType.code,
        description: processType.description,
      }));

      res.json({
        success: true,
        data: processTypesList,
      });
    } catch (error) {
      console.error("Error in getProcessTypesList:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ProcessTypeController;
