import { pgTable, unique, serial, varchar, text, boolean, timestamp, date, integer, foreignKey, index, json, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const customers = pgTable("customers", {
	id: serial().primaryKey().notNull(),
	customerCode: varchar("customer_code", { length: 50 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }).notNull(),
	address: text(),
	mapLink: text("map_link"),
	postalCode: varchar("postal_code", { length: 20 }),
	country: varchar({ length: 100 }),
	dateOfBirth: date("date_of_birth"),
	notes: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isDeleted: boolean("is_deleted").default(false),
	incrementNumber: integer("increment_number").default(0),
	balance: numeric({ precision: 10, scale: 2 }).default('0.00'),
}, (table) => [
	unique("customers_customer_code_unique").on(table.customerCode),
	unique("customers_email_unique").on(table.email),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	dateOfBirth: date("date_of_birth"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	roleId: integer("role_id"),
	isDeleted: boolean("is_deleted").default(false),
	username: varchar({ length: 50 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "users_role_id_roles_id_fk"
		}),
	unique("users_email_unique").on(table.email),
	unique("users_username_unique").on(table.username),
]);

export const dryingTypes = pgTable("drying_types", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("drying_types_code_unique").on(table.code),
]);

export const employees = pgTable("employees", {
	id: serial().primaryKey().notNull(),
	employeeId: varchar("employee_id", { length: 50 }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 20 }).notNull(),
	department: varchar({ length: 100 }),
	position: varchar({ length: 100 }),
	hireDate: date("hire_date"),
	dateOfBirth: date("date_of_birth"),
	address: text(),
	emergencyContact: varchar("emergency_contact", { length: 100 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isDeleted: boolean("is_deleted").default(false),
}, (table) => [
	unique("employees_employee_id_unique").on(table.employeeId),
	unique("employees_email_unique").on(table.email),
]);

export const washingTypes = pgTable("washing_types", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("washing_types_code_unique").on(table.code),
]);

export const items = pgTable("items", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	code: varchar({ length: 50 }),
}, (table) => [
	index("idx_items_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("idx_items_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("items_name_unique").on(table.name),
	unique("items_code_unique").on(table.code),
]);

export const machineTypes = pgTable("machine_types", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const processTypes = pgTable("process_types", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("process_types_code_unique").on(table.code),
]);

export const machineAssignments = pgTable("machine_assignments", {
	id: serial().primaryKey().notNull(),
	recordId: integer("record_id").notNull(),
	orderId: integer("order_id").notNull(),
	assignedById: integer("assigned_by_id"),
	quantity: integer().notNull(),
	returnQuantity: integer("return_quantity"),
	washingMachine: varchar("washing_machine", { length: 50 }),
	dryingMachine: varchar("drying_machine", { length: 50 }),
	assignedAt: timestamp("assigned_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	status: varchar({ length: 20 }).default('In Progress').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	trackingNumber: varchar("tracking_number", { length: 20 }),
}, (table) => [
	index("idx_assignment_assigned_by_id").using("btree", table.assignedById.asc().nullsLast().op("int4_ops")),
	index("idx_assignment_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("idx_assignment_record_id").using("btree", table.recordId.asc().nullsLast().op("int4_ops")),
	index("idx_assignment_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_assignment_tracking_number").using("btree", table.trackingNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.recordId],
			foreignColumns: [orderRecords.id],
			name: "machine_assignments_record_id_order_records_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "machine_assignments_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedById],
			foreignColumns: [employees.id],
			name: "machine_assignments_assigned_by_id_employees_id_fk"
		}).onDelete("set null"),
]);

export const orderRecords = pgTable("order_records", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	quantity: integer().notNull(),
	washType: varchar("wash_type", { length: 50 }).notNull(),
	processTypes: json("process_types").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	itemId: varchar("item_id", { length: 50 }),
	status: varchar({ length: 20 }).default('Pending').notNull(),
	trackingNumber: varchar("tracking_number", { length: 20 }),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).default('0.00'),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).default('0.00'),
	isPaid: boolean("is_paid").default(false),
}, (table) => [
	index("idx_order_records_item_id").using("btree", table.itemId.asc().nullsLast().op("text_ops")),
	index("idx_order_records_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("idx_order_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_order_records_tracking_number").using("btree", table.trackingNumber.asc().nullsLast().op("text_ops")),
	index("idx_order_records_wash_type").using("btree", table.washType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_records_order_id_orders_id_fk"
		}).onDelete("cascade"),
]);

