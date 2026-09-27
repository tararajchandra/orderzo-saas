-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
('restaurant_name', 'Ruchi Restaurant', 'Name of the restaurant'),
('restaurant_address', '123 Main Street', 'Address of the restaurant'),
('restaurant_phone', '+91 1234567890', 'Phone number'),
('restaurant_email', 'info@ruchi.com', 'Email address'),
('gst_number', '', 'GST Identification Number'),
('gst_type', 'regular', 'GST Type: regular, composite, or unregistered'),
('printer_type', 'thermal', 'Printer type: thermal or a4'),
('paper_width', '80mm', 'Paper width for thermal printer'),
('show_logo', 'true', 'Show logo on invoice'),
('footer_text', 'Thank you for your business!', 'Invoice footer text')
ON CONFLICT (key) DO NOTHING;
