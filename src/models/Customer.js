const { eq, and, or, ilike, count, asc, desc } = require("drizzle-orm");
const { db } = require("../config/db");
const { customers } = require("../db/schema");

class Customer {
  // Create a new customer
  static async create(customerData) {
    try {
      // Check if customer code already exists
      const existingCustomer = await this.findByCode(customerData.customerCode);
      if (existingCustomer) {
        throw new Error("Customer code already exists");
      }

      // Check if email already exists (if provided)
      if (customerData.email) {
        const existingEmail = await this.findByEmail(customerData.email);
        if (existingEmail) {
          throw new Error("Email already exists");
        }
      }

      const [customer] = await db
        .insert(customers)
        .values({
          ...customerData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return customer;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  // Find customer by ID
  static async findById(id) {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.id, id), eq(customers.isDeleted, false)))
        .limit(1);

      return customer || null;
    } catch (error) {
      console.error("Error finding customer by ID:", error);
      throw error;
    }
  }

  // Find customer by customer code
  static async findByCode(customerCode) {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.customerCode, customerCode),
            eq(customers.isDeleted, false)
          )
        )
        .limit(1);

      return customer || null;
    } catch (error) {
      console.error("Error finding customer by code:", error);
      throw error;
    }
  }

  // Find customer by email
  static async findByEmail(email) {
    try {
      const [customer] = await db
        .select()
        .from(customers)
        .where(and(eq(customers.email, email), eq(customers.isDeleted, false)))
        .limit(1);

      return customer || null;
    } catch (error) {
      console.error("Error finding customer by email:", error);
      throw error;
    }
  }

  // Find all customers with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        isActive = null,
        search = null,
        mapLink = null,
        country = null,
        sortBy = "firstName",
        sortOrder = "asc",
      } = options;

      // Build where conditions
      const conditions = [];

      // Always filter out deleted customers
      conditions.push(eq(customers.isDeleted, false));

      if (isActive !== null) {
        conditions.push(eq(customers.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customers.firstName, `%${search}%`),
            ilike(customers.lastName, `%${search}%`),
            ilike(customers.customerCode, `%${search}%`),
            ilike(customers.email, `%${search}%`),
            ilike(customers.phone, `%${search}%`)
          )
        );
      }

      if (mapLink) {
        conditions.push(ilike(customers.mapLink, `%${mapLink}%`));
      }

      if (country) {
        conditions.push(ilike(customers.country, `%${country}%`));
      }

      // Build order by - for firstName, also sort by lastName for proper alphabetical order
      let orderBy;
      if (sortBy === "firstName") {
        orderBy =
          sortOrder === "asc"
            ? [asc(customers.firstName), asc(customers.lastName)]
            : [desc(customers.firstName), desc(customers.lastName)];
      } else {
        orderBy =
          sortOrder === "asc"
            ? asc(customers[sortBy])
            : desc(customers[sortBy]);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const customerList = await db
        .select()
        .from(customers)
        .where(whereClause)
        .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
        .limit(limit)
        .offset(offset);

      return customerList;
    } catch (error) {
      console.error("Error finding customers:", error);
      throw error;
    }
  }

  // Count customers with filtering
  static async count(options = {}) {
    try {
      const {
        isActive = null,
        search = null,
        mapLink = null,
        country = null,
      } = options;

      // Build where conditions
      const conditions = [];

      // Always filter out deleted customers
      conditions.push(eq(customers.isDeleted, false));

      if (isActive !== null) {
        conditions.push(eq(customers.isActive, isActive));
      }

      if (search) {
        conditions.push(
          or(
            ilike(customers.firstName, `%${search}%`),
            ilike(customers.lastName, `%${search}%`),
            ilike(customers.customerCode, `%${search}%`),
            ilike(customers.email, `%${search}%`),
            ilike(customers.phone, `%${search}%`)
          )
        );
      }

      if (mapLink) {
        conditions.push(ilike(customers.mapLink, `%${mapLink}%`));
      }

      if (country) {
        conditions.push(ilike(customers.country, `%${country}%`));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [result] = await db
        .select({ count: count() })
        .from(customers)
        .where(whereClause);

      return result.count;
    } catch (error) {
      console.error("Error counting customers:", error);
      throw error;
    }
  }

  // Update customer
  static async update(id, updateData) {
    try {
      // Check if customer exists
      const existingCustomer = await this.findById(id);
      if (!existingCustomer) {
        throw new Error("Customer not found");
      }

      // Check if customer code already exists (if being updated)
      if (
        updateData.customerCode &&
        updateData.customerCode !== existingCustomer.customerCode
      ) {
        const existingCode = await this.findByCode(updateData.customerCode);
        if (existingCode) {
          throw new Error("Customer code already exists");
        }
      }

      // Check if email already exists (if being updated)
      if (updateData.email && updateData.email !== existingCustomer.email) {
        const existingEmail = await this.findByEmail(updateData.email);
        if (existingEmail) {
          throw new Error("Email already exists");
        }
      }

      const [customer] = await db
        .update(customers)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning();

      return customer;
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  }

  // Delete customer (soft delete)
  static async delete(id) {
    try {
      const [customer] = await db
        .update(customers)
        .set({
          isDeleted: true,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, id))
        .returning();

      return customer;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  }

  // Hard delete customer
  static async hardDelete(id) {
    try {
      const [customer] = await db
        .delete(customers)
        .where(eq(customers.id, id))
        .returning();

      return customer;
    } catch (error) {
      console.error("Error hard deleting customer:", error);
      throw error;
    }
  }

  // Generate next customer code
  static async generateCustomerCode() {
    try {
      // Find the latest customer code
      const [latestCustomer] = await db
        .select({ customerCode: customers.customerCode })
        .from(customers)
        .where(
          and(
            ilike(customers.customerCode, "CUST-%"),
            eq(customers.isDeleted, false)
          )
        )
        .orderBy(desc(customers.customerCode))
        .limit(1);

      if (!latestCustomer) {
        return "CUST-001";
      }

      // Extract number and increment
      const match = latestCustomer.customerCode.match(/CUST-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `CUST-${nextNumber.toString().padStart(3, "0")}`;
      }

      return "CUST-001";
    } catch (error) {
      console.error("Error generating customer code:", error);
      throw error;
    }
  }

  // Get customers by map link
  static async findByMapLink(mapLink, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const customerList = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.isActive, true),
            eq(customers.isDeleted, false),
            ilike(customers.mapLink, `%${mapLink}%`)
          )
        )
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      return customerList;
    } catch (error) {
      console.error("Error finding customers by map link:", error);
      throw error;
    }
  }

  // Get customers by country
  static async findByCountry(country, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const customerList = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.isActive, true),
            eq(customers.isDeleted, false),
            ilike(customers.country, `%${country}%`)
          )
        )
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      return customerList;
    } catch (error) {
      console.error("Error finding customers by country:", error);
      throw error;
    }
  }
}

module.exports = Customer;
