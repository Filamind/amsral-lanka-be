-- Migration: Add billing columns to orders and order_records tables
-- Date: 2024-01-XX
-- Description: Add amount, is_paid columns to orders table and unit_price, total_price, is_paid columns to order_records table

-- Add billing columns to orders table
ALTER TABLE "orders" ADD COLUMN "amount" numeric
(10, 2) DEFAULT '0.00';
ALTER TABLE "orders" ADD COLUMN "is_paid" boolean DEFAULT false;

-- Add billing columns to order_records table
ALTER TABLE "order_records" ADD COLUMN "unit_price" numeric
(10, 2) DEFAULT '0.00';
ALTER TABLE "order_records" ADD COLUMN "total_price" numeric
(10, 2) DEFAULT '0.00';
ALTER TABLE "order_records" ADD COLUMN "is_paid" boolean DEFAULT false;

-- Add indexes for better performance on billing queries
CREATE INDEX "idx_orders_is_paid" ON "orders" ("is_paid");
CREATE INDEX "idx_orders_amount" ON "orders" ("amount");
CREATE INDEX "idx_order_records_is_paid" ON "order_records" ("is_paid");
CREATE INDEX "idx_order_records_unit_price" ON "order_records" ("unit_price");
CREATE INDEX "idx_order_records_total_price" ON "order_records" ("total_price");
