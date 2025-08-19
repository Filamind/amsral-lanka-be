const express = require("express");
const UserController = require("../controllers/userController");

const router = express.Router();

// GET /api/users - Get all users with pagination
router.get("/", UserController.getUsers);

// GET /api/users/stats - Get user statistics
router.get("/stats", UserController.getUserStats);

// GET /api/users/email/:email - Get user by email
router.get("/email/:email", UserController.getUserByEmail);

// GET /api/users/:id - Get user by ID
router.get("/:id", UserController.getUserById);

module.exports = router;
