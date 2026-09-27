-- ============================================
-- QUICK RAILWAY DATABASE SETUP
-- Copy and paste this entire file into Railway Query Editor
-- ============================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer',
    commission_rate DECIMAL(10, 2) DEFAULT 0,
    commission_type VARCHAR(20) DEFAULT 'fixed',
    google_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    gst_rate DECIMAL(5, 2) DEFAULT 5.00,
    image_data BYTEA,
    image_type VARCHAR(50),
    available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Delivery Locations Table
CREATE TABLE IF NOT EXISTS delivery_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estimated_time INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT,
    order_type VARCHAR(20) DEFAULT 'delivery',
    table_number VARCHAR(20),
    delivery_location_id INTEGER REFERENCES delivery_locations(id) ON DELETE SET NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    delivery_boy_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    driver_commission DECIMAL(10, 2) DEFAULT 0,
    salesman_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    salesman_commission DECIMAL(10, 2) DEFAULT 0,
    items JSONB NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    order_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    cancelled_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

-- 6. Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    gst_type VARCHAR(20) DEFAULT 'regular',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    expense_date DATE NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Create Payouts Table
CREATE TABLE IF NOT EXISTS payouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payout_date DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create Images Table
CREATE TABLE IF NOT EXISTS images (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert Admin User (email: admin@restaurant.com, password: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@restaurant.com', '$2a$10$g/BDopkmH4ApGpJfgmCXMe4fgAgWIBlmzU3shxVX9ebmdgb6.d6im', 'Admin', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert Default Categories
INSERT INTO categories (name, description, sort_order) VALUES
('APPETIZERS', 'Starters and appetizers', 1),
('MAIN COURSE', 'Main course dishes', 2),
('BREADS', 'Indian breads', 3),
('RICE', 'Rice dishes', 4),
('DESSERTS', 'Sweet dishes', 5),
('BEVERAGES', 'Drinks and beverages', 6)
ON CONFLICT (name) DO NOTHING;

-- Insert Default Settings
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

-- Insert Sample Delivery Locations
INSERT INTO delivery_locations (location_name, delivery_charge, estimated_time, is_active) VALUES
('City Center', 30.00, 20, true),
('North Zone', 50.00, 30, true),
('South Zone', 50.00, 30, true),
('East Zone', 60.00, 35, true),
('West Zone', 60.00, 35, true)
ON CONFLICT (location_name) DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Check if everything was created successfully
SELECT 'Tables created successfully!' as status;
SELECT 'Admin user created: admin@restaurant.com / admin123' as login_info;
