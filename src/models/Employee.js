const { db } = require("../config/db");
const { employees } = require("../db/schema");
const { eq, desc, count, like, and } = require("drizzle-orm");

class Employee {
  constructor(employeeData) {
    this.id = employeeData.id;
    this.employeeId = employeeData.employeeId || employeeData.employee_id;
    this.firstName = employeeData.firstName || employeeData.first_name;
    this.lastName = employeeData.lastName || employeeData.last_name;
    this.email = employeeData.email;
    this.phone = employeeData.phone;
    this.department = employeeData.department;
    this.position = employeeData.position;
    this.salary = employeeData.salary;
    this.hireDate = employeeData.hireDate || employeeData.hire_date;
    this.dateOfBirth = employeeData.dateOfBirth || employeeData.date_of_birth;
    this.address = employeeData.address;
    this.emergencyContact =
      employeeData.emergencyContact || employeeData.emergency_contact;
    this.emergencyPhone =
      employeeData.emergencyPhone || employeeData.emergency_phone;
    this.isActive =
      employeeData.isActive !== undefined
        ? employeeData.isActive
        : employeeData.is_active;
    this.createdAt = employeeData.createdAt || employeeData.created_at;
    this.updatedAt = employeeData.updatedAt || employeeData.updated_at;
  }

  // Get all employees
  static async findAll(options = {}) {
    const {
      limit = 50,
      offset = 0,
      isActive = null,
      department = null,
      position = null,
    } = options;

    try {
      let query = db.select().from(employees);

      // Build where conditions
      const conditions = [];
      if (isActive !== null) {
        conditions.push(eq(employees.isActive, isActive));
      }
      if (department) {
        conditions.push(like(employees.department, `%${department}%`));
      }
      if (position) {
        conditions.push(like(employees.position, `%${position}%`));
      }

      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(
          conditions.length === 1 ? conditions[0] : and(...conditions)
        );
      }

      const result = await query
        .orderBy(desc(employees.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map((row) => new Employee(row));
    } catch (error) {
      throw new Error(`Error fetching employees: ${error.message}`);
    }
  }

  // Get employee by ID
  static async findById(id) {
    try {
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id));
      if (result.length === 0) {
        return null;
      }
      return new Employee(result[0]);
    } catch (error) {
      throw new Error(`Error fetching employee: ${error.message}`);
    }
  }

  // Get employee by employee ID
  static async findByEmployeeId(employeeId) {
    try {
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.employeeId, employeeId));
      if (result.length === 0) {
        return null;
      }
      return new Employee(result[0]);
    } catch (error) {
      throw new Error(`Error fetching employee: ${error.message}`);
    }
  }

  // Get employee by email
  static async findByEmail(email) {
    try {
      const result = await db
        .select()
        .from(employees)
        .where(eq(employees.email, email));
      if (result.length === 0) {
        return null;
      }
      return new Employee(result[0]);
    } catch (error) {
      throw new Error(`Error fetching employee: ${error.message}`);
    }
  }

  // Count total employees
  static async count(options = {}) {
    const { isActive = null, department = null, position = null } = options;

    try {
      let query = db.select({ count: count() }).from(employees);

      // Build where conditions
      const conditions = [];
      if (isActive !== null) {
        conditions.push(eq(employees.isActive, isActive));
      }
      if (department) {
        conditions.push(like(employees.department, `%${department}%`));
      }
      if (position) {
        conditions.push(like(employees.position, `%${position}%`));
      }

      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(
          conditions.length === 1 ? conditions[0] : and(...conditions)
        );
      }

      const result = await query;
      return result[0].count;
    } catch (error) {
      throw new Error(`Error counting employees: ${error.message}`);
    }
  }

  // Create new employee
  static async create(employeeData) {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone = null,
      department = null,
      position = null,
      salary = null,
      hireDate = null,
      dateOfBirth = null,
      address = null,
      emergencyContact = null,
      emergencyPhone = null,
    } = employeeData;

    try {
      const result = await db
        .insert(employees)
        .values({
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
        })
        .returning();

      return new Employee(result[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        if (error.constraint?.includes("employee_id")) {
          throw new Error("Employee ID already exists");
        }
        if (error.constraint?.includes("email")) {
          throw new Error("Email already exists");
        }
        throw new Error("Duplicate entry found");
      }
      throw new Error(`Error creating employee: ${error.message}`);
    }
  }

  // Update employee
  async update(updateData) {
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "department",
      "position",
      "salary",
      "hireDate",
      "dateOfBirth",
      "address",
      "emergencyContact",
      "emergencyPhone",
      "isActive",
    ];
    const updateValues = {};

    // Map the allowed fields
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updateValues[key] = value;
      }
    }

    if (Object.keys(updateValues).length === 0) {
      throw new Error("No valid fields to update");
    }

    try {
      const result = await db
        .update(employees)
        .set(updateValues)
        .where(eq(employees.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Employee not found");
      }

      // Update current instance
      const updatedEmployee = new Employee(result[0]);
      Object.assign(this, updatedEmployee);
      return this;
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        if (error.constraint?.includes("email")) {
          throw new Error("Email already exists");
        }
        throw new Error("Duplicate entry found");
      }
      throw new Error(`Error updating employee: ${error.message}`);
    }
  }

  // Delete employee (soft delete by setting is_active to false)
  async delete() {
    try {
      const result = await db
        .update(employees)
        .set({ isActive: false })
        .where(eq(employees.id, this.id))
        .returning();

      if (result.length === 0) {
        throw new Error("Employee not found");
      }
      this.isActive = false;
      return this;
    } catch (error) {
      throw new Error(`Error deleting employee: ${error.message}`);
    }
  }

  // Get employees by department
  static async findByDepartment(department, options = {}) {
    const { limit = 50, offset = 0, isActive = true } = options;

    try {
      let query = db
        .select()
        .from(employees)
        .where(like(employees.department, `%${department}%`));

      if (isActive !== null) {
        query = query.where(eq(employees.isActive, isActive));
      }

      const result = await query
        .orderBy(desc(employees.createdAt))
        .limit(limit)
        .offset(offset);

      return result.map((row) => new Employee(row));
    } catch (error) {
      throw new Error(
        `Error fetching employees by department: ${error.message}`
      );
    }
  }

  // Get unique departments
  static async getDepartments() {
    try {
      const result = await db
        .selectDistinct({ department: employees.department })
        .from(employees)
        .where(eq(employees.isActive, true));

      return result
        .filter((row) => row.department) // Filter out null departments
        .map((row) => row.department)
        .sort();
    } catch (error) {
      throw new Error(`Error fetching departments: ${error.message}`);
    }
  }

  // Get unique positions
  static async getPositions() {
    try {
      const result = await db
        .selectDistinct({ position: employees.position })
        .from(employees)
        .where(eq(employees.isActive, true));

      return result
        .filter((row) => row.position) // Filter out null positions
        .map((row) => row.position)
        .sort();
    } catch (error) {
      throw new Error(`Error fetching positions: ${error.message}`);
    }
  }
}

module.exports = Employee;
