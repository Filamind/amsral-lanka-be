const {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  date,
  text,
  integer,
} = require("drizzle-orm/pg-core");

// Roles table schema
const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Users table schema
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Employees table schema
const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: varchar("employee_id", { length: 50 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  hireDate: date("hire_date"),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  emergencyContact: varchar("emergency_contact", { length: 100 }),
  emergencyPhone: varchar("emergency_phone", { length: 20 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

module.exports = {
  roles,
  users,
  employees,
};
