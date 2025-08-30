const User = require("../models/User");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");
const CustomerOrder = require("../models/CustomerOrder");

class ValidationController {
  // POST /api/validation/check-unique - Check if field value is unique
  static async checkUniqueField(req, res) {
    try {
      const { table, field, value, excludeId } = req.body;

      // Validate required fields
      if (!table || !field || !value) {
        return res.status(400).json({
          success: false,
          message: "Table, field, and value are required",
        });
      }

      // Validate table and field combinations
      const validCombinations = {
        users: ["email"],
        customers: ["customerCode", "email"],
        employees: ["employeeId", "email"],
        orders: ["referenceNo"],
      };

      if (
        !validCombinations[table] ||
        !validCombinations[table].includes(field)
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid table/field combination. Valid combinations: ${JSON.stringify(
            validCombinations
          )}`,
        });
      }

      let isUnique = false;
      let existingRecord = null;

      // Check uniqueness based on table and field
      switch (table) {
        case "users":
          if (field === "email") {
            existingRecord = await User.findByEmail(value);
          }
          break;

        case "customers":
          if (field === "customerCode") {
            existingRecord = await Customer.findByCode(value);
          } else if (field === "email") {
            existingRecord = await Customer.findByEmail(value);
          }
          break;

        case "employees":
          if (field === "employeeId") {
            existingRecord = await Employee.findByEmployeeId(value);
          } else if (field === "email") {
            existingRecord = await Employee.findByEmail(value);
          }
          break;

        case "orders":
          if (field === "referenceNo") {
            existingRecord = await CustomerOrder.findByOrderNumber(value);
          }
          break;
      }

      // If no existing record found, it's unique
      if (!existingRecord) {
        isUnique = true;
      } else if (excludeId && existingRecord.id === parseInt(excludeId)) {
        // If excludeId is provided and matches the existing record, it's unique (for updates)
        isUnique = true;
      } else {
        isUnique = false;
      }

      res.json({
        success: true,
        isUnique,
        message: isUnique ? "Value is unique" : "Value already exists",
      });
    } catch (error) {
      console.error("Error in checkUniqueField:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ValidationController;
