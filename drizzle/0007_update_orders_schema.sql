-- Migration: Update orders schema
-- Rename customer_orders to orders and update structure
-- Rename customer_order_lines to order_records and update structure

-- Step 1: Create new orders table
CREATE TABLE "orders"
(
    "id" SERIAL PRIMARY KEY,
    "date" DATE NOT NULL,
    "reference_no" VARCHAR(50) UNIQUE NOT NULL,
    "customer_id" VARCHAR(50) NOT NULL,
    "item_id" VARCHAR(50) NOT NULL,
    "quantity" INTEGER NOT NULL CHECK (quantity > 0),
    "notes" TEXT,
    "delivery_date" DATE NOT NULL,
    "status" VARCHAR(20) DEFAULT 'Pending',
    "created_at" TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    (),
    "updated_at" TIMESTAMP
    WITH TIME ZONE DEFAULT NOW
    ()
);

    -- Step 2: Create indexes for orders table
    CREATE INDEX "idx_reference_no" ON "orders" ("reference_no");
    CREATE INDEX "idx_customer_id" ON "orders" ("customer_id");
    CREATE INDEX "idx_item_id" ON "orders" ("item_id");
    CREATE INDEX "idx_status" ON "orders" ("status");
    CREATE INDEX "idx_date" ON "orders" ("date");
    CREATE INDEX "idx_delivery_date" ON "orders" ("delivery_date");

    -- Step 3: Create new order_records table
    CREATE TABLE "order_records"
    (
        "id" SERIAL PRIMARY KEY,
        "order_id" INTEGER NOT NULL,
        "quantity" INTEGER NOT NULL CHECK (quantity > 0),
        "wash_type" VARCHAR(50) NOT NULL,
        "process_types" JSON NOT NULL,
        "created_at" TIMESTAMP
        WITH TIME ZONE DEFAULT NOW
        (),
    "updated_at" TIMESTAMP
        WITH TIME ZONE DEFAULT NOW
        (),
    
    CONSTRAINT "fk_order_records_order_id" FOREIGN KEY
        ("order_id") REFERENCES "orders"
        ("id") ON
        DELETE CASCADE
);

        -- Step 4: Create indexes for order_records table
        CREATE INDEX "idx_order_id" ON "order_records" ("order_id");
        CREATE INDEX "idx_wash_type" ON "order_records" ("wash_type");

-- Step 5: Migrate data from customer_orders to orders (if customer_orders exists)
-- This will need to be adjusted based on your actual data mapping requirements
-- INSERT INTO "orders" (date, reference_no, customer_id, item_id, quantity, notes, delivery_date, status, created_at, updated_at)
-- SELECT 
--     order_date,
--     order_number,
--     customer_id::varchar,
--     'ITEM001', -- You'll need to map this from your actual data
--     1, -- You'll need to calculate total quantity from order lines
--     notes,
--     delivery_date,
--     status,
--     created_at,
--     updated_at
-- FROM customer_orders WHERE is_active = true;

-- Step 6: Migrate data from customer_order_lines to order_records (if needed)
-- This migration is more complex and will depend on your data structure
-- You may need custom logic to handle the wash_type and process_types mapping

-- Note: Uncomment and modify the data migration queries above based on your actual data needs
-- The current schema change is structural only - data migration requires custom logic

-- Step 7: Update any triggers for updated_at (if you use them)
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = NOW();
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- CREATE TRIGGER update_order_records_updated_at BEFORE UPDATE ON order_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
