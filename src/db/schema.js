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

// Item Types table schema
const itemTypes = pgTable("item_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  isActive: boolean("is_active").default(true),
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

// Customer Orders table schema (keeping original)
const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).unique().notNull(),
  customerId: integer("customer_id")
    .references(() => customers.id)
    .notNull(),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  status: varchar("status", { length: 50 }).default("pending"), // pending, processing, completed, cancelled
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Customer Order Lines table schema (keeping original)
const customerOrderLines = pgTable("customer_order_lines", {
  id: serial("id").primaryKey(),
  customerOrderId: integer("customer_order_id")
    .references(() => customerOrders.id)
    .notNull(),
  itemTypeId: integer("item_type_id")
    .references(() => itemTypes.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default("0.00"),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).default(
    "0.00"
  ),
  description: text("description"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Orders table schema (new table)
const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    referenceNo: varchar("reference_no", { length: 50 }).unique().notNull(),
    customerId: varchar("customer_id", { length: 50 }).notNull(),
    itemId: varchar("item_id", { length: 50 }).notNull(),
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
    itemIdIdx: index("idx_item_id").on(table.itemId),
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
    quantity: integer("quantity").notNull(),
    washType: varchar("wash_type", { length: 50 }).notNull(),
    processTypes: json("process_types").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("idx_order_id").on(table.orderId),
    washTypeIdx: index("idx_wash_type").on(table.washType),
  })
);

// Customer Order Line Process table schema (keeping as is for now - this is different from order_records)
const customerOrderLineProcesses = pgTable("customer_order_line_processes", {
  id: serial("id").primaryKey(),
  customerOrderLineId: integer("customer_order_line_id")
    .references(() => customerOrderLines.id)
    .notNull(),
  sequenceNumber: integer("sequence_number").notNull(),
  washingTypeId: integer("washing_type_id").references(() => washingTypes.id),
  dryingTypeId: integer("drying_type_id").references(() => dryingTypes.id),
  processType: varchar("process_type", { length: 20 }).notNull(), // 'washing' or 'drying'
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

module.exports = {
  roles,
  users,
  employees,
  washingTypes,
  dryingTypes,
  machineTypes,
  processTypes,
  customers,
  itemTypes,
  items,
  customerOrders,
  customerOrderLines,
  customerOrderLineProcesses,
  orders,
  orderRecords,
};
