const {
  eq,
  and,
  or,
  ilike,
  count,
  asc,
  desc,
  sum,
  gte,
  lte,
  sql,
  inArray,
} = require("drizzle-orm");
const { db } = require("../config/db");
const {
  orders,
  orderRecords,
  customers,
  items,
  machineAssignments,
  orderPricingHistory,
  orderRecordPricingHistory,
  invoices,
  invoiceRecords,
} = require("../db/schema");

class Order {
  // Create a new order
  static async create(orderData) {
    try {
      // Generate reference number if not provided
      let referenceNo = orderData.referenceNo;
      if (!referenceNo) {
        referenceNo = await this.generateReferenceNumber();
      }

      // Check if reference number already exists
      const existingOrder = await this.findByReferenceNo(referenceNo);
      if (existingOrder) {
        throw new Error("Reference number already exists");
      }

      const [order] = await db
        .insert(orders)
        .values({
          ...orderData,
          referenceNo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // Find order by ID with customer and item details
  static async findById(id) {
    try {
      const [order] = await db
        .select({
          id: orders.id,
          date: orders.date,
          referenceNo: orders.referenceNo,
          customerId: orders.customerId,
          itemId: orders.itemId,
          quantity: orders.quantity,
          notes: orders.notes,
          deliveryDate: orders.deliveryDate,
          status: orders.status,
          billingStatus: orders.billingStatus,
          amount: orders.amount,
          gpNo: orders.gpNo,
          invoiceNo: orders.invoiceNo,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1);

      if (!order) return null;

      // Get customer and item names (you'll need to implement these lookups)
      // For now, returning the order structure expected by FE
      return {
        ...order,
        customerName: await this.getCustomerName(order.customerId),
        recordsCount: await this.getRecordsCount(id),
        complete: await this.isOrderComplete(id),
      };
    } catch (error) {
      console.error("Error finding order by ID:", error);
      throw error;
    }
  }

  // Find order by reference number
  static async findByReferenceNo(referenceNo) {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.referenceNo, referenceNo))
        .limit(1);

      return order || null;
    } catch (error) {
      console.error("Error finding order by reference number:", error);
      throw error;
    }
  }

  // Find all orders with pagination and filtering
  static async findAll(options = {}) {
    try {
      const {
        limit = 10,
        offset = 0,
        search = null,
        status = null,
        customerId = null,
        customerName = null,
        orderId = null,
        excludeDelivered = false,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(orders.referenceNo, `%${search}%`),
            ilike(orders.customerId, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(orders.status, status));
      }

      if (customerId) {
        conditions.push(eq(orders.customerId, customerId));
      }

      if (orderId) {
        conditions.push(eq(orders.id, orderId));
      }

      // Exclude delivered orders if requested
      if (excludeDelivered) {
        conditions.push(sql`${orders.status} != 'Delivered'`);
      }

      // Handle customer name filtering
      if (customerName) {
        // We need to join with customers table to filter by customer name
        // This will be handled in the query below
      }

      // Build order by
      const orderBy =
        sortOrder === "asc" ? asc(orders[sortBy]) : desc(orders[sortBy]);

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      let orderList;

      if (customerName) {
        // Join with customers table to filter by customer name
        orderList = await db
          .select({
            id: orders.id,
            date: orders.date,
            referenceNo: orders.referenceNo,
            customerId: orders.customerId,
            itemId: orders.itemId,
            quantity: orders.quantity,
            notes: orders.notes,
            deliveryDate: orders.deliveryDate,
            status: orders.status,
            billingStatus: orders.billingStatus,
            amount: orders.amount,
            deliveryQuantity: orders.deliveryQuantity,
            gpNo: orders.gpNo,
            invoiceNo: orders.invoiceNo,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
          })
          .from(orders)
          .leftJoin(
            customers,
            sql`${orders.customerId} = CAST(${customers.id} AS TEXT)`
          )
          .where(
            whereClause
              ? and(
                  whereClause,
                  or(
                    ilike(customers.firstName, `%${customerName}%`),
                    ilike(customers.lastName, `%${customerName}%`),
                    ilike(
                      sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
                      `%${customerName}%`
                    )
                  )
                )
              : or(
                  ilike(customers.firstName, `%${customerName}%`),
                  ilike(customers.lastName, `%${customerName}%`),
                  ilike(
                    sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
                    `%${customerName}%`
                  )
                )
          )
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);
      } else {
        // Regular query without customer name filtering
        orderList = await db
          .select({
            id: orders.id,
            date: orders.date,
            referenceNo: orders.referenceNo,
            customerId: orders.customerId,
            itemId: orders.itemId,
            quantity: orders.quantity,
            notes: orders.notes,
            deliveryDate: orders.deliveryDate,
            status: orders.status,
            billingStatus: orders.billingStatus,
            amount: orders.amount,
            deliveryQuantity: orders.deliveryQuantity,
            gpNo: orders.gpNo,
            invoiceNo: orders.invoiceNo,
            createdAt: orders.createdAt,
            updatedAt: orders.updatedAt,
          })
          .from(orders)
          .where(whereClause)
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);
      }

      // Enhance with customer names, records count, completion status, and return quantity
      const enhancedOrders = await Promise.all(
        orderList.map(async (order) => ({
          ...order,
          customerName: await this.getCustomerName(order.customerId),
          recordsCount: await this.getRecordsCount(order.id),
          complete: await this.isOrderComplete(order.id),
          returnQuantity: await this.getReturnQuantity(order.id),
          records: await this.getOrderRecords(order.id),
        }))
      );

      return enhancedOrders;
    } catch (error) {
      console.error("Error finding orders:", error);
      throw error;
    }
  }