export const itemTypes = pgTable("item_types", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("item_types_code_unique").on(table.code),
]);

export const invoices = pgTable("invoices", {
	id: serial().primaryKey().notNull(),
	invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
	customerId: varchar("customer_id", { length: 50 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	orderIds: json("order_ids").notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	taxRate: numeric("tax_rate", { precision: 5, scale:  4 }).notNull(),
	taxAmount: numeric("tax_amount", { precision: 10, scale:  2 }).notNull(),
	total: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentTerms: integer("payment_terms").notNull(),
	dueDate: date("due_date").notNull(),
	status: varchar({ length: 20 }).default('draft'),
	payment: numeric({ precision: 10, scale: 2 }).default('0.00'),
	paymentDate: date("payment_date"),
	paymentMethod: varchar("payment_method", { length: 50 }),
	paymentReference: varchar("payment_reference", { length: 255 }),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_invoice_customer_id").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("idx_invoice_due_date").using("btree", table.dueDate.asc().nullsLast().op("date_ops")),
	index("idx_invoice_number").using("btree", table.invoiceNumber.asc().nullsLast().op("text_ops")),
	index("idx_invoice_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("invoices_invoice_number_unique").on(table.invoiceNumber),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	date: date().notNull(),
	referenceNo: varchar("reference_no", { length: 50 }).notNull(),
	customerId: varchar("customer_id", { length: 50 }).notNull(),
	quantity: integer().notNull(),
	notes: text(),
	deliveryDate: date("delivery_date").notNull(),
	status: varchar({ length: 20 }).default('Pending'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	amount: numeric({ precision: 10, scale:  2 }).default('0.00'),
	itemId: boolean("item_id").default(false),
	billingStatus: varchar("billing_status", { length: 20 }).default('pending'),
	gpNo: varchar("gp_no", { length: 100 }),
	invoiceNo: varchar("invoice_no", { length: 100 }),
}, (table) => [
	index("idx_billing_status").using("btree", table.billingStatus.asc().nullsLast().op("text_ops")),
	index("idx_customer_id").using("btree", table.customerId.asc().nullsLast().op("text_ops")),
	index("idx_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_delivery_date").using("btree", table.deliveryDate.asc().nullsLast().op("date_ops")),
	index("idx_gp_no").using("btree", table.gpNo.asc().nullsLast().op("text_ops")),
	index("idx_invoice_no").using("btree", table.invoiceNo.asc().nullsLast().op("text_ops")),
	index("idx_item_id").using("btree", table.itemId.asc().nullsLast().op("bool_ops")),
	index("idx_reference_no").using("btree", table.referenceNo.asc().nullsLast().op("text_ops")),
	index("idx_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("orders_reference_no_unique").on(table.referenceNo),
]);

export const orderPricingHistory = pgTable("order_pricing_history", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: varchar("created_by", { length: 255 }),
	notes: text(),
}, (table) => [
	index("idx_pricing_history_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
]);

export const orderRecordPricingHistory = pgTable("order_record_pricing_history", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	recordId: integer("record_id").notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: varchar("created_by", { length: 255 }),
	notes: text(),
}, (table) => [
	index("idx_record_pricing_history_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("idx_record_pricing_history_record_id").using("btree", table.recordId.asc().nullsLast().op("int4_ops")),
]);

export const invoiceRecords = pgTable("invoice_records", {
	id: serial().primaryKey().notNull(),
	invoiceId: integer("invoice_id").notNull(),
	orderId: integer("order_id").notNull(),
	recordId: integer("record_id").notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_invoice_records_invoice_id").using("btree", table.invoiceId.asc().nullsLast().op("int4_ops")),
	index("idx_invoice_records_order_id").using("btree", table.orderId.asc().nullsLast().op("int4_ops")),
	index("idx_invoice_records_record_id").using("btree", table.recordId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.invoiceId],
			foreignColumns: [invoices.id],
			name: "invoice_records_invoice_id_invoices_id_fk"
		}).onDelete("cascade"),
]);
