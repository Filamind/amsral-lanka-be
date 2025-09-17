# Billing API Specification

This document outlines the required API endpoints for the billing system functionality.

## Base URL

All endpoints are prefixed with `/api/billing`

## Authentication

All endpoints require authentication via JWT token in the Authorization header.

---

## 1. Get Billing Orders

**Endpoint:** `GET /api/billing/orders`

**Description:** Retrieve orders with billing status information

**Query Parameters:**

- `page` (optional, number): Page number for pagination (default: 1)
- `limit` (optional, number): Number of items per page (default: 10)
- `customerName` (optional, string): Filter by customer name
- `orderId` (optional, string): Filter by order ID
- `billingStatus` (optional, string): Filter by billing status (`pending`, `invoiced`, `paid`)
- `dateFrom` (optional, string): Filter orders from date (YYYY-MM-DD)
- `dateTo` (optional, string): Filter orders to date (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 1,
        "referenceNo": "ORD001",
        "customerName": "Customer 1",
        "customerId": "1",
        "date": "2024-01-15",
        "quantity": 50,
        "billingStatus": "pending",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 2. Create Invoice

**Endpoint:** `POST /api/billing/invoices`

**Description:** Create a new invoice from selected orders

**Request Body:**

```json
{
  "invoiceNumber": "INV-2024-001",
  "customerName": "Customer 1",
  "orderIds": [1, 2, 3],
  "records": [
    {
      "orderId": 1,
      "recordId": 1,
      "unitPrice": 5.5,
      "totalPrice": 55.0
    },
    {
      "orderId": 1,
      "recordId": 2,
      "unitPrice": 7.25,
      "totalPrice": 72.5
    }
  ],
  "orderTotals": [
    {
      "orderId": 1,
      "totalPrice": 127.5
    },
    {
      "orderId": 2,
      "totalPrice": 200.0
    }
  ],
  "taxRate": 0.1,
  "paymentTerms": 30,
  "notes": "Optional invoice notes"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2024-001",
    "customerName": "Customer 1",
    "customerId": "1",
    "orderIds": [1, 2, 3],
    "subtotal": 150.0,
    "taxRate": 0.1,
    "taxAmount": 15.0,
    "total": 165.0,
    "paymentTerms": 30,
    "dueDate": "2024-02-15",
    "status": "draft",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "orders": [
      {
        "id": 1,
        "referenceNo": "ORD001",
        "customerName": "Customer 1",
        "date": "2024-01-15",
        "quantity": 50,
        "billingStatus": "invoiced"
      }
    ]
  }
}
```

---

## 3. Save Order and Record Pricing

**Endpoint:** `POST /api/billing/orders/pricing`

**Description:** Save unit prices and total prices for orders and their records

**Request Body:**

```json
{
  "orderPricing": [
    {
      "orderId": 1,
      "totalPrice": 127.5,
      "records": [
        {
          "recordId": 1,
          "unitPrice": 5.5,
          "totalPrice": 55.0
        },
        {
          "recordId": 2,
          "unitPrice": 7.25,
          "totalPrice": 72.5
        }
      ]
    },
    {
      "orderId": 2,
      "totalPrice": 200.0,
      "records": [
        {
          "recordId": 3,
          "unitPrice": 8.0,
          "totalPrice": 80.0
        },
        {
          "recordId": 4,
          "unitPrice": 12.0,
          "totalPrice": 120.0
        }
      ]
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Order and record pricing saved successfully",
    "savedOrders": [
      {
        "orderId": 1,
        "totalPrice": 127.5,
        "recordsCount": 2
      },
      {
        "orderId": 2,
        "totalPrice": 200.0,
        "recordsCount": 2
      }
    ]
  }
}
```

---

## 4. Get Order Pricing History

**Endpoint:** `GET /api/billing/orders/{orderId}/pricing`

**Description:** Get pricing history for a specific order

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": 1,
    "currentPricing": {
      "totalPrice": 127.5,
      "lastUpdated": "2024-01-15T10:00:00Z",
      "records": [
        {
          "recordId": 1,
          "itemName": "Denim Jeans",
          "quantity": 10,
          "unitPrice": 5.5,
          "totalPrice": 55.0,
          "lastUpdated": "2024-01-15T10:00:00Z"
        },
        {
          "recordId": 2,
          "itemName": "Cotton Shirt",
          "quantity": 10,
          "unitPrice": 7.25,
          "totalPrice": 72.5,
          "lastUpdated": "2024-01-15T10:00:00Z"
        }
      ]
    },
    "pricingHistory": [
      {
        "id": 1,
        "totalPrice": 120.0,
        "createdAt": "2024-01-10T09:00:00Z",
        "createdBy": "admin@amsral.com",
        "notes": "Initial pricing"
      }
    ]
  }
}
```

---

## 5. Update Order Record Pricing

**Endpoint:** `PATCH /api/billing/orders/{orderId}/records/{recordId}/pricing`

**Description:** Update pricing for a specific order record

**Request Body:**

```json
{
  "unitPrice": 6.0,
  "notes": "Price updated due to material cost increase"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "recordId": 1,
    "orderId": 1,
    "itemName": "Denim Jeans",
    "quantity": 10,
    "unitPrice": 6.0,
    "totalPrice": 60.0,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## 6. Get Invoices

**Endpoint:** `GET /api/billing/invoices`

**Description:** Retrieve all invoices with filtering options

**Query Parameters:**

- `page` (optional, number): Page number for pagination
- `limit` (optional, number): Number of items per page
- `customerName` (optional, string): Filter by customer name
- `status` (optional, string): Filter by invoice status (`draft`, `sent`, `paid`, `overdue`)
- `dateFrom` (optional, string): Filter invoices from date
- `dateTo` (optional, string): Filter invoices to date

**Response:**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 1,
        "invoiceNumber": "INV-2024-001",
        "customerName": "Customer 1",
        "customerId": "1",
        "subtotal": 150.0,
        "taxAmount": 15.0,
        "total": 165.0,
        "status": "sent",
        "dueDate": "2024-02-15",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## 4. Get Invoice by ID

**Endpoint:** `GET /api/billing/invoices/{invoiceId}`

**Description:** Retrieve a specific invoice with full details

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2024-001",
    "customerName": "Customer 1",
    "customerId": "1",
    "customerAddress": "123 Main St, City, State 12345",
    "customerPhone": "(555) 123-4567",
    "orderIds": [1, 2, 3],
    "subtotal": 150.0,
    "taxRate": 0.1,
    "taxAmount": 15.0,
    "total": 165.0,
    "paymentTerms": 30,
    "dueDate": "2024-02-15",
    "status": "sent",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "orders": [
      {
        "id": 1,
        "referenceNo": "ORD001",
        "orderDate": "2024-01-15",
        "records": [
          {
            "id": 1,
            "orderId": 1,
            "itemName": "Denim Jeans",
            "quantity": 10,
            "unitPrice": 5.5,
            "totalPrice": 55.0,
            "washType": "Heavy",
            "processTypes": ["Stone Wash", "Enzyme Wash"]
          }
        ]
      }
    ]
  }
}
```

---

## 5. Update Invoice Status

**Endpoint:** `PATCH /api/billing/invoices/{invoiceId}/status`

**Description:** Update the status of an invoice

**Request Body:**

```json
{
  "status": "sent"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2024-001",
    "status": "sent",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

## 6. Mark Invoice as Paid

**Endpoint:** `PATCH /api/billing/invoices/{invoiceId}/pay`

**Description:** Mark an invoice as paid with payment details

**Request Body:**

```json
{
  "paymentDate": "2024-01-20",
  "paymentMethod": "bank_transfer",
  "paymentReference": "TXN-123456789",
  "notes": "Payment received via bank transfer"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-2024-001",
    "status": "paid",
    "paymentDate": "2024-01-20",
    "paymentMethod": "bank_transfer",
    "paymentReference": "TXN-123456789",
    "updatedAt": "2024-01-20T14:30:00Z"
  }
}
```

---

## 7. Delete Invoice

**Endpoint:** `DELETE /api/billing/invoices/{invoiceId}`

**Description:** Delete an invoice (only if status is 'draft')

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Invoice deleted successfully"
  }
}
```

---

## 8. Get Billing Statistics

**Endpoint:** `GET /api/billing/stats`

**Description:** Get billing statistics and summary data

**Query Parameters:**

- `dateFrom` (optional, string): Start date for statistics
- `dateTo` (optional, string): End date for statistics
- `customerId` (optional, string): Filter by specific customer

**Response:**

```json
{
  "success": true,
  "data": {
    "totalInvoices": 150,
    "totalAmount": 25000.0,
    "paidAmount": 20000.0,
    "pendingAmount": 3000.0,
    "overdueAmount": 2000.0,
    "averageInvoiceValue": 166.67
  }
}
```

---

## 9. Get Overdue Invoices

**Endpoint:** `GET /api/billing/invoices/overdue`

**Description:** Get all invoices that are past their due date

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "invoiceNumber": "INV-2024-005",
      "customerName": "Customer 2",
      "total": 250.0,
      "dueDate": "2024-01-10",
      "daysOverdue": 5,
      "status": "overdue"
    }
  ]
}
```

