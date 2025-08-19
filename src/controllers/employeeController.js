const Employee = require("../models/Employee");

class EmployeeController {
  // GET /api/employees - Get all employees with pagination and filters
  static async getEmployees(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const department = req.query.department;
      const position = req.query.position;

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
        Employee.findAll({ limit, offset, isActive, department, position }),
        Employee.count({ isActive, department, position }),
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
        employeeId,
        firstName,
        lastName,
        email,
        phone,
        department,
        position,
        salary,
        hireDate,
        dateOfBirth,
        address,
        emergencyContact,
        emergencyPhone,
      } = req.body;

      // Validate required fields
      if (!employeeId || !firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          message: "Employee ID, first name, last name, and email are required",
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
        employeeId: employeeId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        position: position?.trim() || null,
        salary: salary?.trim() || null,
        hireDate: hireDate || null,
        dateOfBirth: dateOfBirth || null,
        address: address?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        emergencyPhone: emergencyPhone?.trim() || null,
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
}

module.exports = EmployeeController;
