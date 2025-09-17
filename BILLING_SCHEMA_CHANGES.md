# Billing Schema Changes

This document outlines the billing-related database schema changes implemented for the AMSRAL application.

## Overview

Added billing functionality to the orders and order_records tables to track amounts and payment status.

## Database Changes

### Orders Table

Added the following columns:

- `amount` (decimal(10,2)) - Total order amount, defaults to 0.00
- `is_paid` (boolean) - Payment status, defaults to false

### Order Records Table

Added the following columns:

- `unit_price` (decimal(10,2)) - Price per unit, defaults to 0.00
- `total_price` (decimal(10,2)) - Total price for this record, defaults to 0.00
- `is_paid` (boolean) - Payment status for this record, defaults to false

## Migration Details

### Migration File

- **File**: `drizzle/0014_add_billing_columns.sql`
- **Status**: Applied to database using `npx drizzle-kit push`

### SQL Commands Applied

```sql
-- Add billing columns to orders table
ALTER TABLE "orders" ADD COLUMN "amount" numeric(10, 2) DEFAULT '0.00';
ALTER TABLE "orders" ADD COLUMN "is_paid" boolean DEFAULT false;

-- Add billing columns to order_records table
ALTER TABLE "order_records" ADD COLUMN "unit_price" numeric(10, 2) DEFAULT '0.00';
ALTER TABLE "order_records" ADD COLUMN "total_price" numeric(10, 2) DEFAULT '0.00';
ALTER TABLE "order_records" ADD COLUMN "is_paid" boolean DEFAULT false;
```

## Code Changes

### Schema Files Updated

1. **src/db/schema.js** - Added billing columns to table definitions
2. **drizzle/schema.ts** - Updated TypeScript schema definitions

### Model Updates

1. **src/models/Order.js** - Updated select statements to include billing fields
2. **src/models/OrderRecord.js** - Ready for billing field integration

### Controller Updates

1. **src/controllers/dashboardController.js** - Updated revenue calculations to use actual amounts

## API Impact

### Dashboard Analytics

- Revenue calculations now use actual `amount` field from orders
- Fallback to quantity \* 100 if amount is not set
- Daily revenue tracking includes actual billing data

### Order Management

- Orders now include billing information in responses
- Payment status tracking available
- Individual record pricing support

## Default Values

All new billing columns have appropriate default values:

- **Amount fields**: 0.00 (decimal)
- **Payment status**: false (boolean)

This ensures backward compatibility with existing data.

## Next Steps

1. **Billing API Endpoints** - Create endpoints for:

   - Setting order amounts
   - Updating payment status
   - Calculating totals
   - Generating invoices

2. **Frontend Integration** - Update frontend to:

   - Display billing information
   - Allow amount entry
   - Show payment status
   - Generate billing reports

3. **Business Logic** - Implement:
   - Automatic total calculation
   - Payment validation
   - Invoice generation
   - Payment tracking

## Testing

The database changes have been applied successfully. All existing functionality remains intact with the new billing fields available for future use.

## Rollback

If needed, the billing columns can be removed using:

```sql
ALTER TABLE "orders" DROP COLUMN "amount";
ALTER TABLE "orders" DROP COLUMN "is_paid";
ALTER TABLE "order_records" DROP COLUMN "unit_price";
ALTER TABLE "order_records" DROP COLUMN "total_price";
ALTER TABLE "order_records" DROP COLUMN "is_paid";
```

**Note**: This would result in data loss for any billing information that has been entered.
