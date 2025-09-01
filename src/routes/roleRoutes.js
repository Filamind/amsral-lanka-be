const express = require("express");
const RoleController = require("../controllers/roleController");

const router = express.Router();

// GET /api/roles - Get all roles with pagination
router.get("/", RoleController.getRoles);

// GET /api/roles/map - Get roles as id-name map for dropdowns
router.get("/map", RoleController.getRoleMap);

// GET /api/roles/stats - Get role statistics
router.get("/stats", RoleController.getRoleStats);

// GET /api/roles/predefined - Get predefined roles
router.get("/predefined", RoleController.getPredefinedRoles);

// GET /api/roles/name/:name - Get role by name
router.get("/name/:name", RoleController.getRoleByName);

// POST /api/roles - Create new role
router.post("/", RoleController.createRole);

// GET /api/roles/:id - Get role by ID (should be last to avoid conflicts)
router.get("/:id", RoleController.getRoleById);

module.exports = router;
