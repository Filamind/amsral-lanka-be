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
  incrementNumber: integer("increment_number").default(0), // Counter for invoice numbers
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
    code: varchar("code", { length: 50 }).unique(), // Item code - optional
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameIdx: index("idx_items_name").on(table.name),
    codeIdx: index("idx_items_code").on(table.code),
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
    billingStatus: varchar("billing_status", { length: 20 }).default("pending"), // "pending", "invoiced", "paid"
    amount: decimal("amount", { precision: 10, scale: 2 }).default("0.00"),
    isPaid: boolean("is_paid").default(false),
    gpNo: varchar("gp_no", { length: 100 }), // GP Number - optional
    invoiceNo: varchar("invoice_no", { length: 100 }), // Invoice Number - generated
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    referenceNoIdx: index("idx_reference_no").on(table.referenceNo),
    customerIdIdx: index("idx_customer_id").on(table.customerId),
    statusIdx: index("idx_status").on(table.status),
    billingStatusIdx: index("idx_billing_status").on(table.billingStatus),
    dateIdx: index("idx_date").on(table.date),
    deliveryDateIdx: index("idx_delivery_date").on(table.deliveryDate),
    gpNoIdx: index("idx_gp_no").on(table.gpNo),
    invoiceNoIdx: index("idx_invoice_no").on(table.invoiceNo),
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
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).default(
      "0.00"
    ),
    isPaid: boolean("is_paid").default(false),
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

// Invoices table schema
const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).unique().notNull(),
    customerId: varchar("customer_id", { length: 50 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    orderIds: json("order_ids").notNull(), // Array of order IDs
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 4 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    paymentTerms: integer("payment_terms").notNull(),
    dueDate: date("due_date").notNull(),
    status: varchar("status", { length: 20 }).default("draft"), // "draft", "sent", "paid", "overdue"
    paymentDate: date("payment_date"),
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentReference: varchar("payment_reference", { length: 255 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    invoiceNumberIdx: index("idx_invoice_number").on(table.invoiceNumber),
    customerIdIdx: index("idx_invoice_customer_id").on(table.customerId),
    statusIdx: index("idx_invoice_status").on(table.status),
    dueDateIdx: index("idx_invoice_due_date").on(table.dueDate),
  })
);

// Invoice Records table schema
const invoiceRecords = pgTable(
  "invoice_records",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .references(() => invoices.id, { onDelete: "cascade" })
      .notNull(),
    orderId: integer("order_id").notNull(),
    recordId: integer("record_id").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    invoiceIdIdx: index("idx_invoice_records_invoice_id").on(table.invoiceId),
    orderIdIdx: index("idx_invoice_records_order_id").on(table.orderId),
    recordIdIdx: index("idx_invoice_records_record_id").on(table.recordId),
  })
);

// Order Pricing History table schema
const orderPricingHistory = pgTable(
  "order_pricing_history",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: varchar("created_by", { length: 255 }),
    notes: text("notes"),
  },
  (table) => ({
    orderIdIdx: index("idx_pricing_history_order_id").on(table.orderId),
  })
);

// Order Record Pricing History table schema
const orderRecordPricingHistory = pgTable(
  "order_record_pricing_history",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").notNull(),
    recordId: integer("record_id").notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    createdBy: varchar("created_by", { length: 255 }),
    notes: text("notes"),
  },
  (table) => ({
    orderIdIdx: index("idx_record_pricing_history_order_id").on(table.orderId),
    recordIdIdx: index("idx_record_pricing_history_record_id").on(
      table.recordId
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
  itemTypes,
  items,
  orders,
  orderRecords,
  machineAssignments,
  invoices,
  invoiceRecords,
  orderPricingHistory,
  orderRecordPricingHistory,
};
