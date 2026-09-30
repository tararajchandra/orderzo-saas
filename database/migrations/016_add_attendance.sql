-- database/migrations/016_add_attendance.sql

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_role VARCHAR(20) NOT NULL, -- 'salesman' or 'kitchen_staff'
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP NULL,
    total_working_hours NUMERIC(5,2) NULL, -- calculated on checkout
    status VARCHAR(20) DEFAULT 'present',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One user can only have one attendance record per day
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_date'
    ) THEN
        ALTER TABLE attendance ADD CONSTRAINT unique_user_date UNIQUE (user_id, date);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS attendance_breaks (
    id SERIAL PRIMARY KEY,
    attendance_id INTEGER REFERENCES attendance(id) ON DELETE CASCADE,
    break_start TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    break_end TIMESTAMP NULL,
    duration_minutes INTEGER NULL
);

-- Insert default settings if they don't exist
INSERT INTO settings (key, value, description) VALUES 
('restaurant_lat', '22.5726', 'Restaurant Latitude (Default: Kolkata)'),
('restaurant_lng', '88.3639', 'Restaurant Longitude (Default: Kolkata)'),
('allowed_radius', '50', 'Allowed radius for login in meters')
ON CONFLICT (key) DO NOTHING;
