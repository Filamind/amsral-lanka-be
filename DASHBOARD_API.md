# Dashboard API Specification

This document outlines the API endpoints required for the dashboard functionality in the AMSRAL application.

## Overview

The dashboard provides analytics and insights for order management, including metrics, charts, and recent activity. All endpoints should return data based on the authenticated user's permissions and role.

## Base URL

```
/api/dashboard
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Main Dashboard Analytics

**Endpoint:** `GET /api/dashboard/analytics`

**Description:** Returns comprehensive dashboard data including summary metrics, trends, and recent orders.

**Query Parameters:**

- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format
- `period` (optional): Predefined period - `today`, `week`, `month`, `quarter`, `year`

**Example Request:**

```
GET /api/dashboard/analytics?startDate=2024-01-01&endDate=2024-01-31&period=month
```

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 150,
      "completedOrders": 120,
      "pendingOrders": 20,
      "inProgressOrders": 10,
      "totalRevenue": 45000,
      "averageOrderValue": 300
    },
    "trends": {
      "dailyOrders": [
        {
          "date": "2024-01-01T00:00:00Z",
          "orders": 5,
          "revenue": 1500
        },
        {
          "date": "2024-01-02T00:00:00Z",
          "orders": 8,
          "revenue": 2400
        }
      ],
      "orderStatusDistribution": [
        {
          "status": "Completed",
          "count": 120,
          "percentage": 80
        },
        {
          "status": "Pending",
          "count": 20,
          "percentage": 13.3
        },
        {
          "status": "In Progress",
          "count": 10,
          "percentage": 6.7
        }
      ]
    },
    "recentOrders": [
      {
        "id": 123,
        "customerName": "John Doe",
        "status": "Completed",
        "totalAmount": 500,
        "orderDate": "2024-01-15T10:30:00Z"
      },
      {
        "id": 124,
        "customerName": "Jane Smith",
        "status": "Pending",
        "totalAmount": 750,
        "orderDate": "2024-01-14T14:20:00Z"
      }
    ]
  }
}
```

### 2. Quick Stats (Optional)

**Endpoint:** `GET /api/dashboard/quick-stats`

**Description:** Returns only the summary metrics for quick loading.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "completedOrders": 120,
    "pendingOrders": 20,
    "inProgressOrders": 10,
    "totalRevenue": 45000,
    "averageOrderValue": 300
  }
}
```

### 3. Orders Trend (Optional)

**Endpoint:** `GET /api/dashboard/orders-trend`

**Description:** Returns daily order data for trend charts.

**Query Parameters:** Same as main analytics endpoint

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01T00:00:00Z",
      "orders": 5,
      "revenue": 1500
    },
    {
      "date": "2024-01-02T00:00:00Z",
      "orders": 8,
      "revenue": 2400
    }
  ]
}
```

### 4. Order Status Distribution (Optional)

**Endpoint:** `GET /api/dashboard/order-status-distribution`

**Description:** Returns order status breakdown for pie charts.

**Query Parameters:** Same as main analytics endpoint

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "status": "Completed",
      "count": 120,
      "percentage": 80
    },
    {
      "status": "Pending",
      "count": 20,
      "percentage": 13.3
    },
    {
      "status": "In Progress",
      "count": 10,
      "percentage": 6.7
    }
  ]
}
```

### 5. Recent Orders (Optional)

**Endpoint:** `GET /api/dashboard/recent-orders`

**Description:** Returns recent orders for the activity table.

**Query Parameters:**

- `limit` (optional): Number of orders to return (default: 10)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "customerName": "John Doe",
      "status": "Completed",
      "totalAmount": 500,
      "orderDate": "2024-01-15T10:30:00Z"
    },
    {
      "id": 124,
      "customerName": "Jane Smith",
      "status": "Pending",
      "totalAmount": 750,
      "orderDate": "2024-01-14T14:20:00Z"
    }
  ]
}
```

## Data Types

### Summary Metrics

- `totalOrders`: Total number of orders in the period
- `completedOrders`: Number of completed orders
- `pendingOrders`: Number of pending orders
- `inProgressOrders`: Number of in-progress orders
- `totalRevenue`: Total revenue in the period (in base currency)
- `averageOrderValue`: Average order value (totalRevenue / totalOrders)

### Daily Order Data

- `date`: ISO 8601 date string
- `orders`: Number of orders on that date
- `revenue`: Revenue generated on that date

### Order Status Distribution

- `status`: Order status name (Completed, Pending, In Progress, etc.)
- `count`: Number of orders with this status
- `percentage`: Percentage of total orders

### Recent Order

- `id`: Order ID
- `customerName`: Customer name
- `status`: Current order status
- `totalAmount`: Order total amount
- `orderDate`: Order creation date (ISO 8601)

## Error Responses

All endpoints should return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

Common HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `500`: Internal Server Error

## Role-Based Access

The dashboard should respect user roles:

- **Admin**: Full access to all data
- **Manager**: Access to orders and production data only
- **User**: Read-only access to orders and production data only

## Notes

1. All dates should be in ISO 8601 format
2. Currency amounts should be in the base currency (no currency symbol in API)
3. Percentages should be calculated to 1 decimal place
4. The main analytics endpoint should be optimized for performance as it's called frequently
5. Consider implementing caching for dashboard data to improve performance
6. All endpoints should handle date range validation and return appropriate errors for invalid ranges

## Implementation Status

✅ **Completed:**
- Main analytics endpoint (`/api/dashboard/analytics`)
- Quick stats endpoint (`/api/dashboard/quick-stats`)
- Orders trend endpoint (`/api/dashboard/orders-trend`)
- Order status distribution endpoint (`/api/dashboard/order-status-distribution`)
- Recent orders endpoint (`/api/dashboard/recent-orders`)
- Legacy stats endpoint (`/api/dashboard/stats`) for backward compatibility

✅ **Features Implemented:**
- Date range filtering with custom dates and predefined periods
- Comprehensive error handling
- Consistent response format
- Database integration with Drizzle ORM
- Customer name resolution
- Revenue calculations (placeholder implementation)

⚠️ **Notes for Production:**
- Revenue calculation is currently a placeholder (quantity * 100). Update with actual pricing logic
- Consider implementing caching for better performance
- Add authentication middleware if not already present
- Add role-based access control if needed
- Consider adding data validation for query parameters