---

## 10. Send Invoice Reminder

**Endpoint:** `POST /api/billing/invoices/{invoiceId}/remind`

**Description:** Send a payment reminder for an invoice

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Payment reminder sent successfully"
  }
}
```

---

## 11. Generate Invoice PDF

**Endpoint:** `GET /api/billing/invoices/{invoiceId}/pdf`

**Description:** Generate and download invoice PDF

**Response:** PDF file (binary)

---

## 12. Update Order Billing Status

**Endpoint:** `PATCH /api/billing/orders/{orderId}/status`

**Description:** Update the billing status of an order

**Request Body:**

```json
{
  "status": "invoiced"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "referenceNo": "ORD001",
    "billingStatus": "invoiced",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 13. Get Customer Billing History

**Endpoint:** `GET /api/billing/customers/{customerId}/history`

**Description:** Get billing history for a specific customer

**Query Parameters:**

- `page` (optional, number): Page number for pagination
- `limit` (optional, number): Number of items per page
- `dateFrom` (optional, string): Filter from date
- `dateTo` (optional, string): Filter to date

**Response:**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 1,
        "invoiceNumber": "INV-2024-001",
        "total": 165.0,
        "status": "paid",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "orders": [
      {
        "id": 1,
        "referenceNo": "ORD001",
        "quantity": 50,
        "billingStatus": "paid",
        "date": "2024-01-15"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**

```json
{
  "success": false,
  "message": "Invalid request parameters"
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

**404 Not Found:**

```json
{
  "success": false,
  "message": "Resource not found"
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Database Schema Requirements

### Orders Table

Add the following columns to the existing orders table:

```sql
ALTER TABLE orders ADD COLUMN billing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN total_price DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN pricing_updated_at TIMESTAMP;
```

### Invoices Table

```sql
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  order_ids INTEGER[] NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,4) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_terms INTEGER NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  payment_date DATE,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoice Records Table

```sql
CREATE TABLE invoice_records (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL,
  record_id INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order Record Pricing Table

```sql
CREATE TABLE order_record_pricing (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  record_id INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  notes TEXT,
  UNIQUE(order_id, record_id)
);
```

### Order Pricing History Table

```sql
CREATE TABLE order_pricing_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  notes TEXT
);
```

### Order Record Pricing History Table

```sql
CREATE TABLE order_record_pricing_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  record_id INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  notes TEXT
);
```

---

## Implementation Notes

1. **Invoice Number Generation**: Implement auto-generation of invoice numbers (e.g., INV-YYYY-NNNN)
2. **Due Date Calculation**: Calculate due date based on invoice date + payment terms
3. **Status Management**: Automatically update order billing status when invoice is created
4. **PDF Generation**: Use a PDF library to generate professional invoices
5. **Email Integration**: Implement email sending for invoice delivery and reminders
6. **Audit Trail**: Log all billing status changes for audit purposes
7. **Validation**: Ensure unit prices are positive numbers and required fields are present
8. **Permissions**: Only admin users should have access to billing functionality
9. **Pricing Management**:
   - Save unit prices and total prices for each order record when creating invoices
   - Maintain pricing history for audit and tracking purposes
   - Update order total prices when record pricing changes
   - Validate that total price equals sum of all record prices for each order
10. **Data Integrity**:
    - Ensure pricing data is saved before creating invoices
    - Maintain referential integrity between orders, records, and pricing tables
    - Implement soft deletes for pricing history to maintain audit trail
