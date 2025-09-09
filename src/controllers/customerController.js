const Customer = require("../models/Customer");

class CustomerController {
  // GET /api/customers - Get all customers with pagination
  static async getCustomers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const search = req.query.search;
      const mapLink = req.query.mapLink;
      const country = req.query.country;
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

      const [customerList, totalCount] = await Promise.all([
        Customer.findAll({
          limit,
          offset,
          isActive,
          search,
          mapLink,
          country,
          sortBy,
          sortOrder,
        }),
        Customer.count({ isActive, search, mapLink, country }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          customers: customerList,
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
      console.error("Error in getCustomers:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/:id - Get customer by ID
  static async getCustomerById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      const customer = await Customer.findById(parseInt(id));

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.json({
        success: true,
        data: { customer },
      });
    } catch (error) {
      console.error("Error in getCustomerById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/code/:code - Get customer by customer code
  static async getCustomerByCode(req, res) {
    try {
      const { code } = req.params;

      if (!code || code.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Customer code is required",
        });
      }

      const customer = await Customer.findByCode(code.trim());

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      res.json({
        success: true,
        data: { customer },
      });
    } catch (error) {
      console.error("Error in getCustomerByCode:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/stats - Get customer statistics
  static async getCustomerStats(req, res) {
    try {
      const [totalCustomers, activeCustomers, inactiveCustomers] =
        await Promise.all([
          Customer.count(),
          Customer.count({ isActive: true }),
          Customer.count({ isActive: false }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalCustomers,
          active: activeCustomers,
          inactive: inactiveCustomers,
        },
      });
    } catch (error) {
      console.error("Error in getCustomerStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/customers - Create new customer
  static async createCustomer(req, res) {
    try {
      const {
        customerCode,
        firstName,
        lastName,
        email,
        phone,
        address,
        mapLink,
        postalCode,
        country,
        dateOfBirth,
        notes,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !phone) {
        return res.status(400).json({
          success: false,
          message: "First name, last name, and phone are required",
        });
      }

      // Generate customer code if not provided
      let finalCustomerCode = customerCode;
      if (!finalCustomerCode) {
        finalCustomerCode = await Customer.generateCustomerCode();
      }

      const customerData = {
        customerCode: finalCustomerCode.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim() || null,
        phone: phone.trim(),
        address: address?.trim() || null,
        mapLink: mapLink?.trim() || null,
        postalCode: postalCode?.trim() || null,
        country: country?.trim() || null,
        dateOfBirth: dateOfBirth || null,
        notes: notes?.trim() || null,
      };

      const customer = await Customer.create(customerData);

      res.status(201).json({
        success: true,
        data: { customer },
        message: "Customer created successfully",
      });
    } catch (error) {
      console.error("Error in createCustomer:", error);

      if (
        error.message === "Customer code already exists" ||
        error.message === "Email already exists"
      ) {
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

  // PUT /api/customers/:id - Update customer
  static async updateCustomer(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      const updateData = { ...req.body };

      // Clean up string fields
      Object.keys(updateData).forEach((key) => {
        if (typeof updateData[key] === "string") {
          updateData[key] = updateData[key].trim() || null;
        }
      });

      const customer = await Customer.update(parseInt(id), updateData);

      res.json({
        success: true,
        data: { customer },
        message: "Customer updated successfully",
      });
    } catch (error) {
      console.error("Error in updateCustomer:", error);

      if (error.message === "Customer not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (
        error.message === "Customer code already exists" ||
        error.message === "Email already exists"
      ) {
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

  // DELETE /api/customers/:id - Delete customer (soft delete)
  static async deleteCustomer(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      const customer = await Customer.delete(parseInt(id));

      res.json({
        success: true,
        data: { customer },
        message: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteCustomer:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/maplink/:maplink - Get customers by map link
  static async getCustomersByMapLink(req, res) {
    try {
      const { maplink } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const customers = await Customer.findByMapLink(maplink, {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: { customers },
      });
    } catch (error) {
      console.error("Error in getCustomersByMapLink:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/country/:country - Get customers by country
  static async getCustomersByCountry(req, res) {
    try {
      const { country } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const customers = await Customer.findByCountry(country, {
        limit,
        offset,
      });

      res.json({
        success: true,
        data: { customers },
      });
    } catch (error) {
      console.error("Error in getCustomersByCountry:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/list - Get all customers in simple format (for dropdowns/selects)
  static async getCustomersList(req, res) {
    try {
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : true;
      const search = req.query.search;

      const customers = await Customer.findAll({
        limit: 1000, // Get all customers for dropdown
        offset: 0,
        isActive,
        search,
        sortBy: "firstName",
        sortOrder: "asc",
      });

      // Format response for frontend dropdowns
      const customersList = customers.map((customer) => ({
        id: customer.customerCode, // Use customerCode as ID for orders
        value: customer.customerCode,
        label: `${customer.firstName} ${customer.lastName}`,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerCode: customer.customerCode,
        email: customer.email,
        phone: customer.phone,
      }));

      res.json({
        success: true,
        data: customersList,
      });
    } catch (error) {
      console.error("Error in getCustomersList:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customers/generate-code - Generate next customer code
  static async generateCustomerCode(req, res) {
    try {
      const customerCode = await Customer.generateCustomerCode();

      res.json({
        success: true,
        data: { customerCode },
      });
    } catch (error) {
      console.error("Error in generateCustomerCode:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = CustomerController;