  // Count orders with filtering
  static async count(options = {}) {
    try {
      const {
        search = null,
        status = null,
        customerId = null,
        customerName = null,
        orderId = null,
        excludeDelivered = false,
      } = options;

      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(orders.referenceNo, `%${search}%`),
            ilike(orders.customerId, `%${search}%`)
          )
        );
      }

      if (status) {
        conditions.push(eq(orders.status, status));
      }

      if (customerId) {
        conditions.push(eq(orders.customerId, customerId));
      }

      if (orderId) {
        conditions.push(eq(orders.id, orderId));
      }

      // Exclude delivered orders if requested
      if (excludeDelivered) {
        conditions.push(sql`${orders.status} != 'Delivered'`);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      let result;

      if (customerName) {
        // Join with customers table to filter by customer name
        [result] = await db
          .select({ count: count() })
          .from(orders)
          .leftJoin(
            customers,
            sql`${orders.customerId} = CAST(${customers.id} AS TEXT)`
          )
          .where(
            whereClause
              ? and(
                  whereClause,
                  or(
                    ilike(customers.firstName, `%${customerName}%`),
                    ilike(customers.lastName, `%${customerName}%`),
                    ilike(
                      sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
                      `%${customerName}%`
                    )
                  )
                )
              : or(
                  ilike(customers.firstName, `%${customerName}%`),
                  ilike(customers.lastName, `%${customerName}%`),
                  ilike(
                    sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`,
                    `%${customerName}%`
                  )
                )
          );
      } else {
        // Regular count without customer name filtering
        [result] = await db
          .select({ count: count() })
          .from(orders)
          .where(whereClause);
      }

      return result.count;
    } catch (error) {
      console.error("Error counting orders:", error);
      throw error;
    }
  }

  // Update order
  static async update(id, updateData) {
    try {
      const existingOrder = await this.findById(id);
      if (!existingOrder) {
        throw new Error("Order not found");
      }

      if (
        updateData.referenceNo &&
        updateData.referenceNo !== existingOrder.referenceNo
      ) {
        const existingRef = await this.findByReferenceNo(
          updateData.referenceNo
        );
        if (existingRef) {
          throw new Error("Reference number already exists");
        }
      }

      const [order] = await db
        .update(orders)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  }

  // Delete order (cascade delete will handle records)
  static async delete(id) {
    try {
      const [order] = await db
        .delete(orders)
        .where(eq(orders.id, id))
        .returning();

      return order;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }

  // Delete order with all related records (explicit cleanup)
  static async deleteWithRelatedRecords(id) {
    try {
      const result = await db.transaction(async (tx) => {
        // Get counts before deletion for reporting
        const [orderRecordsCount] = await tx
          .select({ count: count() })
          .from(orderRecords)
          .where(eq(orderRecords.orderId, id));

        const [machineAssignmentsCount] = await tx
          .select({ count: count() })
          .from(machineAssignments)
          .where(eq(machineAssignments.orderId, id));

        // Delete related records first (in case cascade doesn't work properly)
        await tx.delete(orderRecords).where(eq(orderRecords.orderId, id));
        await tx
          .delete(machineAssignments)
          .where(eq(machineAssignments.orderId, id));

        // Delete pricing history
        await tx
          .delete(orderPricingHistory)
          .where(eq(orderPricingHistory.orderId, id));
        await tx
          .delete(orderRecordPricingHistory)
          .where(eq(orderRecordPricingHistory.orderId, id));

        // Delete invoice records that reference this order
        await tx.delete(invoiceRecords).where(eq(invoiceRecords.orderId, id));

        // Find and delete invoices that contain this order ID in their orderIds JSON
        const invoicesWithOrder = await tx
          .select({ id: invoices.id, orderIds: invoices.orderIds })
          .from(invoices);

        for (const invoice of invoicesWithOrder) {
          const orderIds = JSON.parse(invoice.orderIds);
          if (orderIds.includes(parseInt(id))) {
            // If this is the only order in the invoice, delete the entire invoice
            if (orderIds.length === 1) {
              await tx.delete(invoices).where(eq(invoices.id, invoice.id));
            } else {
              // Remove this order from the invoice's orderIds array
              const updatedOrderIds = orderIds.filter(
                (orderId) => orderId !== parseInt(id)
              );
              await tx
                .update(invoices)
                .set({ orderIds: JSON.stringify(updatedOrderIds) })
                .where(eq(invoices.id, invoice.id));
            }
          }
        }

        // Delete the order itself
        const [deletedOrder] = await tx
          .delete(orders)
          .where(eq(orders.id, id))
          .returning();

        return {
          order: deletedOrder,
          deletedOrderRecords: orderRecordsCount.count,
          deletedMachineAssignments: machineAssignmentsCount.count,
        };
      });

      return result;
    } catch (error) {
      console.error("Error deleting order with related records:", error);
      throw error;
    }
  }

  // Delete all orders with related records (for testing)
  static async deleteAllWithRelatedRecords() {
    try {
      const result = await db.transaction(async (tx) => {
        // Get counts before deletion
        const [ordersCount] = await tx.select({ count: count() }).from(orders);
        const [orderRecordsCount] = await tx
          .select({ count: count() })
          .from(orderRecords);
        const [machineAssignmentsCount] = await tx
          .select({ count: count() })
          .from(machineAssignments);
        const [pricingHistoryCount] = await tx
          .select({ count: count() })
          .from(orderPricingHistory);
        const [recordPricingHistoryCount] = await tx
          .select({ count: count() })
          .from(orderRecordPricingHistory);
        const [invoicesCount] = await tx
          .select({ count: count() })
          .from(invoices);
        const [invoiceRecordsCount] = await tx
          .select({ count: count() })
          .from(invoiceRecords);

        // Delete all related records first
        await tx.delete(orderRecords);
        await tx.delete(machineAssignments);
        await tx.delete(orderPricingHistory);
        await tx.delete(orderRecordPricingHistory);
        await tx.delete(invoiceRecords);
        await tx.delete(invoices);

        // Delete all orders
        await tx.delete(orders);

        return {
          ordersCount: ordersCount.count,
          orderRecordsCount: orderRecordsCount.count,
          machineAssignmentsCount: machineAssignmentsCount.count,
          pricingHistoryCount: pricingHistoryCount.count,
          recordPricingHistoryCount: recordPricingHistoryCount.count,
          invoicesCount: invoicesCount.count,
          invoiceRecordsCount: invoiceRecordsCount.count,
        };
      });

      return result;
    } catch (error) {
      console.error("Error deleting all orders with related records:", error);
      throw error;
    }
  }

  // Generate next reference number
  static async generateReferenceNumber() {
    try {
      // Find the latest order number
      const [latestOrder] = await db
        .select({ referenceNo: orders.referenceNo })
        .from(orders)
        .where(ilike(orders.referenceNo, "ORD%"))
        .orderBy(desc(orders.referenceNo))
        .limit(1);

      if (!latestOrder) {
        return "ORD001";
      }

      // Extract number and increment
      const match = latestOrder.referenceNo.match(/ORD(\d+)$/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `ORD${nextNumber.toString().padStart(3, "0")}`;
      }

      return "ORD001";
    } catch (error) {
      console.error("Error generating reference number:", error);
      throw error;
    }
  }

  // Generate invoice number based on customer code (counter-based approach)
  static async generateInvoiceNumber(customerId) {
    try {
      // Get customer code and current increment number
      const [customer] = await db
        .select({
          customerCode: customers.customerCode,
          incrementNumber: customers.incrementNumber,
        })
        .from(customers)
        .where(eq(customers.id, parseInt(customerId)))
        .limit(1);

      if (!customer) {
        throw new Error("Customer not found");
      }

      const customerCode = customer.customerCode;
      const currentIncrement = customer.incrementNumber || 0;
      const nextIncrement = currentIncrement + 1;

      // Generate invoice number
      const invoiceNo = `${customerCode}${nextIncrement
        .toString()
        .padStart(3, "0")}`;

      return invoiceNo;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      throw error;
    }
  }

  // Update customer increment number when invoice is created
  static async updateCustomerIncrementNumber(customerId) {
    try {
      await db
        .update(customers)
        .set({
          incrementNumber: sql`${customers.incrementNumber} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, parseInt(customerId)));

      return true;
    } catch (error) {
      console.error("Error updating customer increment number:", error);
      throw error;
    }
  }

  // Generate invoice number for existing orders that don't have one (counter-based approach)
  static async generateInvoiceNumberForExistingOrder(orderId) {
    try {
      // Get the order
      const order = await this.findById(orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      // If order already has an invoice number, return it
      if (order.invoiceNo) {
        return order.invoiceNo;
      }

      // Generate new invoice number
      const invoiceNo = await this.generateInvoiceNumber(order.customerId);

      // Update the order with the new invoice number
      await db
        .update(orders)
        .set({
          invoiceNo: invoiceNo,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));

      return invoiceNo;
    } catch (error) {
      console.error(
        "Error generating invoice number for existing order:",
        error
      );
      throw error;
    }
  }

  // Generate invoice number for multiple orders (batch operation)
  static async generateInvoiceNumberForMultipleOrders(orderIds) {
    try {
      if (!orderIds || orderIds.length === 0) {
        throw new Error("Order IDs are required");
      }

      // Get the first order to determine customer
      const [firstOrder] = await db
        .select({
          customerId: orders.customerId,
        })
        .from(orders)
        .where(eq(orders.id, orderIds[0]))
        .limit(1);

      if (!firstOrder) {
        throw new Error("First order not found");
      }

      // Generate a single invoice number for all orders
      const invoiceNo = await this.generateInvoiceNumber(firstOrder.customerId);

      // Update all orders with the same invoice number
      await db
        .update(orders)
        .set({
          invoiceNo: invoiceNo,
          updatedAt: new Date(),
        })
        .where(inArray(orders.id, orderIds));

      return invoiceNo;
    } catch (error) {
      console.error(
        "Error generating invoice number for multiple orders:",
        error
      );
      throw error;
    }
  }

  // Helper methods
  static async getCustomerName(customerId) {
    try {
      // Get customer name from customers table
      const [customer] = await db
        .select({
          firstName: customers.firstName,
          lastName: customers.lastName,
        })
        .from(customers)
        .where(eq(customers.id, parseInt(customerId)))
        .limit(1);

      if (customer) {
        return `${customer.firstName} ${customer.lastName}`;
      }

      return `Customer ${customerId}`;
    } catch (error) {
      console.error(
        `Error fetching customer name for customerId: ${customerId}`,
        error
      );
      return `Customer ${customerId}`;
    }
  }

  static async getRecordsCount(orderId) {
    try {
      const [result] = await db
        .select({ count: count() })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId));

      return result.count;
    } catch (error) {
      return 0;
    }
  }

  static async getReturnQuantity(orderId) {
    try {
      const [result] = await db
        .select({
          totalReturnQuantity: sum(machineAssignments.returnQuantity),
        })
        .from(machineAssignments)
        .where(eq(machineAssignments.orderId, parseInt(orderId)));

      // Convert to number to ensure consistent data type
      return parseInt(result?.totalReturnQuantity) || 0;
    } catch (error) {
      console.error("Error getting return quantity:", error);
      return 0;
    }
  }

  static async getOrderRecords(orderId) {
    try {
      const records = await db
        .select()
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .orderBy(asc(orderRecords.id));

      return records;
    } catch (error) {
      return [];
    }
  }

  // Check if order is complete (total quantity equals sum of records)
  static async isOrderComplete(orderId) {
    try {
      // Get order quantity
      const [order] = await db
        .select({ quantity: orders.quantity })
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order) {
        return false;
      }

      // Get sum of all record quantities for this order
      const [result] = await db
        .select({ totalRecordQuantity: sum(orderRecords.quantity) })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId));

      const totalRecordQuantity = parseInt(result.totalRecordQuantity) || 0;

      // Order is complete if order quantity equals total record quantity
      return order.quantity === totalRecordQuantity;
    } catch (error) {
      console.error("Error checking order completion:", error);
      return false;
    }
  }

  // Check if all order records for an order are completed
  static async isOrderRecordsComplete(orderId) {
    try {
      // Get total order records for this order
      const [totalResult] = await db
        .select({ count: count() })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId));

      // Get completed order records for this order
      const [completedResult] = await db
        .select({ count: count() })
        .from(orderRecords)
        .where(
          and(
            eq(orderRecords.orderId, orderId),
            eq(orderRecords.status, "Complete")
          )
        );

      const totalRecords = parseInt(totalResult.count) || 0;
      const completedRecords = parseInt(completedResult.count) || 0;

      // Order records are complete if there are records and all are completed
      return totalRecords > 0 && totalRecords === completedRecords;
    } catch (error) {
      console.error("Error checking order records completion:", error);
      return false;
    }
  }

  // Update order status based on order records completion
  static async updateOrderStatus(orderId, forceStatus = null) {
    try {
      let newStatus;

      if (forceStatus) {
        // Force a specific status (e.g., "Pending" when a record changes to Pending)
        newStatus = forceStatus;
      } else {
        // Check if order should be complete based on order records
        const isComplete = await this.isOrderRecordsComplete(orderId);
        newStatus = isComplete ? "Complete" : "Pending";
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // Get detailed order information with customer and records
  static async getOrderDetails(orderId) {
    try {
      // Get order information
      const order = await this.findById(orderId);
      if (!order) {
        return null;
      }

      // Get customer name
      let customerName = null;
      try {
        const [customer] = await db
          .select({
            firstName: customers.firstName,
            lastName: customers.lastName,
          })
          .from(customers)
          .where(eq(customers.id, parseInt(order.customerId)));

        if (customer) {
          customerName = `${customer.firstName} ${customer.lastName}`;
        }
      } catch (error) {
        console.log(
          `Could not fetch customer name for customerId: ${order.customerId}`
        );
      }

      // Get order records
      const records = await db
        .select()
        .from(orderRecords)
        .where(eq(orderRecords.orderId, orderId))
        .orderBy(asc(orderRecords.id));

      // Get item names for each record
      const recordsWithItemNames = await Promise.all(
        records.map(async (record) => {
          let itemName = null;
          if (record.itemId) {
            try {
              const [item] = await db
                .select({ name: items.name })
                .from(items)
                .where(eq(items.id, record.itemId));
              itemName = item?.name || null;
            } catch (error) {
              console.log(
                `Could not fetch item name for itemId: ${record.itemId}`
              );
            }
          }

          return {
            ...record,
            itemName,
          };
        })
      );

      return {
        ...order,
        customerName,
        records: recordsWithItemNames,
      };
    } catch (error) {
      console.error("Error getting order details:", error);
      throw error;
    }
  }
}

module.exports = Order;
