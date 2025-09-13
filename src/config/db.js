const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const {
  roles,
  users,
  employees,
  washingTypes,
  dryingTypes,
  customers,
  orders,
  orderRecords,
  machineAssignments,
} = require("../db/schema");
require("dotenv").config();

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Database connection error:", err);
});

// Create Drizzle instance
const db = drizzle(pool, {
  schema: {
    roles,
    users,
    employees,
    washingTypes,
    dryingTypes,
    customers,
    orders,
    orderRecords,
    machineAssignments,
  },
});

module.exports = { db, pool };
