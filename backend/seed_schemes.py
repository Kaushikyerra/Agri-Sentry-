import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Lazy initialization of Supabase client
_supabase_client: Client = None

def get_supabase_client() -> Client:
    """Get or initialize Supabase client on first use (lazy initialization)"""
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    url = os.getenv("VITE_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.")
        return None
    
    try:
        _supabase_client = create_client(url, key)
        print("Supabase client initialized successfully")
        return _supabase_client
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        return None

supabase: Client = None

SCHEMES_DATA = [
    {
        "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
        "description": "Direct income support of ₹6,000 per year to all landholding farmer families across the country in three equal instalments of ₹2,000 each every four months.",
        "eligibility_criteria": {"land_ownership": True, "farmer_category": ["small", "marginal", "medium", "large"]},
        "benefits": "₹6,000 per year in 3 instalments",
        "application_url": "https://pmkisan.gov.in",
        "state": "All India",
        "category": "Income Support",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": None
    },
    {
        "name": "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
        "description": "Crop insurance scheme providing financial support to farmers in the event of crop loss due to natural calamities, pests, and diseases.",
        "eligibility_criteria": {"farmer_category": ["all"], "crop_insurance": True},
        "benefits": "Up to 90% premium subsidy",
        "application_url": "https://pmfby.gov.in",
        "state": "All India",
        "category": "Crop Insurance",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": None
    },
    {
        "name": "KCC (Kisan Credit Card)",
        "description": "Credit facility for farmers to meet their agricultural and consumption needs. Provides short-term credit for crop cultivation and post-harvest expenses.",
        "eligibility_criteria": {"farmer_category": ["all"], "land_ownership": True},
        "benefits": "Credit limit up to ₹3 lakh at 4% interest",
        "application_url": "https://www.nabard.org/content1.aspx?id=523&catid=8&mid=489",
        "state": "All India",
        "category": "Credit",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": None
    },
    {
        "name": "Soil Health Card Scheme",
        "description": "Provides soil health cards to farmers with information on nutrient status and recommendations on appropriate dosage of nutrients for improving soil health and fertility.",
        "eligibility_criteria": {"farmer_category": ["all"]},
        "benefits": "Free soil testing and recommendations",
        "application_url": "https://soilhealth.dac.gov.in",
        "state": "All India",
        "category": "Soil Health",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": None
    },
    {
        "name": "PKVY (Paramparagat Krishi Vikas Yojana)",
        "description": "Promotes organic farming through cluster approach and PGS certification. Provides financial assistance for organic inputs and certification.",
        "eligibility_criteria": {"farmer_category": ["all"], "organic_farming": True},
        "benefits": "₹50,000 per hectare for 3 years",
        "application_url": "https://pgsindia-ncof.gov.in",
        "state": "All India",
        "category": "Organic Farming",
        "deadline": None,
        "min_land_acres": 1,
        "max_land_acres": None
    },
    {
        "name": "National Agriculture Market (e-NAM)",
        "description": "Pan-India electronic trading portal for agricultural commodities. Enables farmers to sell their produce online and get better prices.",
        "eligibility_criteria": {"farmer_category": ["all"]},
        "benefits": "Better price discovery and online trading",
        "application_url": "https://www.enam.gov.in",
        "state": "All India",
        "category": "Market Linkage",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": None
    },
    {
        "name": "PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)",
        "description": "Irrigation development scheme focusing on micro-irrigation, watershed development, and efficient water use. 'Per Drop More Crop' component.",
        "eligibility_criteria": {"farmer_category": ["all"], "irrigation_need": True},
        "benefits": "Subsidy on drip/sprinkler irrigation systems",
        "application_url": "https://pmksy.gov.in",
        "state": "All India",
        "category": "Irrigation",
        "deadline": None,
        "min_land_acres": 0.5,
        "max_land_acres": None
    },
    {
        "name": "National Beekeeping & Honey Mission (NBHM)",
        "description": "Promotes scientific beekeeping to increase honey production and productivity. Provides financial support for beekeeping equipment and training.",
        "eligibility_criteria": {"farmer_category": ["all"]},
        "benefits": "90% subsidy on beekeeping equipment",
        "application_url": "https://nbb.gov.in",
        "state": "All India",
        "category": "Livestock",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": None
    },
    {
        "name": "Maharashtra Baliraja Jal Sanjiwan Yojana",
        "description": "Water conservation scheme for drought-prone areas in Maharashtra. Focuses on farm ponds, desilting, and micro-irrigation.",
        "eligibility_criteria": {"state": "Maharashtra", "farmer_category": ["all"]},
        "benefits": "Financial assistance for water conservation structures",
        "application_url": "https://mahadbt.gov.in",
        "state": "Maharashtra",
        "category": "Water Conservation",
        "deadline": None,
        "min_land_acres": 0.5,
        "max_land_acres": None
    },
    {
        "name": "Karnataka Raitha Shakti Scheme",
        "description": "Provides subsidy on agricultural equipment and machinery to farmers in Karnataka.",
        "eligibility_criteria": {"state": "Karnataka", "farmer_category": ["all"]},
        "benefits": "40-50% subsidy on farm equipment",
        "application_url": "https://raitamitra.karnataka.gov.in",
        "state": "Karnataka",
        "category": "Mechanization",
        "deadline": None,
        "min_land_acres": 1,
        "max_land_acres": None
    },
    {
        "name": "Tamil Nadu Agricultural Export Policy 2023",
        "description": "Promotes agricultural exports from Tamil Nadu. Provides market linkage and export incentives.",
        "eligibility_criteria": {"state": "Tamil Nadu", "farmer_category": ["all"]},
        "benefits": "Export assistance and market linkage",
        "application_url": "https://www.tn.gov.in",
        "state": "Tamil Nadu",
        "category": "Export Promotion",
        "deadline": None,
        "min_land_acres": 2,
        "max_land_acres": None
    },
    {
        "name": "Uttar Pradesh Mukhyamantri Khet Suraksha Yojana",
        "description": "Provides subsidy for installing solar fencing to protect crops from stray animals in UP.",
        "eligibility_criteria": {"state": "Uttar Pradesh", "farmer_category": ["all"]},
        "benefits": "60% subsidy on solar fencing",
        "application_url": "https://agriculture.up.gov.in",
        "state": "Uttar Pradesh",
        "category": "Crop Protection",
        "deadline": None,
        "min_land_acres": 1,
        "max_land_acres": None
    },
    {
        "name": "Punjab Kisan Karj Maafi Scheme",
        "description": "Farmer loan waiver scheme for Punjab farmers with loans up to ₹2 lakh.",
        "eligibility_criteria": {"state": "Punjab", "farmer_category": ["small", "marginal"], "max_loan": 200000},
        "benefits": "Loan waiver up to ₹2 lakh",
        "application_url": "https://agripb.punjab.gov.in",
        "state": "Punjab",
        "category": "Loan Waiver",
        "deadline": None,
        "min_land_acres": 0.01,
        "max_land_acres": 5
    }
]

def seed_schemes():
    client = get_supabase_client()
    if not client:
        print("Supabase client not configured")
        return
    
    try:
        existing = client.table("government_schemes").select("id").execute()
        if existing.data and len(existing.data) > 0:
            print(f"Database already has {len(existing.data)} schemes. Skipping seed.")
            return
        
        response = client.table("government_schemes").insert(SCHEMES_DATA).execute()
        print(f"Successfully seeded {len(response.data)} government schemes")
    except Exception as e:
        print(f"Error seeding schemes: {e}")

if __name__ == "__main__":
    seed_schemes()
