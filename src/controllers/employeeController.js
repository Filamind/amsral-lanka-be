const Employee = require("../models/Employee");

class EmployeeController {
  // GET /api/employees - Get all employees with pagination and filters
  static async getEmployees(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const isDeleted =
        req.query.deleted !== undefined ? req.query.deleted === "true" : false; // Default to false to hide deleted
      const department = req.query.department;
      const position = req.query.position;
      const sortBy = req.query.sortBy || "firstName";
      const sortOrder = req.query.sortOrder || "asc";

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

      const [employees, totalCount] = await Promise.all([
        Employee.findAll({
          limit,
          offset,
          isActive,
          isDeleted,
          department,
          position,
          sortBy,
          sortOrder,
        }),
        Employee.count({ isActive, isDeleted, department, position }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          employees,
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
      console.error("Error in getEmployees:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/:id - Get employee by ID
  static async getEmployeeById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const employee = await Employee.findById(parseInt(id));

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.json({
        success: true,
        data: { employee },
      });
    } catch (error) {
      console.error("Error in getEmployeeById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/employee-id/:employeeId - Get employee by employee ID
  static async getEmployeeByEmployeeId(req, res) {
    try {
      const { employeeId } = req.params;

      if (!employeeId || employeeId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required",
        });
      }

      const employee = await Employee.findByEmployeeId(employeeId.trim());

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.json({
        success: true,
        data: { employee },
      });
    } catch (error) {
      console.error("Error in getEmployeeByEmployeeId:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/email/:email - Get employee by email
  static async getEmployeeByEmail(req, res) {
    try {
      const { email } = req.params;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      const employee = await Employee.findByEmail(email);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      res.json({
        success: true,
        data: { employee },
      });
    } catch (error) {
      console.error("Error in getEmployeeByEmail:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/department/:department - Get employees by department
  static async getEmployeesByDepartment(req, res) {
    try {
      const { department } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : true;

      const offset = (page - 1) * limit;

      if (!department || department.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Department is required",
        });
      }

      const employees = await Employee.findByDepartment(department, {
        limit,
        offset,
        isActive,
      });

      res.json({
        success: true,
        data: { employees },
      });
    } catch (error) {
      console.error("Error in getEmployeesByDepartment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/stats - Get employee statistics
  static async getEmployeeStats(req, res) {
    try {
      const [totalEmployees, activeEmployees, inactiveEmployees] =
        await Promise.all([
          Employee.count(),
          Employee.count({ isActive: true }),
          Employee.count({ isActive: false }),
        ]);

      res.json({
        success: true,
        data: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees,
        },
      });
    } catch (error) {
      console.error("Error in getEmployeeStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/departments - Get all departments
  static async getDepartments(req, res) {
    try {
      const departments = await Employee.getDepartments();

      res.json({
        success: true,
        data: { departments },
      });
    } catch (error) {
      console.error("Error in getDepartments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/employees/positions - Get all positions
  static async getPositions(req, res) {
    try {
      const positions = await Employee.getPositions();

      res.json({
        success: true,
        data: { positions },
      });
    } catch (error) {
      console.error("Error in getPositions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/employees - Create new employee
  static async createEmployee(req, res) {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        hireDate,
        dateOfBirth,
        address,
        emergencyContact,
        isActive = true,
      } = req.body;

      // Validate required fields (employeeId is auto-generated)
      if (!firstName || !lastName || !phone) {
        return res.status(400).json({
          success: false,
          message: "First name, last name, and phone are required",
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      const employeeData = {
        // employeeId will be auto-generated by the database
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email?.trim().toLowerCase() || null,
        phone: phone.trim(),
        department: null, // Set to null since not in payload
        position: null, // Set to null since not in payload
        hireDate: hireDate || null,
        dateOfBirth: dateOfBirth || null,
        address: address?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        isActive,
      };

      const employee = await Employee.create(employeeData);

      res.status(201).json({
        success: true,
        data: { employee },
        message: "Employee created successfully",
      });
    } catch (error) {
      console.error("Error in createEmployee:", error);

      if (error.message.includes("already exists")) {
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

  // PUT /api/employees/:id - Update employee
  static async updateEmployee(req, res) {
    try {
      const { id } = req.params;
      const {
        firstName,
        lastName,
        email,
        phone,
        hireDate,
        dateOfBirth,
        address,
        emergencyContact,
        isActive,
      } = req.body;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      // Check if employee exists
      const existingEmployee = await Employee.findById(parseInt(id));
      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      // Validate email if provided
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: "Invalid email format",
          });
        }
      }

      const employeeData = {};
      // Don't allow updating employeeId as it's auto-generated
      if (firstName !== undefined) employeeData.firstName = firstName.trim();
      if (lastName !== undefined) employeeData.lastName = lastName.trim();
      if (email !== undefined)
        employeeData.email = email?.trim().toLowerCase() || null;
      if (phone !== undefined) employeeData.phone = phone?.trim() || null;
      // Explicitly set department and position to null since they're not in the payload
      employeeData.department = null;
      employeeData.position = null;
      // Handle dates properly - convert empty strings to null
      if (hireDate !== undefined) employeeData.hireDate = hireDate || null;
      if (dateOfBirth !== undefined)
        employeeData.dateOfBirth = dateOfBirth || null;
      if (address !== undefined) employeeData.address = address?.trim() || null;
      if (emergencyContact !== undefined)
        employeeData.emergencyContact = emergencyContact?.trim() || null;
      if (isActive !== undefined) employeeData.isActive = isActive;

      const employee = await Employee.update(parseInt(id), employeeData);

      res.json({
        success: true,
        message: "Employee updated successfully",
        data: { employee },
      });
    } catch (error) {
      console.error("Error in updateEmployee:", error);

      if (error.message.includes("already exists")) {
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

  // DELETE /api/employees/:id - Delete employee (soft delete)
  static async deleteEmployee(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      // Check if employee exists
      const existingEmployee = await Employee.findById(parseInt(id));
      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }

      await Employee.delete(parseInt(id));

      res.json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteEmployee:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = EmployeeController;
