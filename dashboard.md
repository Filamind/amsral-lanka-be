# Dashboard API Endpoints

This document outlines all the API endpoints used by the Dashboard page.

## Dashboard Service Endpoints

### 1. Quick Stats

- **Endpoint**: `GET /dashboard/quick-stats`
- **Purpose**: Get summary statistics for dashboard cards
- **Request**: Query params: `startDate`, `endDate`
- **Response**:

```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "completedOrders": 120,
    "pendingOrders": 20,
    "inProgressOrders": 10,
    "totalRevenue": 50000,
    "averageOrderValue": 333.33
  }
}
```

### 2. Orders Trend

- **Endpoint**: `GET /dashboard/orders-trend`
- **Purpose**: Get daily order and revenue trends for charts
- **Request**: Query params: `startDate`, `endDate`, `period`
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "orders": 5,
      "revenue": 2500
    }
  ]
}
```

### 3. Order Status Distribution

- **Endpoint**: `GET /dashboard/order-status-distribution`
- **Purpose**: Get order counts by status for pie charts
- **Request**: Query params: `startDate`, `endDate`, `period`
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "status": "Complete",
      "count": 120,
      "percentage": 80
    }
  ]
}
```

### 4. Recent Orders

- **Endpoint**: `GET /dashboard/recent-orders`
- **Purpose**: Get latest orders for recent orders table
- **Request**: Query param: `limit=10`
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "referenceNo": "ORD001",
      "customerName": "Customer Name",
      "status": "Complete",
      "quantity": 50,
      "totalAmount": 2500,
      "orderDate": "2024-01-15"
    }
  ]
}
```

## Income Service Endpoints

### 5. Income Summary

- **Endpoint**: `GET /billing/income`
- **Purpose**: Get income summary with filters
- **Request**: Query params: `startDate`, `endDate`, `period`
- **Response**:

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "summary": {
      "totalRevenue": 50000,
      "totalIncome": 45000,
      "pendingIncome": 5000,
      "totalRecords": 100,
      "paidRecords": 90,
      "invoicedRecords": 10
    }
  }
}
```

### 6. Income Trends

- **Endpoint**: `GET /billing/income/trends`
- **Purpose**: Get income trends for charts
- **Request**: Query params: `startDate`, `endDate`, `groupBy`, `limit`
- **Response**:

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "groupBy": "day"
    },
    "trends": [
      {
        "period": "2024-01-15",
        "totalIncome": 2500,
        "invoiceCount": 5
      }
    ]
  }
}
```

### 7. Top Customers

- **Endpoint**: `GET /billing/top-customers`
- **Purpose**: Get top customers by income
- **Request**: Query params: `startDate`, `endDate`, `limit`
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "customerId": "1",
      "customerName": "Customer Name",
      "totalPaid": 10000,
      "invoiceCount": 5
    }
  ]
}
```

## Request Parameters

### Common Filters

- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `period`: Time period (today, week, month, quarter, year, custom)
- `groupBy`: Grouping for trends (day, week, month, year)
- `limit`: Number of records to return

### Example Request

```
GET /dashboard/quick-stats?startDate=2024-01-01&endDate=2024-01-31
```

## Response Format

All endpoints return responses in this format:

```json
{
  "success": boolean,
  "data": object | array,
  "message": string (on error)
}
```
