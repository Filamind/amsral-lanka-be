class ProductionController {
  // GET /api/production/records - Get all production records
  static async getProductionRecords(req, res) {
    try {
      const status = req.query.status || null;
      const search = req.query.search || null;

      // Get all order lines with their order and customer details
      const records = await CustomerOrderLine.findAllWithDetails({
        status,
        search,
        includeProcesses: true,
      });

      // Transform data to match API spec
      const transformedRecords = records.map((record) => ({
        id: `${record.customerOrderId}-${record.id}`, // Composite ID
        orderId: record.customerOrderId,
        orderRef: record.orderNumber || record.referenceNo,
        customerName: record.customerName,
        item: record.itemType || record.item,
        quantity: record.quantity,
        remainingQuantity: record.remainingQuantity || record.quantity,
        washType: record.washingType,
        processTypes: record.processes
          ? record.processes.map((p) => p.processType)
          : [],
        status: record.status || "pending",
      }));

      res.json({
        success: true,
        data: transformedRecords,
      });
    } catch (error) {
      console.error("Error in getProductionRecords:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // GET /api/production/assignments - Get machine assignments
  static async getMachineAssignments(req, res) {
    try {
      // Get all processes with machine assignments
      const assignments =
        await CustomerOrderLineProcess.findAllWithMachineAssignments();

      // Transform data to match API spec
      const transformedAssignments = assignments.map((assignment) => ({
        id: assignment.id.toString(),
        recordId: `${assignment.customerOrderId}-${assignment.customerOrderLineId}`,
        orderRef: assignment.orderNumber || assignment.referenceNo,
        customerName: assignment.customerName,
        item: assignment.itemType || assignment.item,
        assignedBy: assignment.assignedByName,
        assignedById: assignment.assignedBy,
        quantity: assignment.quantity,
        washingMachine: assignment.washingMachine,
        dryingMachine: assignment.dryingMachine,
        assignedAt: assignment.assignedAt || assignment.createdAt,
      }));

      res.json({
        success: true,
        data: transformedAssignments,
      });
    } catch (error) {
      console.error("Error in getMachineAssignments:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // POST /api/production/assignments - Create machine assignment
  static async createMachineAssignment(req, res) {
    try {
      const {
        recordId,
        assignedById,
        quantity,
        washingMachine,
        dryingMachine,
      } = req.body;

      // Validate required fields
      if (
        !recordId ||
        !assignedById ||
        !quantity ||
        !washingMachine ||
        !dryingMachine
      ) {
        return res.status(400).json({
          success: false,
          message:
            "recordId, assignedById, quantity, washingMachine, and dryingMachine are required",
        });
      }

      // Validate machine IDs
      const validWashingMachines = [
        "W1",
        "W2",
        "W3",
        "W4",
        "W5",
        "W6",
        "W7",
        "W8",
      ];
      const validDryingMachines = [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5",
        "D6",
        "D7",
        "D8",
        "D9",
      ];

      if (!validWashingMachines.includes(washingMachine)) {
        return res.status(400).json({
          success: false,
          message: "Invalid washing machine. Must be W1-W8",
        });
      }

      if (!validDryingMachines.includes(dryingMachine)) {
        return res.status(400).json({
          success: false,
          message: "Invalid drying machine. Must be D1-D9",
        });
      }

      // Parse recordId to get order and line IDs
      const [customerOrderId, customerOrderLineId] = recordId.split("-");

      if (!customerOrderId || !customerOrderLineId) {
        return res.status(400).json({
          success: false,
          message: "Invalid recordId format. Expected format: orderId-lineId",
        });
      }

      // Check if the order line exists
      const orderLine = await CustomerOrderLine.findById(
        parseInt(customerOrderLineId)
      );
      if (!orderLine) {
        return res.status(404).json({
          success: false,
          message: "Order line not found",
        });
      }

      // Check if there's enough remaining quantity
      const remainingQuantity =
        orderLine.remainingQuantity || orderLine.quantity;
      if (quantity > remainingQuantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot assign ${quantity} items. Only ${remainingQuantity} remaining.`,
        });
      }

      // Create the process assignment
      const processData = {
        customerOrderLineId: parseInt(customerOrderLineId),
        processType: "assignment", // You might want to make this configurable
        sequenceNumber: 1, // You might want to calculate this
        quantity,
        assignedBy: parseInt(assignedById),
        washingMachine,
        dryingMachine,
        status: "assigned",
        assignedAt: new Date().toISOString(),
      };

      const process = await CustomerOrderLineProcess.create(processData);

      // Update remaining quantity in order line
      const newRemainingQuantity = remainingQuantity - quantity;
      await CustomerOrderLine.updateRemainingQuantity(
        parseInt(customerOrderLineId),
        newRemainingQuantity
      );

      // Mark as completed if remaining quantity is 0
      if (newRemainingQuantity === 0) {
        await CustomerOrderLine.updateStatus(
          parseInt(customerOrderLineId),
          "completed"
        );
      }

      res.status(201).json({
        success: true,
        message: "Machine assignment created successfully",
        data: {
          id: process.id.toString(),
          recordId,
          remainingQuantity: newRemainingQuantity,
        },
      });
    } catch (error) {
      console.error("Error in createMachineAssignment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = ProductionController;
