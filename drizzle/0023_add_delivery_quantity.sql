-- Add delivery_quantity column to orders table
ALTER TABLE orders ADD COLUMN delivery_quantity INTEGER DEFAULT 0;
