# Billing & Income API Documentation

## Overview

This document provides comprehensive API documentation for the billing and income tracking system. The API supports invoice management, payment tracking, income analytics, and financial reporting.

## Base URL

```
http://localhost:3000/api/billing
```

## Authentication

All endpoints require proper authentication. Include authentication headers as needed.

---

## 1. Invoice Management

### 1.1 Create Invoice

**POST** `/invoices`

Creates a new invoice for one or more orders.

**Request Body:**

```json
{
  "invoiceNumber": "INV-001", // Optional - auto-generated if not provided
  "customerName": "Customer 001",
  "orderIds": [12, 11],
  "records": [
    {
      "orderId": 12,
      "recordId": 27,
      "unitPrice": 200,
      "totalPrice": 1000
    }
  ],
  "orderTotals": [
    {
      "orderId": 12,
      "totalPrice": 1920
    }
  ],
  "taxRate": 0,
  "paymentTerms": 30
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-001",
    "customerId": "1",
    "customerName": "Customer 001",
    "orderIds": [12, 11],
    "subtotal": 2220,
    "taxRate": 0,
    "taxAmount": 0,
    "total": 2220,
    "paymentTerms": 30,
    "dueDate": "2025-10-16",
    "status": "draft",
    "createdAt": "2025-09-16T18:29:42.077Z",
    "updatedAt": "2025-09-16T18:29:42.077Z"
  }
}
```

### 1.2 Get All Invoices

**GET** `/invoices`

Retrieves all invoices with pagination and filtering.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by status (draft, sent, paid, overdue)
- `customerId` (string): Filter by customer ID
- `startDate` (string): Filter from date (YYYY-MM-DD)
- `endDate` (string): Filter to date (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": 1,
        "invoiceNumber": "INV-001",
        "customerId": "1",
        "customerName": "Customer 001",
        "orderIds": [12, 11],
        "subtotal": 2220,
        "taxRate": 0,
        "taxAmount": 0,
        "total": 2220,
        "paymentTerms": 30,
        "dueDate": "2025-10-16",
        "status": "draft",
        "paymentDate": null,
        "paymentMethod": null,
        "paymentReference": null,
        "notes": null,
        "createdAt": "2025-09-16T18:29:42.077Z",
        "updatedAt": "2025-09-16T18:29:42.077Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 1.3 Get Invoice by ID

**GET** `/invoices/:invoiceId`

Retrieves a specific invoice with full details.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "invoiceNumber": "INV-001",
    "customerId": "1",
    "customerName": "Customer 001",
    "orderIds": [12, 11],
    "subtotal": 2220,
    "taxRate": 0,
    "taxAmount": 0,
    "total": 2220,
    "paymentTerms": 30,
    "dueDate": "2025-10-16",
    "status": "draft",
    "paymentDate": null,
    "paymentMethod": null,
    "paymentReference": null,
    "notes": null,
    "createdAt": "2025-09-16T18:29:42.077Z",
    "updatedAt": "2025-09-16T18:29:42.077Z",
    "orderDetails": [
      {
        "id": 12,
        "referenceNo": "ORD011",
        "customerId": "1",
        "customerName": "Customer 1",
        "date": "2025-09-11",
        "quantity": 9,
        "amount": 1920,
        "status": "Invoiced",
        "billingStatus": "invoiced"
      }
    ]
  }
}
```

### 1.4 Mark Invoice as Paid

**PATCH** `/invoices/:invoiceId/pay`

Marks an invoice as paid and updates payment details.

**Request Body:**

```json
{
  "paymentMethod": "cash",
  "paymentReference": "PAY-001",
  "notes": "Payment received"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "paid",
    "paymentDate": "2025-09-16T18:30:00.000Z",
    "paymentMethod": "cash",
    "paymentReference": "PAY-001",
    "notes": "Payment received"
  }
}
```

### 1.5 Generate Invoice PDF

**GET** `/invoices/:invoiceId/pdf`

Generates and returns a PDF version of the invoice.

**Response:** PDF file download

---

## 2. Order Billing Management

### 2.1 Get Billing Orders

**GET** `/orders`

Retrieves orders with billing status filtering.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `customerName` (string): Filter by customer name
- `orderId` (number): Filter by specific order ID
- `billingStatus` (string): Filter by billing status (pending, invoiced, paid)
- `dateFrom` (string): Filter from date (YYYY-MM-DD)
- `dateTo` (string): Filter to date (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 12,
        "referenceNo": "ORD011",
        "customerId": "1",
        "customerName": "Customer 1",
        "date": "2025-09-11",
        "quantity": 9,
        "amount": 1920,
        "status": "Invoiced",
        "billingStatus": "invoiced",
        "createdAt": "2025-09-11T15:23:48.762Z",
        "updatedAt": "2025-09-16T18:29:42.077Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 2.2 Update Order Billing Status

**PATCH** `/orders/:orderId/status`

Updates the billing status of a specific order.

**Request Body:**

```json
{
  "billingStatus": "invoiced"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 12,
    "billingStatus": "invoiced",
    "updatedAt": "2025-09-16T18:30:00.000Z"
  }
}
```

### 2.3 Calculate Order Pricing

**POST** `/orders/pricing`

Calculates pricing for orders and records.

**Request Body:**

```json
{
  "orderIds": [12, 11],
  "records": [
    {
      "orderId": 12,
      "recordId": 27,
      "unitPrice": 200,
      "totalPrice": 1000
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderTotals": [
      {
        "orderId": 12,
        "totalPrice": 1920
      }
    ],
    "grandTotal": 2220
  }
}
```

---

## 3. Income Analytics & Reporting

### 3.1 Get Income Analytics

**GET** `/income`

Comprehensive income analytics with time range filtering.

**Query Parameters:**

- `startDate` (string): Start date (YYYY-MM-DD, default: 30 days ago)
- `endDate` (string): End date (YYYY-MM-DD, default: today)
- `period` (string): Period type (day, week, month, year, default: month)
- `groupBy` (string): Grouping for time series (day, week, month, year, default: day)

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-08-17",
      "endDate": "2025-09-16",
      "groupBy": "day"
    },
    "summary": {
      "totalIncome": 15000.0,
      "totalInvoices": 25,
      "pendingIncome": 5000.0,
      "pendingInvoices": 8,
      "overdueIncome": 2000.0,
      "overdueInvoices": 3
    },
    "incomeByPeriod": [
      {
        "period": "2025-09-15",
        "totalIncome": 1200.0,
        "invoiceCount": 2
      },
      {
        "period": "2025-09-16",
        "totalIncome": 800.0,
        "invoiceCount": 1
      }
    ],
    "topCustomers": [
      {
        "customerId": "1",
        "customerName": "Customer 1",
        "totalPaid": 5000.0,
        "invoiceCount": 10
      }
    ]
  }
}
```

