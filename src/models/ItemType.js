const { eq, and, or, ilike, count, asc, desc } = require("drizzle-orm");
const { db } = require("../config/db");
const { itemTypes } = require("../db/schema");

class ItemType {
  // Predefined item types based on the provided data
  static getPredefinedItemTypes() {
    return [
      {
        name: "C/Bottom",
        code: "C/BTM",
        description: "Casual Bottom",
        category: "Casual",
      },
      {
        name: "C/Pant",
        code: "C/PNT",
        description: "Casual Pant",
        category: "Casual",
      },
      {
        name: "D/Pant",
        code: "D/PNT",
        description: "Dress Pant",
        category: "Dress",
      },
      {
        name: "D/Short",
        code: "D/SHT",
        description: "Dress Short",
        category: "Dress",
      },
      {
        name: "D/Skirt",
        code: "D/SKT",
        description: "Dress Skirt",
        category: "Dress",
      },
      {
        name: "Dresses",
        code: "DRS",
        description: "Dresses",
        category: "Dress",
      },
      {
        name: "L/Dresses",
        code: "L/DRS",
        description: "Long Dresses",
        category: "Long",
      },
      {
        name: "Ld/Pant",
        code: "LD/PNT",
        description: "Ladies Pant",
        category: "Ladies",
      },
      {
        name: "Pant",
        code: "PNT",
        description: "General Pant",
        category: "General",
      },
      {
        name: "S/Skirt",
        code: "S/SKT",
        description: "Short Skirt",
        category: "Short",
      },
      {
        name: "Short",
        code: "SHT",
        description: "General Short",
        category: "General",
      },
      {
        name: "Skirt",
        code: "SKT",
        description: "General Skirt",
        category: "General",
      },
    ];
  }

  // Create a new item type
  static async create(itemTypeData) {
    try {
      // Check if item type code already exists
      const existingItemType = await this.findByCode(itemTypeData.code);
      if (existingItemType) {
        throw new Error("Item type code already exists");
      }

      const [itemType] = await db
        .insert(itemTypes)
        .values({
          ...itemTypeData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return itemType;
    } catch (error) {
      console.error("Error creating item type:", error);
      throw error;
    }
  }

  // Find item type by ID
  static async findById(id) {
    try {
      const [itemType] = await db
        .select()
        .from(itemTypes)
        .where(eq(itemTypes.id, id))
        .limit(1);

      return itemType || null;
    } catch (error) {
      console.error("Error finding item type by ID:", error);
      throw error;
    }
  }

  // Find item type by code
  static async findByCode(code) {
    try {
      const [itemType] = await db
        .select()
        .from(itemTypes)
        .where(eq(itemTypes.code, code))
        .limit(1);

      return itemType || null;
    } catch (error) {
      console.error("Error finding item type by code:", error);
      throw error;
    }
  }

  // Find all item types with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        isActive = null,
        search = null,
        category = null,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(itemTypes.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(itemTypes.name, `%${search}%`),
            ilike(itemTypes.code, `%${search}%`),
            ilike(itemTypes.description, `%${search}%`)
          )
        );
      }

      if (category) {
        conditions.push(ilike(itemTypes.category, `%${category}%`));
      }

      // Build order by
      const orderBy =
        sortOrder === "asc" ? asc(itemTypes[sortBy]) : desc(itemTypes[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const itemTypeList = await db
        .select()
        .from(itemTypes)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      return itemTypeList;
    } catch (error) {
      console.error("Error finding item types:", error);
      throw error;
    }
  }

  // Count item types with filtering
  static async count(options = {}) {
    try {
      const { isActive = null, search = null, category = null } = options;

      // Build where conditions
      const conditions = [];

      if (isActive !== null) {
        conditions.push(eq(itemTypes.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(itemTypes.name, `%${search}%`),
            ilike(itemTypes.code, `%${search}%`),
            ilike(itemTypes.description, `%${search}%`)
          )
        );
      }

      if (category) {
        conditions.push(ilike(itemTypes.category, `%${category}%`));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(itemTypes)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting item types:", error);
      throw error;
    }
  }

  // Update item type
  static async update(id, updateData) {
    try {
      // Check if item type exists
      const existingItemType = await this.findById(id);
      if (!existingItemType) {
        throw new Error("Item type not found");
      }

      // Check if code already exists (if being updated)
      if (updateData.code && updateData.code !== existingItemType.code) {
        const existingCode = await this.findByCode(updateData.code);
        if (existingCode) {
          throw new Error("Item type code already exists");
        }
      }

      const [itemType] = await db
        .update(itemTypes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(itemTypes.id, id))
        .returning();

      return itemType;
    } catch (error) {
      console.error("Error updating item type:", error);
      throw error;
    }
  }

  // Delete item type (soft delete)
  static async delete(id) {
    try {
      const [itemType] = await db
        .update(itemTypes)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(itemTypes.id, id))
        .returning();

      return itemType;
    } catch (error) {
      console.error("Error deleting item type:", error);
      throw error;
    }
  }

  // Hard delete item type
  static async hardDelete(id) {
    try {
      const [itemType] = await db
        .delete(itemTypes)
        .where(eq(itemTypes.id, id))
        .returning();

      return itemType;
    } catch (error) {
      console.error("Error hard deleting item type:", error);
      throw error;
    }
  }

  // Get item types by category
  static async findByCategory(category, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const itemTypeList = await db
        .select()
        .from(itemTypes)
        .where(
          and(
            eq(itemTypes.isActive, true),
            ilike(itemTypes.category, `%${category}%`)
          )
        )
        .orderBy(asc(itemTypes.name))
        .limit(limit)
        .offset(offset);

      return itemTypeList;
    } catch (error) {
      console.error("Error finding item types by category:", error);
      throw error;
    }
  }

  // Get all categories
  static async getCategories() {
    try {
      const categories = await db
        .selectDistinct({ category: itemTypes.category })
        .from(itemTypes)
        .where(
          and(
            eq(itemTypes.isActive, true),
            // Only get non-null categories
            eq(itemTypes.category, itemTypes.category)
          )
        )
        .orderBy(asc(itemTypes.category));

      return categories.map((c) => c.category).filter(Boolean);
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  }
}

module.exports = ItemType;
