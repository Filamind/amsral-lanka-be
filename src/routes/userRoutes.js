const express = require("express");
const UserController = require("../controllers/userController");

const router = express.Router();

// POST /api/users/login - User authentication
router.post("/login", UserController.login);

// GET /api/users - Get all users with pagination
router.get("/", UserController.getUsers);

// GET /api/users/stats - Get user statistics
router.get("/stats", UserController.getUserStats);

// GET /api/users/email/:email - Get user by email
router.get("/email/:email", UserController.getUserByEmail);

// POST /api/users - Create new user
router.post("/", UserController.createUser);

// PUT /api/users/:id - Update user
router.put("/:id", UserController.updateUser);

// DELETE /api/users/:id - Delete user (soft delete)
router.delete("/:id", UserController.deleteUser);

// GET /api/users/:id - Get user by ID (should be last to avoid conflicts)
router.get("/:id", UserController.getUserById);

module.exports = router;