### 3.2 Get Income Summary

**GET** `/income/summary`

Income summary for dashboard with period comparison.

**Query Parameters:**

- `period` (string): Period type (day, week, month, year, default: month)

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "month",
    "currentPeriod": {
      "startDate": "2025-08-16",
      "endDate": "2025-09-16",
      "totalIncome": 15000.0,
      "invoiceCount": 25,
      "averageInvoiceValue": 600.0
    },
    "previousPeriod": {
      "startDate": "2025-07-16",
      "endDate": "2025-08-16",
      "totalIncome": 12000.0,
      "invoiceCount": 20
    },
    "growth": {
      "amount": 3000.0,
      "percentage": 25.0
    }
  }
}
```

### 3.3 Get Income Trends

**GET** `/income/trends`

Income trends over time for charts and graphs.

**Query Parameters:**

- `startDate` (string): Start date (YYYY-MM-DD, default: 30 days ago)
- `endDate` (string): End date (YYYY-MM-DD, default: today)
- `groupBy` (string): Grouping (day, week, month, year, default: day)
- `limit` (number): Number of data points (default: 30)

**Response:**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2025-08-17",
      "endDate": "2025-09-16",
      "groupBy": "day"
    },
    "trends": [
      {
        "period": "2025-09-15",
        "totalIncome": 1200.0,
        "invoiceCount": 2
      },
      {
        "period": "2025-09-16",
        "totalIncome": 800.0,
        "invoiceCount": 1
      }
    ]
  }
}
```

---

## 4. Customer Billing History

### 4.1 Get Customer Billing History

**GET** `/customers/:customerId/history`

Retrieves complete billing history for a specific customer.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response:**

