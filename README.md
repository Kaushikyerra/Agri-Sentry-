# 🌾 AgroAdvisor

<div align="center">
  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## 🌟 Overview

Welcome to **AgroAdvisor** - A smart agriculture advisory system designed to empower farmers with AI-driven insights. This full-stack application combines a modern React frontend with a powerful Python/FastAPI backend to provide real-time mandi prices, crop disease predictions, and personalized farming advice.

## ✨ Features

- 🌦️ **Weather Forecasts** - Real-time weather updates and forecasts to plan farming activities.
- 💰 **Mandi Prices** - Live market prices from various mandis to help farmers maximize profits.
- 🤖 **AI Crop Advisory** - Intelligent recommendations for irrigation, fertilizers, and pest control.
- 📊 **Price Prediction** - Machine learning models to forecast future crop prices.
- 📱 **Responsive Design** - Fully responsive layout that works seamlessly on mobile devices.
- 🔐 **User Authentication** - Secure login and registration via Supabase.
- 🌍 **Bilingual Support** - Accessible interface for diverse farming communities.

## 🚀 Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Python, FastAPI, Uvicorn
- **AI/ML**: Scikit-learn, Pandas, NumPy
- **Database**: Supabase (PostgreSQL)
- **State Management**: Tanstack Query
- **Routing**: React Router
- **Icons**: Lucide Icons

## 🛠️ Installation

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- npm or bun
- Supabase account

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd field-whisperer-10-main
   ```

2. **Frontend Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Start development server
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd backend
   
   # Create virtual environment (optional but recommended)
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start backend server
   uvicorn api:app --reload
   ```

4. **Environment Setup**
   - Create a `.env` file in the root directory based on `.env.example`.
   - Add your Supabase credentials and API keys.

5. **Open in browser**
   - Frontend: http://localhost:8080 (or port shown in terminal)
   - Backend API: http://localhost:8000

## 📂 Project Structure

```
field-whisperer-10-main/
├── backend/              # Python FastAPI backend
│   ├── api.py            # Main API application
│   ├── train_model.py    # ML model training script
│   └── requirements.txt  # Python dependencies
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/            # Page components
│   ├── integrations/     # Supabase & 3rd party integrations
│   └── main.tsx          # Frontend entry point
├── public/               # Static assets
├── index.html            # HTML entry point
├── package.json          # Frontend dependencies
└── README.md             # Project documentation
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  Made with ❤️ for Farmers
</div>
