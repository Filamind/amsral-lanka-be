const express = require("express");
const RecordController = require("../controllers/recordController");

const router = express.Router();

// GET /api/records/:id - Get single record details
router.get("/:id", RecordController.getRecordById);

module.exports = router;
