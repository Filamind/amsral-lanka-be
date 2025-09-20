const { eq, and, or, ilike, count, asc, desc } = require("drizzle-orm");
const { db } = require("../config/db");
const { items } = require("../db/schema");

class Item {
  // Create a new item
  static async create(itemData) {
    try {
      // Check if item name already exists (case-insensitive)
      const existingItem = await this.findByName(itemData.name);
      if (existingItem) {
        throw new Error("Item name already exists");
      }

      // Check if item code already exists (if provided)
      if (itemData.code && itemData.code.trim() !== "") {
        const existingCode = await this.findByCode(itemData.code);
        if (existingCode) {
          throw new Error("Item code already exists");
        }
      }

      // Generate item ID
      const id = await this.generateItemId();

      const [item] = await db
        .insert(items)
        .values({
          id,
          ...itemData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return item;
    } catch (error) {
      console.error("Error creating item:", error);
      throw error;
    }
  }

  // Find item by ID
  static async findById(id) {
    try {
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.id, id))
        .limit(1);

      return item || null;
    } catch (error) {
      console.error("Error finding item by ID:", error);
      throw error;
    }
  }

  // Find item by name (case-insensitive)
  static async findByName(name) {
    try {
      const [item] = await db
        .select()
        .from(items)
        .where(ilike(items.name, name))
        .limit(1);

      return item || null;
    } catch (error) {
      console.error("Error finding item by name:", error);
      throw error;
    }
  }

  // Find item by code
  static async findByCode(code) {
    try {
      const [item] = await db
        .select()
        .from(items)
        .where(eq(items.code, code))
        .limit(1);

      return item || null;
    } catch (error) {
      console.error("Error finding item by code:", error);
      throw error;
    }
  }

  // Find all items with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        search = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(items.name, `%${search}%`),
            ilike(items.description, `%${search}%`),
            ilike(items.id, `%${search}%`)
          )
        );
      }

      // Build order by
      const orderBy =
        sortOrder === "asc" ? asc(items[sortBy]) : desc(items[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const itemList = await db
        .select()
        .from(items)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return itemList;
    } catch (error) {
      console.error("Error finding items:", error);
      throw error;
    }
  }

  // Count items with filtering
  static async count(options = {}) {
    try {
      const { search = null } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(items.name, `%${search}%`),
            ilike(items.description, `%${search}%`),
            ilike(items.id, `%${search}%`)
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(items)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting items:", error);
      throw error;
    }
  }

  // Update item
  static async update(id, updateData) {
    try {
      // Check if item exists
      const existingItem = await this.findById(id);
      if (!existingItem) {
        throw new Error("Item not found");
      }

      // Check if name already exists (if being updated and case-insensitive)
      if (
        updateData.name &&
        updateData.name.toLowerCase() !== existingItem.name.toLowerCase()
      ) {
        const existingName = await this.findByName(updateData.name);
        if (existingName) {
          throw new Error("Item name already exists");
        }
      }

      // Check if code already exists (if being updated)
      if (
        updateData.code &&
        updateData.code !== existingItem.code
      ) {
        const existingCode = await this.findByCode(updateData.code);
        if (existingCode) {
          throw new Error("Item code already exists");
        }
      }

      const [item] = await db
        .update(items)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(items.id, id))
        .returning();

      return item;
    } catch (error) {
      console.error("Error updating item:", error);
      throw error;
    }
  }

  // Delete item
  static async delete(id) {
    try {
      // Check if item exists
      const existingItem = await this.findById(id);
      if (!existingItem) {
        throw new Error("Item not found");
      }

      // Check if item is referenced in orders
      const isReferenced = await this.isReferencedInOrders(id);
      if (isReferenced) {
        throw new Error(
          "Cannot delete item. It is being used in existing orders."
        );
      }

      const [item] = await db.delete(items).where(eq(items.id, id)).returning();

      return item;
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  }

  // Check if item is referenced in orders
  static async isReferencedInOrders(itemId) {
    try {
      // Import orders schema here to avoid circular dependency
      const { orders } = require("../db/schema");

      const [result] = await db
        .select({ count: count() })
        .from(orders)
        .where(eq(orders.itemId, itemId));

      return result.count > 0;
    } catch (error) {
      console.error("Error checking item references:", error);
      return false; // If we can't check, allow deletion but log the error
    }
  }

  // Generate next item ID
  static async generateItemId() {
    try {
      // Find the latest item ID
      const [latestItem] = await db
        .select({ id: items.id })
        .from(items)
        .where(ilike(items.id, "ITEM%"))
        .orderBy(desc(items.id))
        .limit(1);

      if (!latestItem) {
        return "ITEM001";
      }

      // Extract number and increment
      const match = latestItem.id.match(/ITEM(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `ITEM${nextNumber.toString().padStart(3, "0")}`;
      }

      return "ITEM001";
    } catch (error) {
      console.error("Error generating item ID:", error);
      throw error;
    }
  }

  // Validate item data
  static validateItemData(data, isUpdate = false) {
    const errors = {};

    // Name validation
    if (!isUpdate || data.name !== undefined) {
      if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim() === ""
      ) {
        errors.name = "Item name is required";
      } else if (data.name.length > 255) {
        errors.name = "Item name must not exceed 255 characters";
      }
    }

    // Code validation
    if (data.code !== undefined && data.code !== null) {
      if (typeof data.code !== "string") {
        errors.code = "Code must be a string";
      } else if (data.code.trim() !== "" && data.code.length > 50) {
        errors.code = "Code must not exceed 50 characters";
      }
    }

    // Description validation
    if (data.description !== undefined && data.description !== null) {
      if (typeof data.description !== "string") {
        errors.description = "Description must be a string";
      } else if (data.description.length > 1000) {
        errors.description = "Description must not exceed 1000 characters";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

module.exports = Item;