```json
{
  "success": true,
  "data": {
    "customerId": 1,
    "invoices": [
      {
        "id": 1,
        "invoiceNumber": "INV-001",
        "total": 2220.0,
        "status": "paid",
        "paymentDate": "2025-09-16T18:30:00.000Z",
        "createdAt": "2025-09-16T18:29:42.077Z"
      }
    ],
    "orders": [
      {
        "id": 12,
        "referenceNo": "ORD011",
        "date": "2025-09-11",
        "quantity": 9,
        "amount": 1920.0,
        "status": "Invoiced",
        "billingStatus": "paid"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

---

## 5. Updated Orders API

### 5.1 Get Orders (Updated)

**GET** `/api/orders`

The existing orders endpoint now includes `billingStatus` field.

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term
- `status` (string): Filter by order status
- `customerId` (string): Filter by customer ID
- `customerName` (string): Filter by customer name
- `orderId` (number): Filter by specific order ID

**Response:**

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 12,
        "date": "2025-09-11",
        "referenceNo": "ORD011",
        "customerId": "1",
        "customerName": "Customer 1",
        "quantity": 9,
        "notes": null,
        "deliveryDate": "2025-09-25",
        "status": "Invoiced",
        "billingStatus": "invoiced",
        "recordsCount": 2,
        "complete": true,
        "createdAt": "2025-09-11T15:23:48.762Z",
        "updatedAt": "2025-09-16T18:29:42.077Z",
        "records": []
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalRecords": 10,
      "limit": 10
    }
  }
}
```

---

## 6. Data Models

### 6.1 Invoice Status Values

- `draft`: Invoice created but not finalized
- `sent`: Invoice sent to customer
- `paid`: Payment received
- `overdue`: Payment past due date

### 6.2 Billing Status Values

- `pending`: Order not yet invoiced
- `invoiced`: Order has been invoiced
- `paid`: Order payment received

### 6.3 Payment Methods

- `cash`: Cash payment
- `bank_transfer`: Bank transfer
- `check`: Check payment
- `credit_card`: Credit card payment
- `other`: Other payment method

---

## 7. Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

**Common HTTP Status Codes:**

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

---

## 8. Usage Examples

### 8.1 Create Invoice and Track Payment

```javascript
// 1. Create invoice
const invoiceResponse = await fetch('/api/billing/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerName: 'Customer 001',
    orderIds: [12, 11],
    records: [...],
    orderTotals: [...],
    taxRate: 0,
    paymentTerms: 30
  })
});

// 2. Mark as paid
const paymentResponse = await fetch(`/api/billing/invoices/${invoiceId}/pay`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentMethod: 'cash',
    paymentReference: 'PAY-001'
  })
});
```

### 8.2 Get Income Analytics for Dashboard

```javascript
// Get monthly income summary
const summaryResponse = await fetch("/api/billing/income/summary?period=month");

// Get income trends for chart
const trendsResponse = await fetch(
  "/api/billing/income/trends?groupBy=day&limit=30"
);

// Get comprehensive analytics
const analyticsResponse = await fetch(
  "/api/billing/income?startDate=2025-08-01&endDate=2025-09-01"
);
```

### 8.3 Filter Orders by Billing Status

```javascript
// Get all pending orders
const pendingOrders = await fetch("/api/billing/orders?billingStatus=pending");

// Get paid orders for specific customer
const paidOrders = await fetch(
  "/api/billing/orders?customerName=Customer+001&billingStatus=paid"
);
```

---

## 9. Frontend Integration Notes

### 9.1 Dashboard Components

- Use `/income/summary` for key metrics cards
- Use `/income/trends` for income charts
- Use `/income` for detailed analytics page

### 9.2 Invoice Management

- Use `/invoices` for invoice listing with pagination
- Use `/invoices/:id` for invoice details
- Use `/invoices/:id/pdf` for PDF generation

### 9.3 Order Management

- Use `/api/orders` for order listing (includes billingStatus)
- Use `/billing/orders` for billing-specific order management
- Use `/billing/orders/:id/status` to update billing status

### 9.4 Customer Management

- Use `/customers/:id/history` for customer billing history
- Use `/income` with customer filtering for customer-specific analytics

---

## 10. Performance Considerations

- All list endpoints support pagination
- Use appropriate `limit` values to avoid large responses
- Date range filtering is recommended for analytics endpoints
- Consider caching for frequently accessed data like income summaries

---

## 11. Testing

Test the API endpoints using tools like Postman, curl, or your frontend application:

```bash
# Test income summary
curl "http://localhost:3000/api/billing/income/summary?period=month"

# Test invoice creation
curl -X POST "http://localhost:3000/api/billing/invoices" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test Customer","orderIds":[1],"records":[],"orderTotals":[],"taxRate":0,"paymentTerms":30}'
```

---

This documentation provides comprehensive coverage of all billing and income-related endpoints. The API is designed to support modern frontend applications with proper pagination, filtering, and analytics capabilities.
