const WashingType = require("../models/WashingType");
const DryingType = require("../models/DryingType");

class ReferenceController {
  // GET /api/reference/wash-types - Get all wash types
  static async getWashTypes(req, res) {
    try {
      const washTypes = await WashingType.findAll({ isActive: true });

      // Transform to match API spec format
      const transformedWashTypes = washTypes.map((washType) => ({
        code: washType.code,
        name: washType.name,
      }));

      res.json({
        success: true,
        data: transformedWashTypes,
      });
    } catch (error) {
      console.error("Error in getWashTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/reference/process-types - Get all process types
  static async getProcessTypes(req, res) {
    try {
      const processTypes = await DryingType.findAll({ isActive: true });

      // Transform to match API spec format
      const transformedProcessTypes = processTypes.map((processType) => ({
        code: processType.code,
        name: processType.name,
      }));

      res.json({
        success: true,
        data: transformedProcessTypes,
      });
    } catch (error) {
      console.error("Error in getProcessTypes:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/reference/machines - Get all machines
  static async getMachines(req, res) {
    try {
      // Static machine data as per requirements
      const machines = {
        washing: [
          { id: "W1", name: "Washing Machine W1" },
          { id: "W2", name: "Washing Machine W2" },
          { id: "W3", name: "Washing Machine W3" },
          { id: "W4", name: "Washing Machine W4" },
          { id: "W5", name: "Washing Machine W5" },
          { id: "W6", name: "Washing Machine W6" },
          { id: "W7", name: "Washing Machine W7" },
          { id: "W8", name: "Washing Machine W8" },
        ],
        drying: [
          { id: "D1", name: "Drying Machine D1" },
          { id: "D2", name: "Drying Machine D2" },
          { id: "D3", name: "Drying Machine D3" },
          { id: "D4", name: "Drying Machine D4" },
          { id: "D5", name: "Drying Machine D5" },
          { id: "D6", name: "Drying Machine D6" },
          { id: "D7", name: "Drying Machine D7" },
          { id: "D8", name: "Drying Machine D8" },
          { id: "D9", name: "Drying Machine D9" },
        ],
      };

      res.json({
        success: true,
        data: machines,
      });
    } catch (error) {
      console.error("Error in getMachines:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ReferenceController;
