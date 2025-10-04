const express = require("express");
const MachineAssignmentController = require("../controllers/machineAssignmentController");

const router = express.Router();

// GET /api/records/:recordId/assignments - Get machine assignments for a record
router.get(
  "/:recordId/assignments",
  MachineAssignmentController.getRecordAssignments
);

// POST /api/records/:recordId/assignments - Create machine assignment
router.post(
  "/:recordId/assignments",
  MachineAssignmentController.createAssignment
);

// PUT /api/records/:recordId/assignments/:assignmentId/completion - Update assignment completion status
router.put(
  "/:recordId/assignments/:assignmentId/completion",
  MachineAssignmentController.completeAssignment
);

// PUT /api/records/:recordId/assignments/:assignmentId - Update machine assignment
router.put(
  "/:recordId/assignments/:assignmentId",
  MachineAssignmentController.updateAssignment
);

// DELETE /api/records/:recordId/assignments/:assignmentId - Delete machine assignment
router.delete(
  "/:recordId/assignments/:assignmentId",
  MachineAssignmentController.deleteAssignment
);

// GET /api/records/:recordId/assignments/stats - Get assignment statistics
router.get(
  "/:recordId/assignments/stats",
  MachineAssignmentController.getAssignmentStats
);

// GET /api/assignments - Get all machine assignments with pagination (non-completed only)
router.get("/assignments", MachineAssignmentController.getAllAssignments);

// GET /api/machines - Get available machines
router.get("/machines", MachineAssignmentController.getMachines);

module.exports = router;
