-- Step 1: Add missing columns to government_schemes
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS name_hi TEXT;
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS description_hi TEXT;
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS benefit_amount NUMERIC;
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE government_schemes ADD COLUMN IF NOT EXISTS official_link TEXT;

-- Step 2: Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_language TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS primary_crop TEXT DEFAULT 'wheat';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Step 3: Add missing columns to fields
ALTER TABLE fields ADD COLUMN IF NOT EXISTS area_sqm NUMERIC;
ALTER TABLE fields ADD COLUMN IF NOT EXISTS soil_type TEXT;

-- Step 4: Insert sample schemes (now columns exist)
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

-- Step 5: Show success message
SELECT 
    'Database updated successfully! ✅' as status,
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM fields) as fields_count,
    (SELECT COUNT(*) FROM devices) as devices_count,
    (SELECT COUNT(*) FROM government_schemes) as schemes_count,
    (SELECT COUNT(*) FROM tasks) as tasks_count;
