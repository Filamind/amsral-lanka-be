const CustomerOrderLineProcess = require("../models/CustomerOrderLineProcess");

class CustomerOrderLineProcessController {
  // GET /api/customer-order-line-processes - Get all customer order line processes with pagination
  static async getCustomerOrderLineProcesses(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const isActive =
        req.query.active !== undefined ? req.query.active === "true" : null;
      const search = req.query.search;
      const customerOrderLineId = req.query.customerOrderLineId
        ? parseInt(req.query.customerOrderLineId)
        : null;
      const processType = req.query.processType;
      const status = req.query.status;
      const sortBy = req.query.sortBy || "sequenceNumber";
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

      const [processes, totalCount] = await Promise.all([
        CustomerOrderLineProcess.findAll({
          limit,
          offset,
          isActive,
          search,
          customerOrderLineId,
          processType,
          status,
          sortBy,
          sortOrder,
        }),
        CustomerOrderLineProcess.count({
          isActive,
          search,
          customerOrderLineId,
          processType,
          status,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          processes,
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
      console.error("Error in getCustomerOrderLineProcesses:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-order-line-processes/:id - Get customer order line process by ID
  static async getCustomerOrderLineProcessById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line process ID",
        });
      }

      const process = await CustomerOrderLineProcess.findById(parseInt(id));

      if (!process) {
        return res.status(404).json({
          success: false,
          message: "Customer order line process not found",
        });
      }

      res.json({
        success: true,
        data: { process },
      });
    } catch (error) {
      console.error("Error in getCustomerOrderLineProcessById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/customer-order-line-processes - Create new customer order line process
  static async createCustomerOrderLineProcess(req, res) {
    try {
      const {
        customerOrderLineId,
        sequenceNumber,
        processType,
        washingTypeId,
        dryingTypeId,
        notes,
      } = req.body;

      // Validate required fields
      if (!customerOrderLineId || !processType) {
        return res.status(400).json({
          success: false,
          message: "Customer order line ID and process type are required",
        });
      }

      // Generate sequence number if not provided
      let finalSequenceNumber = sequenceNumber;
      if (!finalSequenceNumber) {
        finalSequenceNumber =
          await CustomerOrderLineProcess.getNextSequenceNumber(
            parseInt(customerOrderLineId)
          );
      }

      const processData = {
        customerOrderLineId: parseInt(customerOrderLineId),
        sequenceNumber: parseInt(finalSequenceNumber),
        processType: processType.trim(),
        washingTypeId: washingTypeId ? parseInt(washingTypeId) : null,
        dryingTypeId: dryingTypeId ? parseInt(dryingTypeId) : null,
        notes: notes?.trim() || null,
      };

      const process = await CustomerOrderLineProcess.create(processData);

      res.status(201).json({
        success: true,
        data: { process },
        message: "Customer order line process created successfully",
      });
    } catch (error) {
      console.error("Error in createCustomerOrderLineProcess:", error);

      if (
        error.message.includes("Process type must be") ||
        error.message.includes("type ID is required")
      ) {
        return res.status(400).json({
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

  // PUT /api/customer-order-line-processes/:id - Update customer order line process
  static async updateCustomerOrderLineProcess(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line process ID",
        });
      }

      const updateData = { ...req.body };

      // Clean up string fields
      Object.keys(updateData).forEach((key) => {
        if (typeof updateData[key] === "string") {
          updateData[key] = updateData[key].trim() || null;
        }
      });

      const process = await CustomerOrderLineProcess.update(
        parseInt(id),
        updateData
      );

      res.json({
        success: true,
        data: { process },
        message: "Customer order line process updated successfully",
      });
    } catch (error) {
      console.error("Error in updateCustomerOrderLineProcess:", error);

      if (error.message === "Customer order line process not found") {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Process type must be")) {
        return res.status(400).json({
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

  // DELETE /api/customer-order-line-processes/:id - Delete customer order line process (soft delete)
  static async deleteCustomerOrderLineProcess(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line process ID",
        });
      }

      const process = await CustomerOrderLineProcess.delete(parseInt(id));

      res.json({
        success: true,
        data: { process },
        message: "Customer order line process deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteCustomerOrderLineProcess:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/customer-order-line-processes/order-line/:customerOrderLineId - Get processes by order line
  static async getProcessesByOrderLine(req, res) {
    try {
      const { customerOrderLineId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const processes = await CustomerOrderLineProcess.findByCustomerOrderLine(
        parseInt(customerOrderLineId),
        { limit, offset }
      );

      res.json({
        success: true,
        data: { processes },
      });
    } catch (error) {
      console.error("Error in getProcessesByOrderLine:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/customer-order-line-processes/:id/start - Start process
  static async startProcess(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line process ID",
        });
      }

      const process = await CustomerOrderLineProcess.startProcess(parseInt(id));

      res.json({
        success: true,
        data: { process },
        message: "Process started successfully",
      });
    } catch (error) {
      console.error("Error in startProcess:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // PUT /api/customer-order-line-processes/:id/complete - Complete process
  static async completeProcess(req, res) {
    try {
      const { id } = req.params;

      // Validate ID is a number
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer order line process ID",
        });
      }

      const process = await CustomerOrderLineProcess.completeProcess(
        parseInt(id)
      );

      res.json({
        success: true,
        data: { process },
        message: "Process completed successfully",
      });
    } catch (error) {
      console.error("Error in completeProcess:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/customer-order-line-processes/bulk - Bulk create processes
  static async bulkCreateProcesses(req, res) {
    try {
      const { processes } = req.body;

      // Validate processes array
      if (!Array.isArray(processes) || processes.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Processes array is required and must not be empty",
        });
      }

      // Validate each process
      for (const process of processes) {
        if (!process.customerOrderLineId || !process.processType) {
          return res.status(400).json({
            success: false,
            message:
              "Each process must have customerOrderLineId and processType",
          });
        }
      }

      const createdProcesses = await CustomerOrderLineProcess.bulkCreate(
        processes
      );

      res.status(201).json({
        success: true,
        data: { processes: createdProcesses },
        message: `${createdProcesses.length} processes created successfully`,
      });
    } catch (error) {
      console.error("Error in bulkCreateProcesses:", error);

      if (
        error.message.includes("Process type must be") ||
        error.message.includes("type ID is required")
      ) {
        return res.status(400).json({
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

module.exports = CustomerOrderLineProcessController;
