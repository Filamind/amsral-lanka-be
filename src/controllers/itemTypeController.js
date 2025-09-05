const ItemType = require("../models/ItemType");

class ItemTypeController {
  // GET /api/item-types - Get all item types with pagination
  static async getItemTypes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const search = req.query.search;
      const category = req.query.category;
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

      const [itemTypeList, totalCount] = await Promise.all([
        ItemType.findAll({
          limit,
          offset,
          isActive,
          search,
          category,
          sortBy,
          sortOrder,
        }),
        ItemType.count({ isActive, search, category }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          itemTypes: itemTypeList,
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
      console.error("Error in getItemTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/:id - Get item type by ID
  static async getItemTypeById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item type ID",
        });
      }

      const itemType = await ItemType.findById(parseInt(id));

      if (!itemType) {
        return res.status(404).json({
          success: false,
          message: "Item type not found",
        });
      }

      res.json({
        success: true,
        data: { itemType },
      });
    } catch (error) {
      console.error("Error in getItemTypeById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/code/:code - Get item type by code
  static async getItemTypeByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Item type code is required",
        });
      }

      const itemType = await ItemType.findByCode(code.trim());

      if (!itemType) {
        return res.status(404).json({
          success: false,
          message: "Item type not found",
        });
      }

      res.json({
        success: true,
        data: { itemType },
      });
    } catch (error) {
      console.error("Error in getItemTypeByCode:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/stats - Get item type statistics
  static async getItemTypeStats(req, res) {
    try {
      const [totalItemTypes, activeItemTypes, inactiveItemTypes] =
        await Promise.all([
          ItemType.count(),
          ItemType.count({ isActive: true }),
          ItemType.count({ isActive: false }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalItemTypes,
          active: activeItemTypes,
          inactive: inactiveItemTypes,
        },
      });
    } catch (error) {
      console.error("Error in getItemTypeStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/item-types - Create new item type
  static async createItemType(req, res) {
    try {
      const { name, code, description, category } = req.body;

      // Validate required fields
      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: "Name and code are required",
        });
      }

      const itemTypeData = {
        name: name.trim(),
        code: code.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
      };

      const itemType = await ItemType.create(itemTypeData);

      res.status(201).json({
        success: true,
        data: { itemType },
        message: "Item type created successfully",
      });
    } catch (error) {
      console.error("Error in createItemType:", error);

      if (error.message === "Item type code already exists") {
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

  // PUT /api/item-types/:id - Update item type
  static async updateItemType(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item type ID",
        });
      }

      const updateData = { ...req.body };

      // Clean up string fields
      Object.keys(updateData).forEach((key) => {
        if (typeof updateData[key] === "string") {
          updateData[key] = updateData[key].trim() || null;
        }
      });

      const itemType = await ItemType.update(parseInt(id), updateData);

      res.json({
        success: true,
        data: { itemType },
        message: "Item type updated successfully",
      });
    } catch (error) {
      console.error("Error in updateItemType:", error);

      if (error.message === "Item type not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message === "Item type code already exists") {
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

  // DELETE /api/item-types/:id - Delete item type (soft delete)
  static async deleteItemType(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item type ID",
        });
      }

      const itemType = await ItemType.delete(parseInt(id));

      res.json({
        success: true,
        data: { itemType },
        message: "Item type deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteItemType:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/category/:category - Get item types by category
  static async getItemTypesByCategory(req, res) {
    try {
      const { category } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const itemTypes = await ItemType.findByCategory(category, {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: { itemTypes },
      });
    } catch (error) {
      console.error("Error in getItemTypesByCategory:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/categories - Get all categories
  static async getCategories(req, res) {
    try {
      const categories = await ItemType.getCategories();

      res.json({
        success: true,
        data: { categories },
      });
    } catch (error) {
      console.error("Error in getCategories:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/list - Get all item types in simple format (for dropdowns/selects)
  static async getItemTypesList(req, res) {
    try {
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : true;
      const search = req.query.search;
      const category = req.query.category;

      const itemTypes = await ItemType.findAll({
        limit: 1000, // Get all item types for dropdown
        offset: 0,
        isActive,
        search,
        category,
        sortBy: "name",
        sortOrder: "asc",
      });

      // Format response for frontend dropdowns
      const itemTypesList = itemTypes.map((itemType) => ({
        id: itemType.code, // Use code as ID for orders
        value: itemType.code,
        label: itemType.name,
        itemName: itemType.name,
        itemCode: itemType.code,
        category: itemType.category,
        description: itemType.description,
      }));

      res.json({
        success: true,
        data: itemTypesList,
      });
    } catch (error) {
      console.error("Error in getItemTypesList:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/item-types/predefined - Get predefined item types
  static async getPredefinedItemTypes(req, res) {
    try {
      const predefinedItemTypes = ItemType.getPredefinedItemTypes();

      res.json({
        success: true,
        data: {
          itemTypes: predefinedItemTypes,
        },
      });
    } catch (error) {
      console.error("Error in getPredefinedItemTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ItemTypeController;
