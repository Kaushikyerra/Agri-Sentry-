-- Kisan Sahayak Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    name TEXT,
    primary_language TEXT DEFAULT 'en',
    primary_crop TEXT DEFAULT 'wheat',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fields Table
CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    crop_type TEXT NOT NULL,
    planting_date DATE,
    expected_harvest_date DATE,
    geojson_boundary JSONB NOT NULL,
    soil_type TEXT,
    area_sqm NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Devices Table (IoT Sensors)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT NOT NULL,
    field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
    firmware_version TEXT,
    mqtt_topic TEXT,
    coordinates JSONB,
    status TEXT DEFAULT 'offline',
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensor Readings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    device_id TEXT,
    sensor_type TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT,
    due_date TIMESTAMPTZ,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Irrigation Logs Table
CREATE TABLE IF NOT EXISTS irrigation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    field_id UUID REFERENCES fields(id) ON DELETE CASCADE,
    irrigation_date DATE NOT NULL,
    duration_minutes INTEGER,
    water_amount_liters NUMERIC,
    method TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0
);

-- Government Schemes Table
CREATE TABLE IF NOT EXISTS government_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_hi TEXT,
    description TEXT,
    description_hi TEXT,
    eligibility TEXT,
    benefit_amount NUMERIC,
    category TEXT,
    deadline DATE,
    official_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fields_user_id ON fields(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_field_id ON sensor_readings(field_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_user_id ON irrigation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone_number);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for fields
CREATE POLICY "Users can view own fields" ON fields
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fields" ON fields
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fields" ON fields
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fields" ON fields
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for devices
CREATE POLICY "Users can view own devices" ON devices
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices" ON devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for sensor_readings
CREATE POLICY "Users can view readings from own fields" ON sensor_readings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM fields 
            WHERE fields.id = sensor_readings.field_id 
            AND fields.user_id = auth.uid()
        )
    );

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for irrigation_logs
CREATE POLICY "Users can view own irrigation logs" ON irrigation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own irrigation logs" ON irrigation_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fields_updated_at BEFORE UPDATE ON fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample government schemes
INSERT INTO government_schemes (name, name_hi, description, description_hi, category, benefit_amount) VALUES
('PM-KISAN', 'पीएम-किसान', 'Direct income support of ₹6000 per year', 'प्रति वर्ष ₹6000 की प्रत्यक्ष आय सहायता', 'subsidy', 6000),
('Soil Health Card Scheme', 'मृदा स्वास्थ्य कार्ड योजना', 'Free soil testing and health cards', 'मुफ्त मिट्टी परीक्षण और स्वास्थ्य कार्ड', 'service', 0),
('Pradhan Mantri Fasal Bima Yojana', 'प्रधानमंत्री फसल बीमा योजना', 'Crop insurance scheme', 'फसल बीमा योजना', 'insurance', 0)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as message;
