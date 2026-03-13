-- Update Existing Tables Script
-- This script safely adds missing columns to existing tables

-- Add missing columns to government_schemes table
DO $$ 
BEGIN
    -- Add name_hi column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'name_hi'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN name_hi TEXT;
    END IF;

    -- Add description_hi column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'description_hi'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN description_hi TEXT;
    END IF;

    -- Add eligibility column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'eligibility'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN eligibility TEXT;
    END IF;

    -- Add benefit_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'benefit_amount'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN benefit_amount NUMERIC;
    END IF;

    -- Add category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'category'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN category TEXT;
    END IF;

    -- Add deadline column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'deadline'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN deadline DATE;
    END IF;

    -- Add official_link column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'government_schemes' AND column_name = 'official_link'
    ) THEN
        ALTER TABLE government_schemes ADD COLUMN official_link TEXT;
    END IF;
END $$;

-- Add missing columns to profiles table
DO $$ 
BEGIN
    -- Add phone_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone_number TEXT UNIQUE;
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone_verified'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'name'
    ) THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;

    -- Add primary_language column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'primary_language'
    ) THEN
        ALTER TABLE profiles ADD COLUMN primary_language TEXT DEFAULT 'en';
    END IF;

    -- Add primary_crop column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'primary_crop'
    ) THEN
        ALTER TABLE profiles ADD COLUMN primary_crop TEXT DEFAULT 'wheat';
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
    END IF;
END $$;

-- Add missing columns to fields table
DO $$ 
BEGIN
    -- Add area_sqm column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fields' AND column_name = 'area_sqm'
    ) THEN
        ALTER TABLE fields ADD COLUMN area_sqm NUMERIC;
    END IF;

    -- Add soil_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fields' AND column_name = 'soil_type'
    ) THEN
        ALTER TABLE fields ADD COLUMN soil_type TEXT;
    END IF;
END $$;

-- Insert sample government schemes (only if not exists)
INSERT INTO government_schemes (name, name_hi, description, description_hi, category, benefit_amount)
SELECT 'PM-KISAN', 'पीएम-किसान', 'Direct income support of ₹6000 per year', 'प्रति वर्ष ₹6000 की प्रत्यक्ष आय सहायता', 'subsidy', 6000
WHERE NOT EXISTS (SELECT 1 FROM government_schemes WHERE name = 'PM-KISAN');

INSERT INTO government_schemes (name, name_hi, description, description_hi, category, benefit_amount)
SELECT 'Soil Health Card Scheme', 'मृदा स्वास्थ्य कार्ड योजना', 'Free soil testing and health cards', 'मुफ्त मिट्टी परीक्षण और स्वास्थ्य कार्ड', 'service', 0
WHERE NOT EXISTS (SELECT 1 FROM government_schemes WHERE name = 'Soil Health Card Scheme');

INSERT INTO government_schemes (name, name_hi, description, description_hi, category, benefit_amount)
SELECT 'Pradhan Mantri Fasal Bima Yojana', 'प्रधानमंत्री फसल बीमा योजना', 'Crop insurance scheme', 'फसल बीमा योजना', 'insurance', 0
WHERE NOT EXISTS (SELECT 1 FROM government_schemes WHERE name = 'Pradhan Mantri Fasal Bima Yojana');

INSERT INTO government_schemes (name, name_hi, description, description_hi, category, benefit_amount)
SELECT 'Kisan Credit Card', 'किसान क्रेडिट कार्ड', 'Easy credit access for farmers', 'किसानों के लिए आसान ऋण', 'loan', 0
WHERE NOT EXISTS (SELECT 1 FROM government_schemes WHERE name = 'Kisan Credit Card');

INSERT INTO government_schemes (name, name_hi, description, description_hi, category, benefit_amount)
SELECT 'National Agriculture Market', 'राष्ट्रीय कृषि बाजार', 'Online trading platform for agricultural commodities', 'कृषि वस्तुओं के लिए ऑनलाइन व्यापार मंच', 'market', 0
WHERE NOT EXISTS (SELECT 1 FROM government_schemes WHERE name = 'National Agriculture Market');

-- Success message with table info
SELECT 
    'Database updated successfully! ✅' as message,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM fields) as total_fields,
    (SELECT COUNT(*) FROM devices) as total_devices,
    (SELECT COUNT(*) FROM government_schemes) as total_schemes,
    (SELECT COUNT(*) FROM tasks) as total_tasks;
