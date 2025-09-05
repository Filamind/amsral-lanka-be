const MachineType = require("../models/MachineType");

class MachineTypeController {
  // GET /api/machine-types - Get all machine types with pagination
  static async getMachineTypes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search;
      const type = req.query.type;
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

      const [machineTypeList, totalCount] = await Promise.all([
        MachineType.findAll({
          limit,
          offset,
          search,
          type,
          sortBy,
          sortOrder,
        }),
        MachineType.count({ search, type }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          machineTypes: machineTypeList,
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalCount,
            limit,
          },
        },
      });
    } catch (error) {
      console.error("Error in getMachineTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/machine-types/:id - Get machine type by ID
  static async getMachineTypeById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine type ID",
        });
      }

      const machineType = await MachineType.findById(parseInt(id));

      if (!machineType) {
        return res.status(404).json({
          success: false,
          message: "Machine type not found",
        });
      }

      res.json({
        success: true,
        data: machineType,
      });
    } catch (error) {
      console.error("Error in getMachineTypeById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/machine-types - Create new machine type
  static async createMachineType(req, res) {
    try {
      const { name, type, description } = req.body;

      // Validate input data
      const validation = MachineType.validateMachineTypeData({
        name,
        type,
        description,
      });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const machineTypeData = {
        name: name.trim(),
        type: type.trim(),
        description: description?.trim() || null,
      };

      const machineType = await MachineType.create(machineTypeData);

      res.status(201).json({
        success: true,
        message: "Machine type created successfully",
        data: machineType,
      });
    } catch (error) {
      console.error("Error in createMachineType:", error);

      if (error.message === "Machine type name already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            name_unique: "Machine type name already exists",
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

  // PUT /api/machine-types/:id - Update existing machine type
  static async updateMachineType(req, res) {
    try {
      const { id } = req.params;
      const { name, type, description } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine type ID",
        });
      }

      // Validate input data
      const validation = MachineType.validateMachineTypeData(
        { name, type, description },
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
      if (type !== undefined) updateData.type = type.trim();
      if (description !== undefined)
        updateData.description = description?.trim() || null;

      const machineType = await MachineType.update(parseInt(id), updateData);

      res.json({
        success: true,
        message: "Machine type updated successfully",
        data: machineType,
      });
    } catch (error) {
      console.error("Error in updateMachineType:", error);

      if (error.message === "Machine type not found") {
        return res.status(404).json({
          success: false,
          message: "Machine type not found",
        });
      }

      if (error.message === "Machine type name already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            name_unique: "Machine type name already exists",
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

  // DELETE /api/machine-types/:id - Delete machine type
  static async deleteMachineType(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid machine type ID",
        });
      }

      await MachineType.delete(parseInt(id));

      res.json({
        success: true,
        message: "Machine type deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteMachineType:", error);

      if (error.message === "Machine type not found") {
        return res.status(404).json({
          success: false,
          message: "Machine type not found",
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

  // GET /api/machine-types/stats - Get machine type statistics
  static async getMachineTypeStats(req, res) {
    try {
      const totalMachineTypes = await MachineType.count();

      res.json({
        success: true,
        data: {
          total: totalMachineTypes,
        },
      });
    } catch (error) {
      console.error("Error in getMachineTypeStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/machine-types/types - Get unique machine types
  static async getUniqueTypes(req, res) {
    try {
      const types = await MachineType.getUniqueTypes();

      res.json({
        success: true,
        data: types,
      });
    } catch (error) {
      console.error("Error in getUniqueTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/machine-types/list - Get all machine types in simple format (for dropdowns/selects)
  static async getMachineTypesList(req, res) {
    try {
      const search = req.query.search;
      const type = req.query.type;

      const machineTypes = await MachineType.findAll({
        limit: 1000, // Get all machine types for dropdown
        offset: 0,
        search,
        type,
        sortBy: "name",
        sortOrder: "asc",
      });

      // Format response for frontend dropdowns
      const machineTypesList = machineTypes.map((machineType) => ({
        id: machineType.id,
        value: machineType.id,
        label: machineType.name,
        name: machineType.name,
        type: machineType.type,
        description: machineType.description,
      }));

      res.json({
        success: true,
        data: machineTypesList,
      });
    } catch (error) {
      console.error("Error in getMachineTypesList:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = MachineTypeController;
