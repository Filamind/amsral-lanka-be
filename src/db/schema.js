const {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  date,
  text,
  integer,
  decimal,
  json,
  index,
  foreignKey,
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
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  isDeleted: boolean("is_deleted").default(false),
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
  isActive: boolean("is_active").default(true),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Washing Types table schema
const washingTypes = pgTable("washing_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Drying Types table schema
const dryingTypes = pgTable("drying_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Machine Types table schema
const machineTypes = pgTable("machine_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Process Types table schema
const processTypes = pgTable("process_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Customers table schema
const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerCode: varchar("customer_code", { length: 50 }).unique().notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
  mapLink: text("map_link"), // Changed from city to map link
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Items table schema
const items = pgTable(
  "items",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_items_name").on(table.name),
  })
);

// Orders table schema (new table)
const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    referenceNo: varchar("reference_no", { length: 50 }).unique().notNull(),
    customerId: varchar("customer_id", { length: 50 }).notNull(),
    quantity: integer("quantity").notNull(),
    notes: text("notes"),
    deliveryDate: date("delivery_date").notNull(),
    status: varchar("status", { length: 20 }).default("Pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    referenceNoIdx: index("idx_reference_no").on(table.referenceNo),
    customerIdIdx: index("idx_customer_id").on(table.customerId),
    statusIdx: index("idx_status").on(table.status),
    dateIdx: index("idx_date").on(table.date),
    deliveryDateIdx: index("idx_delivery_date").on(table.deliveryDate),
  })
);

// Order Records table schema (new table)
const orderRecords = pgTable(
  "order_records",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    itemId: varchar("item_id", { length: 50 }),
    quantity: integer("quantity").notNull(),
    washType: varchar("wash_type", { length: 50 }).notNull(),
    processTypes: json("process_types").notNull(),
    trackingNumber: varchar("tracking_number", { length: 20 }),
    status: varchar("status", { length: 20 }).notNull().default("Pending"), // "Pending", "Complete"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("idx_order_records_order_id").on(table.orderId),
    itemIdIdx: index("idx_order_records_item_id").on(table.itemId),
    washTypeIdx: index("idx_order_records_wash_type").on(table.washType),
    statusIdx: index("idx_order_records_status").on(table.status),
    trackingNumberIdx: index("idx_order_records_tracking_number").on(
      table.trackingNumber
    ),
  })
);

// Machine Assignments table schema
const machineAssignments = pgTable(
  "machine_assignments",
  {
    id: serial("id").primaryKey(),
    recordId: integer("record_id")
      .references(() => orderRecords.id, { onDelete: "cascade" })
      .notNull(),
    orderId: integer("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    assignedById: integer("assigned_by_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    washingMachine: varchar("washing_machine", { length: 50 }),
    dryingMachine: varchar("drying_machine", { length: 50 }),
    trackingNumber: varchar("tracking_number", { length: 20 }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
    status: varchar("status", { length: 20 }).notNull().default("In Progress"), // "In Progress", "Completed", "Cancelled"
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    recordIdIdx: index("idx_assignment_record_id").on(table.recordId),
    orderIdIdx: index("idx_assignment_order_id").on(table.orderId),
    assignedByIdIdx: index("idx_assignment_assigned_by_id").on(
      table.assignedById
    ),
    statusIdx: index("idx_assignment_status").on(table.status),
    trackingNumberIdx: index("idx_assignment_tracking_number").on(
      table.trackingNumber
    ),
  })
);

module.exports = {
  roles,
  users,
  employees,
  washingTypes,
  dryingTypes,
  machineTypes,
  processTypes,
  customers,
  items,
  orders,
  orderRecords,
  machineAssignments,
};
