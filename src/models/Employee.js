const { db } = require("../config/db");
const { employees } = require("../db/schema");
const { eq, desc, asc, count, like, and } = require("drizzle-orm");

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
    this.hireDate = employeeData.hireDate || employeeData.hire_date;
    this.dateOfBirth = employeeData.dateOfBirth || employeeData.date_of_birth;
    this.address = employeeData.address;
    this.emergencyContact =
      employeeData.emergencyContact || employeeData.emergency_contact;
    this.isActive =
      employeeData.isActive !== undefined
        ? employeeData.isActive
        : employeeData.is_active;
    this.isDeleted =
      employeeData.isDeleted !== undefined
        ? employeeData.isDeleted
        : employeeData.is_deleted;
    this.createdAt = employeeData.createdAt || employeeData.created_at;
    this.updatedAt = employeeData.updatedAt || employeeData.updated_at;
  }

  // Get all employees
  static async findAll(options = {}) {
    const {
      limit = 50,
      offset = 0,
      isActive = null, // Keep isActive separate from deletion
      isDeleted = false, // Default to false to only show non-deleted employees
      department = null,
      position = null,
      sortBy = "firstName",
      sortOrder = "asc",
    } = options;

    try {
      let query = db.select().from(employees);

      // Build where conditions
      const conditions = [];
      // Always filter by isDeleted unless explicitly requested
      if (isDeleted !== null) {
        conditions.push(eq(employees.isDeleted, isDeleted));
      }
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

      // Build order by - for firstName, also sort by lastName for proper alphabetical order
      let orderBy;
      if (sortBy === "firstName") {
        orderBy =
          sortOrder === "asc"
            ? [asc(employees.firstName), asc(employees.lastName)]
            : [desc(employees.firstName), desc(employees.lastName)];
      } else {
        orderBy =
          sortOrder === "asc"
            ? asc(employees[sortBy])
            : desc(employees[sortBy]);
      }

      const result = await query
        .orderBy(...(Array.isArray(orderBy) ? orderBy : [orderBy]))
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
    const {
      isActive = null,
      isDeleted = false, // Default to false to only count non-deleted employees
      department = null,
      position = null,
    } = options;

    try {
      let query = db.select({ count: count() }).from(employees);

      // Build where conditions
      const conditions = [];
      // Always filter by isDeleted unless explicitly requested
      if (isDeleted !== null) {
        conditions.push(eq(employees.isDeleted, isDeleted));
      }
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
      firstName,
      lastName,
      email,
      phone = null,
      department = null,
      position = null,
      hireDate = null,
      dateOfBirth = null,
      address = null,
      emergencyContact = null,
      isActive = true,
    } = employeeData;

    try {
      // Generate auto-increment employeeId
      const lastEmployee = await db
        .select({ employeeId: employees.employeeId })
        .from(employees)
        .orderBy(desc(employees.id)) // Order by id instead of employeeId
        .limit(1);

      let nextEmployeeId;
      if (lastEmployee.length > 0) {
        const lastId = lastEmployee[0].employeeId;
        // Try to parse the numeric part of the employeeId
        const numericPart = parseInt(lastId.replace(/\D/g, "")) || 1000;
        nextEmployeeId = (numericPart + 1).toString();
      } else {
        nextEmployeeId = "1001"; // Start from 1001 if no employees exist
      }

      const result = await db
        .insert(employees)
        .values({
          employeeId: nextEmployeeId,
          firstName,
          lastName,
          email,
          phone,
          department,
          position,
          hireDate,
          dateOfBirth,
          address,
          emergencyContact,
          isActive,
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

  // Static method to update employee by ID
  static async update(id, updateData) {
    try {
      const employee = await Employee.findById(id);
      if (!employee) {
        throw new Error("Employee not found");
      }

      const allowedFields = [
        "employeeId",
        "firstName",
        "lastName",
        "email",
        "phone",
        "department",
        "position",
        "hireDate",
        "dateOfBirth",
        "address",
        "emergencyContact",
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

      const result = await db
        .update(employees)
        .set(updateValues)
        .where(eq(employees.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Employee not found");
      }

      return new Employee(result[0]);
    } catch (error) {
      if (error.code === "23505") {
        // Unique violation
        if (error.constraint?.includes("email")) {
          throw new Error("Email already exists");
        }
        if (error.constraint?.includes("employee_id")) {
          throw new Error("Employee ID already exists");
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

  // Static method to delete employee by ID
  static async delete(id) {
    try {
      const result = await db
        .update(employees)
        .set({ isDeleted: true })
        .where(eq(employees.id, id))
        .returning();

      if (result.length === 0) {
        throw new Error("Employee not found");
      }
      return true;
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
