/**
 * Database Creation Script
 * This script creates all necessary tables for the Ruchi Restaurant Management System
 * 
 * Usage: node scripts/create-database.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'restaurant_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

// SQL statements for creating tables
const createTablesSQL = `
-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer', -- 'customer', 'admin', 'delivery', 'salesman'
    commission_rate DECIMAL(10, 2) DEFAULT 0, -- For delivery boys and salesmen
    commission_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed' or 'percentage'
    google_id VARCHAR(255), -- For Google OAuth
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    category VARCHAR(100), -- Legacy field, kept for backward compatibility
    price DECIMAL(10, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 5.00, -- GST percentage (e.g., 5.00 for 5%)
    image_data BYTEA, -- Store image as binary data
    image_type VARCHAR(50), -- e.g., 'image/jpeg', 'image/png'
    available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- DELIVERY LOCATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estimated_time INTEGER DEFAULT 30, -- Estimated delivery time in minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT,
    order_type VARCHAR(20) DEFAULT 'delivery', -- 'takeaway', 'delivery', 'dine-in'
    table_number VARCHAR(20), -- For dine-in orders
    delivery_location_id INTEGER REFERENCES delivery_locations(id) ON DELETE SET NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    delivery_boy_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    driver_commission DECIMAL(10, 2) DEFAULT 0,
    salesman_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    salesman_commission DECIMAL(10, 2) DEFAULT 0,
    items JSONB NOT NULL, -- Store order items as JSON array
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'cash', 'card', 'upi', 'netbanking'
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    order_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'
    notes TEXT,
    cancelled_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    gst_type VARCHAR(20) DEFAULT 'regular', -- 'regular', 'composite', 'unregistered'
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL, -- 'rent', 'utilities', 'supplies', 'salaries', 'other'
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'card', 'upi', 'netbanking'
    expense_date DATE NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payout_date DATE NOT NULL,
    payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'upi'
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- IMAGES TABLE (for storing menu item images separately)
-- ============================================
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

// Create indexes for better performance
const createIndexesSQL = `
-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- Menu items indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);
CREATE INDEX IF NOT EXISTS idx_menu_items_featured ON menu_items(is_featured);

-- Delivery locations indexes
CREATE INDEX IF NOT EXISTS idx_delivery_locations_active ON delivery_locations(is_active);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_boy ON orders(delivery_boy_id);
CREATE INDEX IF NOT EXISTS idx_orders_salesman ON orders(salesman_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location ON orders(delivery_location_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_generated_at ON invoices(generated_at);

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Payouts indexes
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_date ON payouts(payout_date);
`;

// Insert default data
const insertDefaultDataSQL = `
-- Insert default admin user (password: admin123)
-- Note: This is a bcrypt hash of 'admin123'
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@restaurant.com', '$2a$10$rKvVPZqGJf5YqH5YqH5YqOqH5YqH5YqH5YqH5YqH5YqH5YqH5Yq', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description, sort_order) VALUES
('APPETIZERS', 'Starters and appetizers', 1),
('MAIN COURSE', 'Main course dishes', 2),
('BREADS', 'Indian breads', 3),
('RICE', 'Rice dishes', 4),
('DESSERTS', 'Sweet dishes', 5),
('BEVERAGES', 'Drinks and beverages', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('restaurant_name', 'Ruchi Restaurant', 'Name of the restaurant'),
('restaurant_address', '123 Main Street, City, State - 123456', 'Address of the restaurant'),
('restaurant_phone', '+91 1234567890', 'Phone number'),
('restaurant_email', 'info@ruchi.com', 'Email address'),
('gst_number', '', 'GST Identification Number'),
('gst_type', 'regular', 'GST Type: regular, composite, or unregistered'),
('printer_type', 'thermal', 'Printer type: thermal or a4'),
('paper_width', '80mm', 'Paper width for thermal printer'),
('show_logo', 'true', 'Show logo on invoice'),
('footer_text', 'Thank you for your business!', 'Invoice footer text'),
('tax_rate', '5.00', 'Default tax rate percentage'),
('currency', 'INR', 'Currency code'),
('currency_symbol', '₹', 'Currency symbol')
ON CONFLICT (key) DO NOTHING;

-- Insert sample delivery locations
INSERT INTO delivery_locations (location_name, delivery_charge, estimated_time, is_active) VALUES
('City Center', 30.00, 20, true),
('North Zone', 50.00, 30, true),
('South Zone', 50.00, 30, true),
('East Zone', 60.00, 35, true),
('West Zone', 60.00, 35, true),
('Suburbs', 80.00, 45, true),
('Airport Area', 100.00, 60, true)
ON CONFLICT (location_name) DO NOTHING;

-- Insert sample menu items (optional)
INSERT INTO menu_items (name, description, category, price, gst_rate, available) VALUES
('Paneer Tikka', 'Grilled cottage cheese marinated in spices', 'APPETIZERS', 250.00, 5.00, true),
('Chicken Biryani', 'Aromatic basmati rice with tender chicken', 'MAIN COURSE', 350.00, 5.00, true),
('Dal Makhani', 'Creamy black lentils cooked overnight', 'MAIN COURSE', 200.00, 5.00, true),
('Butter Naan', 'Soft leavened bread with butter', 'BREADS', 50.00, 5.00, true),
('Gulab Jamun', 'Sweet dumplings in sugar syrup', 'DESSERTS', 80.00, 5.00, true),
('Mango Lassi', 'Refreshing yogurt drink with mango', 'BEVERAGES', 100.00, 5.00, true)
ON CONFLICT DO NOTHING;
`;

// Main execution function
async function createDatabase() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting database creation...\n');

        // Start transaction
        await client.query('BEGIN');

        // Create tables
        console.log('📋 Creating tables...');
        await client.query(createTablesSQL);
        console.log('✅ Tables created successfully\n');

        // Create indexes
        console.log('🔍 Creating indexes...');
        await client.query(createIndexesSQL);
        console.log('✅ Indexes created successfully\n');

        // Insert default data
        console.log('📝 Inserting default data...');
        await client.query(insertDefaultDataSQL);
        console.log('✅ Default data inserted successfully\n');

        // Commit transaction
        await client.query('COMMIT');

        console.log('🎉 Database setup completed successfully!\n');
        console.log('📊 Summary:');
        console.log('   - Tables: users, categories, menu_items, delivery_locations, orders, invoices, settings, expenses, payouts, images');
        console.log('   - Indexes: Created for optimal query performance');
        console.log('   - Default data: Admin user, categories, settings, delivery locations, sample menu items');
        console.log('\n📌 Default Admin Credentials:');
        console.log('   Email: admin@restaurant.com');
        console.log('   Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change the admin password immediately after first login!\n');

    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ Error creating database:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
if (require.main === module) {
    createDatabase().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { createDatabase };
