import { relations } from "drizzle-orm/relations";
import { roles, users, orderRecords, machineAssignments, orders, employees } from "./schema";

export const usersRelations = relations(users, ({one}) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));

export const machineAssignmentsRelations = relations(machineAssignments, ({one}) => ({
	orderRecord: one(orderRecords, {
		fields: [machineAssignments.recordId],
		references: [orderRecords.id]
	}),
	order: one(orders, {
		fields: [machineAssignments.orderId],
		references: [orders.id]
	}),
	employee: one(employees, {
		fields: [machineAssignments.assignedById],
		references: [employees.id]
	}),
}));

export const orderRecordsRelations = relations(orderRecords, ({one, many}) => ({
	machineAssignments: many(machineAssignments),
	order: one(orders, {
		fields: [orderRecords.orderId],
		references: [orders.id]
	}),
}));

export const ordersRelations = relations(orders, ({many}) => ({
	machineAssignments: many(machineAssignments),
	orderRecords: many(orderRecords),
}));

export const employeesRelations = relations(employees, ({many}) => ({
	machineAssignments: many(machineAssignments),
}));