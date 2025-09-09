-- Make itemId nullable in orders table
ALTER TABLE orders ALTER COLUMN item_id DROP NOT NULL;
