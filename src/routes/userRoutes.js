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

// PUT /api/users/:id/restore - Restore deleted user
router.put("/:id/restore", UserController.restoreUser);

// PUT /api/users/:id/change-password - Change user password
router.put("/:id/change-password", UserController.changePassword);

// PUT /api/users/:id/change-username - Change username
router.put("/:id/change-username", UserController.changeUsername);

// PUT /api/users/:id/change-email - Change email
router.put("/:id/change-email", UserController.changeEmail);

// PUT /api/users/:id/profile - Update user profile (personal details)
router.put("/:id/profile", UserController.updateProfile);

// DELETE /api/users/:id - Delete user (soft delete)
router.delete("/:id", UserController.deleteUser);

// GET /api/users/:id - Get user by ID (should be last to avoid conflicts)
router.get("/:id", UserController.getUserById);

module.exports = router;
