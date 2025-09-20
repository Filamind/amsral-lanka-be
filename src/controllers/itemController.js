const Item = require("../models/Item");

class ItemController {
  // GET /api/items - Get all items with pagination
  static async getItems(req, res) {
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

      const [itemList, totalCount] = await Promise.all([
        Item.findAll({
          limit,
          offset,
          search,
          sortBy,
          sortOrder,
        }),
        Item.count({ search }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          items: itemList,
          pagination: {
            currentPage: page,
            totalPages,
            totalRecords: totalCount,
            limit,
          },
        },
      });
    } catch (error) {
      console.error("Error in getItems:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/items/:id - Get item by ID
  static async getItemById(req, res) {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Item ID is required",
        });
      }

      const item = await Item.findById(id.trim());

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error("Error in getItemById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/items - Create new item
  static async createItem(req, res) {
    try {
      const { name, code, description } = req.body;

      // Validate input data
      const validation = Item.validateItemData({ name, code, description });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const itemData = {
        name: name.trim(),
        code: code?.trim() || null,
        description: description?.trim() || null,
      };

      const item = await Item.create(itemData);

      res.status(201).json({
        success: true,
        message: "Item created successfully",
        data: item,
      });
    } catch (error) {
      console.error("Error in createItem:", error);

      if (error.message === "Item name already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            name_unique: "Item name already exists",
          },
        });
      }

      if (error.message === "Item code already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            code_unique: "Item code already exists",
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

  // PUT /api/items/:id - Update existing item
  static async updateItem(req, res) {
    try {
      const { id } = req.params;
      const { name, code, description } = req.body;

      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Item ID is required",
        });
      }

      // Validate input data
      const validation = Item.validateItemData(
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
      if (code !== undefined) updateData.code = code?.trim() || null;
      if (description !== undefined)
        updateData.description = description?.trim() || null;

      const item = await Item.update(id.trim(), updateData);

      res.json({
        success: true,
        message: "Item updated successfully",
        data: item,
      });
    } catch (error) {
      console.error("Error in updateItem:", error);

      if (error.message === "Item not found") {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (error.message === "Item name already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            name_unique: "Item name already exists",
          },
        });
      }

      if (error.message === "Item code already exists") {
        return res.status(409).json({
          success: false,
          message: "Validation failed",
          errors: {
            code_unique: "Item code already exists",
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

  // DELETE /api/items/:id - Delete item
  static async deleteItem(req, res) {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Item ID is required",
        });
      }

      await Item.delete(id.trim());

      res.json({
        success: true,
        message: "Item deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteItem:", error);

      if (error.message === "Item not found") {
        return res.status(404).json({
          success: false,
          message: "Item not found",
        });
      }

      if (
        error.message ===
        "Cannot delete item. It is being used in existing orders."
      ) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete item. It is being used in existing orders.",
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

  // GET /api/items/stats - Get item statistics
  static async getItemStats(req, res) {
    try {
      const totalItems = await Item.count();

      res.json({
        success: true,
        data: {
          total: totalItems,
        },
      });
    } catch (error) {
      console.error("Error in getItemStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/items/list - Get all items in simple format (for dropdowns/selects)
  static async getItemsList(req, res) {
    try {
      const search = req.query.search;

      const items = await Item.findAll({
        limit: 1000, // Get all items for dropdown
        offset: 0,
        search,
        sortBy: "name",
        sortOrder: "asc",
      });

      // Format response for frontend dropdowns
      const itemsList = items.map((item) => ({
        id: item.id,
        value: item.id,
        label: item.name,
        name: item.name,
        code: item.code,
        description: item.description,
      }));

      res.json({
        success: true,
        data: itemsList,
      });
    } catch (error) {
      console.error("Error in getItemsList:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ItemController;
