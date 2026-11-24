-- ==============================================================================
-- STOCKFLOW - CLIENT PORTAL & USER AUTHENTICATION DATABASE MIGRATION
-- Target Database: Aiven PostgreSQL
-- Target Schema: stockflow
-- ==============================================================================
-- INSTRUCTIONS FOR AIVEN CONSOLE:
-- Aiven SQL Editor enforces statement limits per execution.
-- This file is intentionally structured into small batches (<= 10 statements each).
-- You can run the entire script at once in psql or execute Batch 1, 2, and 3
-- sequentially in the Aiven web console.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- BATCH 1: Schema Verification & Users Table
-- ------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS stockflow;

CREATE TABLE IF NOT EXISTS stockflow.users (
    user_id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON stockflow.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON stockflow.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON stockflow.users(account_status);

-- ------------------------------------------------------------------------------
-- BATCH 2: Customer Orders & Customer Order Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stockflow.customer_orders (
    customer_order_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES stockflow.users(user_id) ON DELETE RESTRICT,
    order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    shipping_address TEXT NOT NULL,
    order_status VARCHAR(30) NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Cash on Delivery',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cust_orders_user ON stockflow.customer_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cust_orders_status ON stockflow.customer_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_cust_orders_date ON stockflow.customer_orders(order_date DESC);

CREATE TABLE IF NOT EXISTS stockflow.customer_order_items (
    customer_order_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_order_id VARCHAR(30) NOT NULL REFERENCES stockflow.customer_orders(customer_order_id) ON DELETE CASCADE,
    product_id VARCHAR(20) NOT NULL REFERENCES stockflow.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_cust_order_items_order ON stockflow.customer_order_items(customer_order_id);
CREATE INDEX IF NOT EXISTS idx_cust_order_items_prod ON stockflow.customer_order_items(product_id);

-- ------------------------------------------------------------------------------
-- BATCH 3: Cart Items & Performance Indexes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stockflow.cart_items (
    cart_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES stockflow.users(user_id) ON DELETE CASCADE,
    product_id VARCHAR(20) NOT NULL REFERENCES stockflow.products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cart_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user ON stockflow.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON stockflow.cart_items(product_id);

-- Add helpful comment for documentation
COMMENT ON TABLE stockflow.users IS 'Stores user accounts for admins and registered clients';
COMMENT ON TABLE stockflow.customer_orders IS 'Stores B2B and retail customer orders placed via client portal';
COMMENT ON TABLE stockflow.customer_order_items IS 'Stores line items for customer orders';
COMMENT ON TABLE stockflow.cart_items IS 'Persistent user shopping cart';
