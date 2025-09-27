const { db } = require("../config/db");
const {
  orders,
  orderRecords,
  customers,
  invoices,
  invoiceRecords,
  orderPricingHistory,
  orderRecordPricingHistory,
  items,
  machineAssignments,
} = require("../db/schema");
const {
  eq,
  and,
  or,
  gte,
  lte,
  count,
  sum,
  desc,
  asc,
  sql,
  between,
  ilike,
  inArray,
} = require("drizzle-orm");

class BillingController {
  // Helper method to get customer name
  static async getCustomerName(customerId) {
    try {
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
      console.error("Error getting customer name:", error);
      return `Customer ${customerId}`;
    }
  }

  // Helper method to get return quantity for an order
  static async getReturnQuantity(orderId) {
    try {
      const [result] = await db
        .select({
          totalReturnQuantity: sum(machineAssignments.returnQuantity),
        })
        .from(machineAssignments)
        .where(eq(machineAssignments.orderId, parseInt(orderId)));

      return result?.totalReturnQuantity || 0;
    } catch (error) {
      console.error("Error getting return quantity:", error);
      return 0;
    }
  }

  // Helper method to get customer balance
  static async getCustomerBalance(customerId) {
    try {
      const [customer] = await db
        .select({ balance: customers.balance })
        .from(customers)
        .where(eq(customers.id, parseInt(customerId)))
        .limit(1);

      return parseFloat(customer?.balance || 0);
    } catch (error) {
      console.error("Error getting customer balance:", error);
      return 0;
    }
  }

  // Helper method to generate invoice number
  static async generateInvoiceNumber() {
    try {
      const [latestInvoice] = await db
        .select({ invoiceNumber: invoices.invoiceNumber })
        .from(invoices)
        .where(ilike(invoices.invoiceNumber, "INV-%"))
        .orderBy(desc(invoices.invoiceNumber))
        .limit(1);

      if (!latestInvoice) {
        const year = new Date().getFullYear();
        return `INV-${year}-0001`;
      }

      // Extract number and increment
      const match = latestInvoice.invoiceNumber.match(/INV-(\d{4})-(\d+)$/);
      if (match) {
        const year = match[1];
        const nextNumber = parseInt(match[2]) + 1;
        return `INV-${year}-${nextNumber.toString().padStart(4, "0")}`;
      }

      const year = new Date().getFullYear();
      return `INV-${year}-0001`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      const year = new Date().getFullYear();
      return `INV-${year}-0001`;
    }
  }

  // Helper method to calculate due date
  static calculateDueDate(paymentTerms) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate;
  }

  // 1. GET /api/billing/orders - Get billing orders
  static async getBillingOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        customerName,
        orderId,
        billingStatus,
        status,
        dateFrom,
        dateTo,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];

      if (customerName) {
        // We'll need to join with customers table
      }

      if (orderId) {
        conditions.push(eq(orders.id, parseInt(orderId)));
      }

      if (billingStatus) {
        // Use billing_status column for filtering
        conditions.push(eq(orders.billingStatus, billingStatus));
      }

      if (status) {
        // Filter by order status
        conditions.push(eq(orders.status, status));
      }

      if (dateFrom && dateTo) {
        conditions.push(
          between(orders.date, new Date(dateFrom), new Date(dateTo))
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get orders with pagination
      const orderList = await db
        .select({
          id: orders.id,
          referenceNo: orders.referenceNo,
          customerId: orders.customerId,
          date: orders.date,
          quantity: orders.quantity,
          amount: orders.amount,
          status: orders.status,
          billingStatus: orders.billingStatus,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(orders)
        .where(whereClause);

      const totalItems = totalResult.count;
      const totalPages = Math.ceil(totalItems / parseInt(limit));

      // Enhance with customer names, return quantity, and balance
      const enhancedOrders = await Promise.all(
        orderList.map(async (order) => ({
          ...order,
          customerName: await BillingController.getCustomerName(
            order.customerId
          ),
          billingStatus: order.billingStatus || "pending",
          returnQuantity: await BillingController.getReturnQuantity(order.id),
          balance: await BillingController.getCustomerBalance(order.customerId),
        }))
      );

      res.json({
        success: true,
        data: {
          orders: enhancedOrders,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getBillingOrders:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 2. POST /api/billing/invoices - Create invoice
  static async createInvoice(req, res) {
    try {
      const {
        invoiceNumber,
        customerName,
        orderIds,
        records,
        orderTotals,
        taxRate = 0.1,
        paymentTerms = 30,
        notes,
      } = req.body;

      // Generate invoice number if not provided
      const finalInvoiceNumber =
        invoiceNumber || (await BillingController.generateInvoiceNumber());

      // Calculate totals
      const subtotal = orderTotals.reduce(
        (sum, order) => sum + parseFloat(order.totalPrice),
        0
      );
      const taxAmount = subtotal * parseFloat(taxRate);
      const total = subtotal + taxAmount;

      // Get customer ID from first order
      const [firstOrder] = await db
        .select({ customerId: orders.customerId })
        .from(orders)
        .where(eq(orders.id, orderIds[0]))
        .limit(1);

      if (!firstOrder) {
        return res.status(400).json({
          success: false,
          message: "Order not found",
        });
      }

      // Create invoice
      console.log("📝 TABLE UPDATE: invoices");
      const [invoice] = await db
        .insert(invoices)
        .values({
          invoiceNumber: finalInvoiceNumber,
          customerId: firstOrder.customerId,
          customerName,
          orderIds: JSON.stringify(orderIds),
          subtotal: subtotal.toString(),
          taxRate: taxRate.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          paymentTerms,
          dueDate: BillingController.calculateDueDate(paymentTerms)
            .toISOString()
            .split("T")[0],
          status: "draft",
          notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Create invoice records
      if (records && records.length > 0) {
        console.log("📝 TABLE UPDATE: invoice_records");
        const invoiceRecordData = records.map((record) => ({
          invoiceId: invoice.id,
          orderId: record.orderId,
          recordId: record.recordId,
          unitPrice: record.unitPrice.toString(),
          totalPrice: record.totalPrice.toString(),
          createdAt: new Date(),
        }));

        await db.insert(invoiceRecords).values(invoiceRecordData);
      }

      // Update order billing statuses to "invoiced"
      console.log("📝 TABLE UPDATE: orders (billing status)");
      await db
        .update(orders)
        .set({
          billingStatus: "invoiced",
          updatedAt: new Date(),
        })
        .where(inArray(orders.id, orderIds));

      // Mark previous invoices for this customer as "paid" and update their orders' billing status
      console.log(
        "📝 TABLE UPDATE: previous invoices and orders (marking as paid)"
      );

      // Get all previous invoices for this customer (excluding the current one)
      const previousInvoices = await db
        .select({ id: invoices.id, orderIds: invoices.orderIds })
        .from(invoices)
        .where(
          and(
            eq(invoices.customerId, firstOrder.customerId),
            sql`${invoices.id} != ${invoice.id}`,
            sql`${invoices.status} != 'paid'`
          )
        );

      if (previousInvoices.length > 0) {
        // Update previous invoices to "paid" status
        const previousInvoiceIds = previousInvoices.map((inv) => inv.id);
        await db
          .update(invoices)
          .set({
            status: "paid",
            updatedAt: new Date(),
          })
          .where(inArray(invoices.id, previousInvoiceIds));

        // Get all order IDs from previous invoices
        const allPreviousOrderIds = [];
        for (const prevInvoice of previousInvoices) {
          const orderIds =
            typeof prevInvoice.orderIds === "string"
              ? JSON.parse(prevInvoice.orderIds)
              : prevInvoice.orderIds;
          allPreviousOrderIds.push(...orderIds);
        }

        // Update billing status of orders from previous invoices to "paid"
        if (allPreviousOrderIds.length > 0) {
          await db
            .update(orders)
            .set({
              billingStatus: "paid",
              updatedAt: new Date(),
            })
            .where(inArray(orders.id, allPreviousOrderIds));
        }
      }

      // Update customer increment number (only when invoice is actually created)
      const Order = require("../models/Order");
      await Order.updateCustomerIncrementNumber(firstOrder.customerId);

      // Get order details for response
      const orderDetails = await db
        .select({
          id: orders.id,
          referenceNo: orders.referenceNo,
          customerName:
            sql`CONCAT(${customers.firstName}, ' ', ${customers.lastName})`.as(
              "customerName"
            ),
          date: orders.date,
          quantity: orders.quantity,
          status: orders.status,
          billingStatus: orders.billingStatus,
        })
        .from(orders)
        .leftJoin(
          customers,
          sql`${orders.customerId} = CAST(${customers.id} AS TEXT)`
        )
        .where(inArray(orders.id, orderIds));

      res.json({
        success: true,
        data: {
          ...invoice,
          orderIds:
            typeof invoice.orderIds === "string"
              ? JSON.parse(invoice.orderIds)
              : invoice.orderIds,
          orders: orderDetails,
        },
      });
    } catch (error) {
      console.error("Error in createInvoice:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 3. POST /api/billing/orders/pricing - Save order and record pricing
  static async saveOrderPricing(req, res) {
    try {
      const { orderPricing } = req.body;

      const savedOrders = [];

      for (const orderData of orderPricing) {
        const { orderId, totalPrice, records } = orderData;

        // Update order total price
        await db
          .update(orders)
          .set({
            amount: totalPrice.toString(),
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));

        // Save order pricing history
        await db.insert(orderPricingHistory).values({
          orderId,
          totalPrice: totalPrice.toString(),
          createdAt: new Date(),
          createdBy: req.user?.email || "system",
          notes: "Pricing saved via API",
        });

        // Update record pricing
        let recordsCount = 0;
        for (const record of records) {
          await db
            .update(orderRecords)
            .set({
              unitPrice: record.unitPrice.toString(),
              totalPrice: record.totalPrice.toString(),
              updatedAt: new Date(),
            })
            .where(eq(orderRecords.id, record.recordId));

          // Save record pricing history
          await db.insert(orderRecordPricingHistory).values({
            orderId,
            recordId: record.recordId,
            unitPrice: record.unitPrice.toString(),
            totalPrice: record.totalPrice.toString(),
            createdAt: new Date(),
            createdBy: req.user?.email || "system",
            notes: "Record pricing saved via API",
          });

          recordsCount++;
        }

        savedOrders.push({
          orderId,
          totalPrice,
          recordsCount,
        });
      }

      res.json({
        success: true,
        data: {
          message: "Order and record pricing saved successfully",
          savedOrders,
        },
      });
    } catch (error) {
      console.error("Error in saveOrderPricing:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 4. GET /api/billing/orders/{orderId}/pricing - Get order pricing history
  static async getOrderPricingHistory(req, res) {
    try {
      const { orderId } = req.params;

      // Get current pricing
      const [order] = await db
        .select({
          id: orders.id,
          amount: orders.amount,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.id, parseInt(orderId)))
        .limit(1);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Get current record pricing
      const records = await db
        .select({
          id: orderRecords.id,
          itemId: orderRecords.itemId,
          quantity: orderRecords.quantity,
          unitPrice: orderRecords.unitPrice,
          totalPrice: orderRecords.totalPrice,
          updatedAt: orderRecords.updatedAt,
        })
        .from(orderRecords)
        .where(eq(orderRecords.orderId, parseInt(orderId)));

      // Get item codes for each record
      const recordsWithItemCodes = await Promise.all(
        records.map(async (record) => {
          let itemCode = null;
          if (record.itemId) {
            try {
              const [item] = await db
                .select({ code: items.code })
                .from(items)
                .where(eq(items.id, record.itemId))
                .limit(1);
              itemCode = item?.code || null;
            } catch (error) {
              console.log(
                `Could not fetch item code for itemId: ${record.itemId}`
              );
            }
          }

          return {
            recordId: record.id,
            itemCode: itemCode,
            quantity: record.quantity,
            unitPrice: parseFloat(record.unitPrice) || 0,
            totalPrice: parseFloat(record.totalPrice) || 0,
            lastUpdated: record.updatedAt,
          };
        })
      );

      // Get pricing history
      const pricingHistory = await db
        .select()
        .from(orderPricingHistory)
        .where(eq(orderPricingHistory.orderId, parseInt(orderId)))
        .orderBy(desc(orderPricingHistory.createdAt));

      res.json({
        success: true,
        data: {
          orderId: parseInt(orderId),
          currentPricing: {
            totalPrice: parseFloat(order.amount) || 0,
            lastUpdated: order.updatedAt,
            records: recordsWithItemCodes,
          },
          pricingHistory: pricingHistory.map((history) => ({
            id: history.id,
            totalPrice: parseFloat(history.totalPrice),
            createdAt: history.createdAt,
            createdBy: history.createdBy,
            notes: history.notes,
          })),
        },
      });
    } catch (error) {
      console.error("Error in getOrderPricingHistory:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 5. PATCH /api/billing/orders/{orderId}/records/{recordId}/pricing - Update record pricing
  static async updateRecordPricing(req, res) {
    try {
      const { orderId, recordId } = req.params;
      const { unitPrice, notes } = req.body;

      // Get current record
      const [record] = await db
        .select({
          id: orderRecords.id,
          orderId: orderRecords.orderId,
          itemId: orderRecords.itemId,
          quantity: orderRecords.quantity,
          unitPrice: orderRecords.unitPrice,
          totalPrice: orderRecords.totalPrice,
        })
        .from(orderRecords)
        .where(
          and(
            eq(orderRecords.id, parseInt(recordId)),
            eq(orderRecords.orderId, parseInt(orderId))
          )
        )
        .limit(1);

      if (!record) {
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });
      }

      // Calculate new total price
      const newTotalPrice = parseFloat(unitPrice) * record.quantity;

      // Get item code
      let itemCode = null;
      if (record.itemId) {
        try {
          const [item] = await db
            .select({ code: items.code })
            .from(items)
            .where(eq(items.id, record.itemId))
            .limit(1);
          itemCode = item?.code || null;
        } catch (error) {
          console.log(`Could not fetch item code for itemId: ${record.itemId}`);
        }
      }

      // Update record pricing
      await db
        .update(orderRecords)
        .set({
          unitPrice: unitPrice.toString(),
          totalPrice: newTotalPrice.toString(),
          updatedAt: new Date(),
        })
        .where(eq(orderRecords.id, parseInt(recordId)));

      // Save pricing history
      await db.insert(orderRecordPricingHistory).values({
        orderId: parseInt(orderId),
        recordId: parseInt(recordId),
        unitPrice: unitPrice.toString(),
        totalPrice: newTotalPrice.toString(),
        createdAt: new Date(),
        createdBy: req.user?.email || "system",
        notes: notes || "Record pricing updated via API",
      });

      res.json({
        success: true,
        data: {
          recordId: parseInt(recordId),
          orderId: parseInt(orderId),
          itemCode: itemCode,
          quantity: record.quantity,
          unitPrice: parseFloat(unitPrice),
          totalPrice: newTotalPrice,
          updatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error in updateRecordPricing:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 6. GET /api/billing/invoices - Get invoices
  static async getInvoices(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        customerName,
        status,
        dateFrom,
        dateTo,
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [];

      if (customerName) {
        conditions.push(ilike(invoices.customerName, `%${customerName}%`));
      }

      if (status) {
        conditions.push(eq(invoices.status, status));
      }

      if (dateFrom && dateTo) {
        conditions.push(
          between(invoices.createdAt, new Date(dateFrom), new Date(dateTo))
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get invoices with pagination
      const invoiceList = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: invoices.customerName,
          customerId: invoices.customerId,
          subtotal: invoices.subtotal,
          taxAmount: invoices.taxAmount,
          total: invoices.total,
          status: invoices.status,
          dueDate: invoices.dueDate,
          payment: invoices.payment,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(invoices)
        .where(whereClause);

      const totalItems = totalResult.count;
      const totalPages = Math.ceil(totalItems / parseInt(limit));

      res.json({
        success: true,
        data: {
          invoices: invoiceList.map((invoice) => ({
            ...invoice,
            subtotal: parseFloat(invoice.subtotal),
            taxAmount: parseFloat(invoice.taxAmount),
            total: parseFloat(invoice.total),
            payment: parseFloat(invoice.payment || 0),
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getInvoices:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 7. GET /api/billing/invoices/{invoiceId} - Get invoice by ID
  static async getInvoiceById(req, res) {
    try {
      const { invoiceId } = req.params;

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, parseInt(invoiceId)))
        .limit(1);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Get invoice records
      const invoiceRecordList = await db
        .select()
        .from(invoiceRecords)
        .where(eq(invoiceRecords.invoiceId, parseInt(invoiceId)));

      // Get order details
      const orderIds = JSON.parse(invoice.orderIds);
      const orderDetails = await db
        .select({
          id: orders.id,
          referenceNo: orders.referenceNo,
          date: orders.date,
          quantity: orders.quantity,
          status: orders.status,
        })
        .from(orders)
        .where(inArray(orders.id, orderIds));

      // Get record details for each order
      const ordersWithRecords = await Promise.all(
        orderDetails.map(async (order) => {
          const records = await db
            .select({
              id: orderRecords.id,
              orderId: orderRecords.orderId,
              itemId: orderRecords.itemId,
              quantity: orderRecords.quantity,
              unitPrice: orderRecords.unitPrice,
              totalPrice: orderRecords.totalPrice,
              washType: orderRecords.washType,
              processTypes: orderRecords.processTypes,
            })
            .from(orderRecords)
            .where(eq(orderRecords.orderId, order.id));

          // Get item codes for each record
          const recordsWithItemCodes = await Promise.all(
            records.map(async (record) => {
              let itemCode = null;
              if (record.itemId) {
                try {
                  const [item] = await db
                    .select({ code: items.code })
                    .from(items)
                    .where(eq(items.id, record.itemId))
                    .limit(1);
                  itemCode = item?.code || null;
                } catch (error) {
                  console.log(
                    `Could not fetch item code for itemId: ${record.itemId}`
                  );
                }
              }

              return {
                ...record,
                itemCode: itemCode,
                unitPrice: parseFloat(record.unitPrice),
                totalPrice: parseFloat(record.totalPrice),
              };
            })
          );

          return {
            ...order,
            records: recordsWithItemCodes,
          };
        })
      );

      res.json({
        success: true,
        data: {
          ...invoice,
          orderIds: JSON.parse(invoice.orderIds),
          subtotal: parseFloat(invoice.subtotal),
          taxRate: parseFloat(invoice.taxRate),
          taxAmount: parseFloat(invoice.taxAmount),
          total: parseFloat(invoice.total),
          orders: ordersWithRecords,
        },
      });
    } catch (error) {
      console.error("Error in getInvoiceById:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 8. PATCH /api/billing/invoices/{invoiceId}/status - Update invoice status
  static async updateInvoiceStatus(req, res) {
    try {
      const { invoiceId } = req.params;
      const { status } = req.body;

      const [invoice] = await db
        .update(invoices)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, parseInt(invoiceId)))
        .returning();

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          updatedAt: invoice.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in updateInvoiceStatus:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 9. PATCH /api/billing/invoices/{invoiceId}/pay - Mark invoice as paid
  static async markInvoiceAsPaid(req, res) {
    try {
      const { invoiceId } = req.params;
      const { paymentDate, paymentMethod, paymentReference, notes } = req.body;

      const [invoice] = await db
        .update(invoices)
        .set({
          status: "paid",
          paymentDate: new Date(paymentDate),
          paymentMethod,
          paymentReference,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, parseInt(invoiceId)))
        .returning();

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Update related orders to paid billing status
      const orderIds = JSON.parse(invoice.orderIds);
      await db
        .update(orders)
        .set({
          billingStatus: "paid",
          updatedAt: new Date(),
        })
        .where(inArray(orders.id, orderIds));

      res.json({
        success: true,
        data: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          paymentDate: invoice.paymentDate,
          paymentMethod: invoice.paymentMethod,
          paymentReference: invoice.paymentReference,
          updatedAt: invoice.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in markInvoiceAsPaid:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 10. DELETE /api/billing/invoices/{invoiceId} - Delete invoice
  static async deleteInvoice(req, res) {
    try {
      const { invoiceId } = req.params;

      // Check if invoice exists and is in draft status
      const [invoice] = await db
        .select({ status: invoices.status })
        .from(invoices)
        .where(eq(invoices.id, parseInt(invoiceId)))
        .limit(1);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      if (invoice.status !== "draft") {
        return res.status(400).json({
          success: false,
          message: "Only draft invoices can be deleted",
        });
      }

      // Delete invoice (cascade will handle invoice records)
      await db.delete(invoices).where(eq(invoices.id, parseInt(invoiceId)));

      res.json({
        success: true,
        data: {
          message: "Invoice deleted successfully",
        },
      });
    } catch (error) {
      console.error("Error in deleteInvoice:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 11. GET /api/billing/stats - Get billing statistics
  static async getBillingStats(req, res) {
    try {
      const { dateFrom, dateTo, customerId } = req.query;

      const conditions = [];
      if (dateFrom && dateTo) {
        conditions.push(
          between(invoices.createdAt, new Date(dateFrom), new Date(dateTo))
        );
      }
      if (customerId) {
        conditions.push(eq(invoices.customerId, customerId));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get invoice statistics
      const [
        totalInvoicesResult,
        totalAmountResult,
        paidAmountResult,
        pendingAmountResult,
        overdueAmountResult,
      ] = await Promise.all([
        db.select({ count: count() }).from(invoices).where(whereClause),
        db
          .select({ total: sum(invoices.total) })
          .from(invoices)
          .where(whereClause),
        db
          .select({ total: sum(invoices.total) })
          .from(invoices)
          .where(and(whereClause, eq(invoices.status, "paid"))),
        db
          .select({ total: sum(invoices.total) })
          .from(invoices)
          .where(and(whereClause, eq(invoices.status, "sent"))),
        db
          .select({ total: sum(invoices.total) })
          .from(invoices)
          .where(and(whereClause, eq(invoices.status, "overdue"))),
      ]);

      const totalInvoices = totalInvoicesResult[0]?.count || 0;
      const totalAmount = parseFloat(totalAmountResult[0]?.total) || 0;
      const paidAmount = parseFloat(paidAmountResult[0]?.total) || 0;
      const pendingAmount = parseFloat(pendingAmountResult[0]?.total) || 0;
      const overdueAmount = parseFloat(overdueAmountResult[0]?.total) || 0;
      const averageInvoiceValue =
        totalInvoices > 0 ? totalAmount / totalInvoices : 0;

      res.json({
        success: true,
        data: {
          totalInvoices,
          totalAmount,
          paidAmount,
          pendingAmount,
          overdueAmount,
          averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
        },
      });
    } catch (error) {
      console.error("Error in getBillingStats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 12. GET /api/billing/invoices/overdue - Get overdue invoices
  static async getOverdueInvoices(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueInvoices = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: invoices.customerName,
          total: invoices.total,
          dueDate: invoices.dueDate,
          status: invoices.status,
        })
        .from(invoices)
        .where(
          and(
            lte(invoices.dueDate, today),
            or(eq(invoices.status, "sent"), eq(invoices.status, "overdue"))
          )
        )
        .orderBy(asc(invoices.dueDate));

      const result = overdueInvoices.map((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.ceil(
          (today - dueDate) / (1000 * 60 * 60 * 24)
        );

        return {
          ...invoice,
          total: parseFloat(invoice.total),
          daysOverdue,
          status: "overdue",
        };
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error in getOverdueInvoices:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 13. POST /api/billing/invoices/{invoiceId}/remind - Send invoice reminder
  static async sendInvoiceReminder(req, res) {
    try {
      const { invoiceId } = req.params;

      // Check if invoice exists
      const [invoice] = await db
        .select({
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
        })
        .from(invoices)
        .where(eq(invoices.id, parseInt(invoiceId)))
        .limit(1);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Here you would integrate with your email service
      // For now, we'll just return a success message
      console.log(`Sending reminder for invoice ${invoice.invoiceNumber}`);

      res.json({
        success: true,
        data: {
          message: "Payment reminder sent successfully",
        },
      });
    } catch (error) {
      console.error("Error in sendInvoiceReminder:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 14. GET /api/billing/invoices/{invoiceId}/pdf - Generate invoice PDF
  static async generateInvoicePDF(req, res) {
    try {
      const { invoiceId } = req.params;

      // Check if invoice exists
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, parseInt(invoiceId)))
        .limit(1);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      // Here you would generate the PDF using a library like puppeteer or pdfkit
      // For now, we'll return a placeholder response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      );
      res.send("PDF content would be generated here");
    } catch (error) {
      console.error("Error in generateInvoicePDF:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 15. PATCH /api/billing/orders/{orderId}/status - Update order billing status
  static async updateOrderBillingStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { billingStatus } = req.body;

      const [order] = await db
        .update(orders)
        .set({
          billingStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, parseInt(orderId)))
        .returning();

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      res.json({
        success: true,
        data: {
          id: order.id,
          referenceNo: order.referenceNo,
          billingStatus: order.billingStatus,
          updatedAt: order.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error in updateOrderBillingStatus:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 16. GET /api/billing/customers/{customerId}/history - Get customer billing history
  static async getCustomerBillingHistory(req, res) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 10, dateFrom, dateTo } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const conditions = [eq(invoices.customerId, customerId)];

      if (dateFrom && dateTo) {
        conditions.push(
          between(invoices.createdAt, new Date(dateFrom), new Date(dateTo))
        );
      }

      const whereClause = and(...conditions);

      // Get customer invoices
      const customerInvoices = await db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          total: invoices.total,
          status: invoices.status,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .where(whereClause)
        .orderBy(desc(invoices.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      // Get customer orders
      const customerOrders = await db
        .select({
          id: orders.id,
          referenceNo: orders.referenceNo,
          quantity: orders.quantity,
          amount: orders.amount,
          status: orders.status,
          billingStatus: orders.billingStatus,
          date: orders.date,
        })
        .from(orders)
        .where(eq(orders.customerId, customerId))
        .orderBy(desc(orders.createdAt))
        .limit(parseInt(limit))
        .offset(offset);

      // Get total counts
      const [invoiceCountResult, orderCountResult] = await Promise.all([
        db.select({ count: count() }).from(invoices).where(whereClause),
        db
          .select({ count: count() })
          .from(orders)
          .where(eq(orders.customerId, customerId)),
      ]);

      const totalInvoiceItems = invoiceCountResult[0]?.count || 0;
      const totalOrderItems = orderCountResult[0]?.count || 0;
      const totalPages = Math.ceil(
        Math.max(totalInvoiceItems, totalOrderItems) / parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          invoices: customerInvoices.map((invoice) => ({
            ...invoice,
            total: parseFloat(invoice.total),
          })),
          orders: customerOrders.map((order) => ({
            ...order,
            amount: parseFloat(order.amount) || 0,
            billingStatus: order.billingStatus || "pending",
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: Math.max(totalInvoiceItems, totalOrderItems),
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error("Error in getCustomerBillingHistory:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  // 6. GET /api/billing/income - Get income analytics with time range
  static async getIncomeAnalytics(req, res) {
    try {
      const { startDate, endDate } = req.query;

      // Validate required date parameters
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      // Extend end date by 1 day to include the full end date
      end.setDate(end.getDate() + 1);

      // Get total revenue from invoices within date range
      const [totalRevenueResult] = await db
        .select({
          totalRevenue: sum(invoices.total),
          recordCount: count(),
        })
        .from(invoices)
        .where(between(invoices.createdAt, start, end));

      // Get total income (sum of payment field from invoices)
      const [totalIncomeResult] = await db
        .select({
          totalIncome: sum(invoices.payment),
          recordCount: count(),
        })
        .from(invoices)
        .where(between(invoices.createdAt, start, end));

      // Get pending income (invoices with status "draft" or "sent")
      const [pendingIncomeResult] = await db
        .select({
          pendingIncome: sum(invoices.total),
          recordCount: count(),
        })
        .from(invoices)
        .where(
          and(
            or(eq(invoices.status, "draft"), eq(invoices.status, "sent")),
            between(invoices.createdAt, start, end)
          )
        );

      res.json({
        success: true,
        data: {
          period: {
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
          },
          summary: {
            totalRevenue: parseFloat(totalRevenueResult.totalRevenue) || 0,
            totalIncome: parseFloat(totalIncomeResult.totalIncome) || 0,
            pendingIncome: parseFloat(pendingIncomeResult.pendingIncome) || 0,
            totalRecords: totalRevenueResult.recordCount || 0,
            paidRecords: totalIncomeResult.recordCount || 0,
            invoicedRecords: pendingIncomeResult.recordCount || 0,
          },
        },
      });
    } catch (error) {
      console.error("Error getting income analytics:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Helper method to get income by time period
  static async getIncomeByPeriod(startDate, endDate, groupBy) {
    let dateFormat;
    switch (groupBy) {
      case "day":
        dateFormat = sql`DATE(${invoices.paymentDate})`;
        break;
      case "week":
        dateFormat = sql`DATE_TRUNC('week', ${invoices.paymentDate})`;
        break;
      case "month":
        dateFormat = sql`DATE_TRUNC('month', ${invoices.paymentDate})`;
        break;
      case "year":
        dateFormat = sql`DATE_TRUNC('year', ${invoices.paymentDate})`;
        break;
      default:
        dateFormat = sql`DATE(${invoices.paymentDate})`;
    }

    const incomeByPeriod = await db
      .select({
        period: dateFormat,
        totalIncome: sum(invoices.payment),
        invoiceCount: count(),
      })
      .from(invoices)
      .where(between(invoices.createdAt, startDate, endDate))
      .groupBy(dateFormat)
      .orderBy(asc(dateFormat));

    return incomeByPeriod.map((item) => ({
      period: item.period,
      totalIncome: parseFloat(item.totalIncome || 0),
      invoiceCount: item.invoiceCount,
    }));
  }

  // 7. GET /api/billing/income/summary - Get income summary for dashboard
  static async getIncomeSummary(req, res) {
    try {
      const { period = "month" } = req.query;

      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case "day":
          startDate.setDate(startDate.getDate() - 1);
          break;
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get current period income
      const [currentPeriodResult] = await db
        .select({
          totalIncome: sum(invoices.payment),
          invoiceCount: count(),
        })
        .from(invoices)
        .where(between(invoices.createdAt, startDate, endDate));

      // Get previous period for comparison
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(startDate);

      switch (period) {
        case "day":
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          break;
        case "week":
          previousStartDate.setDate(previousStartDate.getDate() - 7);
          break;
        case "month":
          previousStartDate.setMonth(previousStartDate.getMonth() - 1);
          break;
        case "year":
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
          break;
      }

      const [previousPeriodResult] = await db
        .select({
          totalIncome: sum(invoices.payment),
          invoiceCount: count(),
        })
        .from(invoices)
        .where(between(invoices.createdAt, previousStartDate, previousEndDate));

      const currentIncome = parseFloat(currentPeriodResult.totalIncome || 0);
      const previousIncome = parseFloat(previousPeriodResult.totalIncome || 0);
      const growthRate =
        previousIncome > 0
          ? ((currentIncome - previousIncome) / previousIncome) * 100
          : 0;

      // Get average invoice value
      const avgInvoiceValue =
        currentPeriodResult.invoiceCount > 0
          ? currentIncome / currentPeriodResult.invoiceCount
          : 0;

      res.json({
        success: true,
        data: {
          period,
          currentPeriod: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: endDate.toISOString().split("T")[0],
            totalIncome: currentIncome,
            invoiceCount: currentPeriodResult.invoiceCount || 0,
            averageInvoiceValue: avgInvoiceValue,
          },
          previousPeriod: {
            startDate: previousStartDate.toISOString().split("T")[0],
            endDate: previousEndDate.toISOString().split("T")[0],
            totalIncome: previousIncome,
            invoiceCount: previousPeriodResult.invoiceCount || 0,
          },
          growth: {
            amount: currentIncome - previousIncome,
            percentage: growthRate,
          },
        },
      });
    } catch (error) {
      console.error("Error getting income summary:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // 8. GET /api/billing/income/trends - Get income trends over time
  static async getIncomeTrends(req, res) {
    try {
      const { startDate, endDate, groupBy = "day", limit = 30 } = req.query;

      const defaultEndDate = new Date();
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - parseInt(limit));

      const start = startDate ? new Date(startDate) : defaultStartDate;
      const end = endDate ? new Date(endDate) : defaultEndDate;

      const trends = await BillingController.getIncomeByPeriod(
        start,
        end,
        groupBy
      );

      res.json({
        success: true,
        data: {
          period: {
            startDate: start.toISOString().split("T")[0],
            endDate: end.toISOString().split("T")[0],
            groupBy,
          },
          trends,
        },
      });
    } catch (error) {
      console.error("Error getting income trends:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // 9. GET /api/billing/top-customers - Get top customers by revenue
  static async getTopCustomers(req, res) {
    try {
      const { startDate, endDate, limit = 5 } = req.query;

      // Validate required date parameters
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      // Extend end date by 1 day to include the full end date
      end.setDate(end.getDate() + 1);

      // Get top customers by total invoiced amount from invoices
      const { pool } = require("../config/db");
      const topCustomersResult = await pool.query(
        `
        SELECT 
          c.id as customer_id,
          c.first_name,
          c.last_name,
          SUM(i.total) as total_invoiced,
          COUNT(i.id) as invoice_count
        FROM invoices i
        INNER JOIN customers c ON i.customer_id = c.id::text
        WHERE i.created_at BETWEEN $1 AND $2
        GROUP BY c.id, c.first_name, c.last_name
        ORDER BY SUM(i.total) DESC
        LIMIT $3
      `,
        [start, end, parseInt(limit)]
      );

      const topCustomers = topCustomersResult.rows;

      res.json({
        success: true,
        data: topCustomers.map((customer) => ({
          customerId: customer.customer_id.toString(),
          customerName: `${customer.first_name} ${customer.last_name}`,
          totalInvoiced: parseFloat(customer.total_invoiced) || 0,
          invoiceCount: customer.invoice_count || 0,
        })),
      });
    } catch (error) {
      console.error("Error getting top customers:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // 15. PATCH /api/billing/invoices/:invoiceId/payment - Update invoice payment
  static async updateInvoicePayment(req, res) {
    try {
      const { invoiceId } = req.params;
      const { paymentAmount } = req.body;

      // Validation
      if (!paymentAmount || paymentAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Payment amount must be greater than 0",
        });
      }

      // Get invoice details
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, parseInt(invoiceId)))
        .limit(1);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found",
        });
      }

      const currentPayment = parseFloat(invoice.payment || 0);
      const total = parseFloat(invoice.total);
      const newPayment = currentPayment + parseFloat(paymentAmount);
      const remaining = total - newPayment;

      // Update invoice payment
      console.log("📝 TABLE UPDATE: invoices (payment)");
      await db
        .update(invoices)
        .set({
          payment: newPayment.toString(),
          paymentDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, parseInt(invoiceId)));

      // Update customer balance
      console.log("📝 TABLE UPDATE: customers (balance)");
      const { customers } = require("../db/schema");
      await db
        .update(customers)
        .set({
          balance: remaining.toString(),
          updatedAt: new Date(),
        })
        .where(eq(customers.id, invoice.customerId));

      // If payment equals total, mark as paid
      if (newPayment >= total) {
        console.log("📝 TABLE UPDATE: invoices (status)");
        await db
          .update(invoices)
          .set({
            status: "paid",
            updatedAt: new Date(),
          })
          .where(eq(invoices.id, parseInt(invoiceId)));

        // Update order billing statuses to "paid"
        console.log("📝 TABLE UPDATE: orders (billing status)");
        const orderIds = JSON.parse(invoice.orderIds);
        await db
          .update(orders)
          .set({
            billingStatus: "paid",
            updatedAt: new Date(),
          })
          .where(inArray(orders.id, orderIds));
      }

      // Get updated invoice
      const [updatedInvoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, parseInt(invoiceId)))
        .limit(1);

      res.json({
        success: true,
        message: "Payment updated successfully",
        data: {
          invoiceId: parseInt(invoiceId),
          paymentAmount: parseFloat(paymentAmount),
          totalPayment: newPayment,
          remaining: Math.max(0, remaining),
          isFullyPaid: newPayment >= total,
          status: updatedInvoice.status,
        },
      });
    } catch (error) {
      console.error("Error updating invoice payment:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = BillingController;
