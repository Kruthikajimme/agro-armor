# 🌾 AgroArmor (AgroArmour LSM)
### AI-Powered Livestock & Poultry Health Management, Multilingual Voice Navigation, and Veterinary Ecosystem

[![Build & Deploy](https://img.shields.io/badge/Deploy-Render%20Blueprint-46E3B7?logo=render&logoColor=white)](render.yaml)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black)](Farmers-development/farm/frontend)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20MongoDB-339933?logo=node.js&logoColor=white)](Farmers-development/farm/backend)
[![ML Microservice](https://img.shields.io/badge/AI%2FML-TensorFlow%20%7C%20Flask%20%7C%20Python%203.11-FF6F00?logo=tensorflow&logoColor=white)](Farmers-development/ML)
[![Languages](https://img.shields.io/badge/Languages-11%20Indian%20Regional%20Languages-10B981)](#-multilingual-voice-navigation--accessibility)

---

## 📖 1. Project Introduction

**AgroArmor** (also known as **AgroArmour LSM**) is an enterprise-grade, comprehensive agricultural and livestock management platform tailored specifically for Indian farmers, smallholders, poultry producers, and veterinarians. 

Combining **real-time AI-based disease diagnosis**, **GPS livestock tracking**, **veterinary teleconsultation**, **biosecurity & hygiene auditing**, **supplies marketplace**, and **hands-free multilingual voice navigation**, AgroArmor breaks digital and literacy barriers to safeguard animal health and empower rural farmers.

---

## 🚨 2. Problem Statement

Livestock and poultry farming in rural India faces systemic hurdles:
1. **Delayed Disease Detection**: Contagious diseases like Coccidiosis, Ranikhet (Newcastle Disease), Salmonella, and Foot-and-Mouth Disease (FMD) devastate entire flocks/herds before diagnosis.
2. **Veterinary Scarcity**: Distance to veterinary clinics and lack of real-time clinic availability result in preventable livestock mortality.
3. **Low-Literacy & Language Barriers**: Conventional software applications demand English or formal text typing, excluding millions of grassroots farmers.
4. **Counterfeit/Unreliable Supplies**: Difficulty sourcing genuine vaccines, feed supplements, and diagnostic kits on time.
5. **Biosecurity Compliance Gaps**: Absence of structured hygiene tracking protocols on small and medium farms.

---

## 🎯 3. Project Objectives

- **Democratize Animal Healthcare**: Deliver instant, computer-vision disease screening directly via smartphone cameras.
- **Voice-First Accessibility**: Provide voice navigation and spoken audio feedback in 11 Indian languages, allowing illiterate or semi-literate farmers to operate the entire platform hands-free.
- **Connect Farmers & Veterinarians**: Enable instant GPS discovery of nearby veterinarians, clinics, and teleconsultation booking.
- **Streamline Farm Operations**: Digitize daily livestock routines, vaccination calendars, feed tracking, and biosecurity hygiene scores.
- **Secure Marketplace**: Provide direct access to verified vaccines, livestock medicines, and nutritional feed.

---

## ✨ 4. Features and Modules

| Module | Route | Description |
| :--- | :--- | :--- |
| **Home Dashboard** | `/` | Central hub displaying farm vitals, quick SOS vet call, alerts, and recent activities |
| **AI Disease Detection** | `/medical` | Deep learning image analysis for poultry and cattle disease diagnosis with instant remedies |
| **Veterinary Discovery** | `/find-vet` | Interactive GPS map locating verified veterinary doctors and clinics with operating hours |
| **Animal GPS Tracking** | `/gps-tracking` | Real-time herd and flock tracking with geofencing and collar health monitors |
| **Hygiene Assessment** | `/hygiene-test` | Standardized biosecurity and farm hygiene audit calculator generating actionable health scores |
| **Disease Awareness** | `/awareness` | Comprehensive guides and symptoms catalog for livestock epidemics and seasonal prevention |
| **Livestock Marketplace** | `/marketplace` | E-commerce catalog for approved vaccines, feeds, and farm veterinary supplies with cart & checkout |
| **Tasks & Farm Todo** | `/todo-list` | Daily schedule management, vaccination reminders, and critical task tracking |
| **Community Forum** | `/community` | Peer-to-peer farmer exchange, outbreak reports, and veterinary Q&A |
| **Compliance Tracker** | `/compliance` | Regulatory and animal welfare compliance checklist with certificate generation |
| **Farmer Profile** | `/profile` | Farm metadata, livestock headcount, and personalized regional preferences |
| **Admin Portal** | `/admin` | Administrative monitoring of users, consultation orders, support tickets, and A/B analytics |
| **Multilingual Voice Assistant** | Global | Hands-free spoken navigation, command interpretation, and audio feedback in 11 regional languages |

---

## 🛠️ 5. Technology Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript (`strict` mode)
- **Styling**: Tailwind CSS, PostCSS, `tailwindcss-animate`
- **UI Components**: Radix UI Primitives, `shadcn/ui`, Lucide Icons
- **State & Data Fetching**: TanStack React Query v5, Context API (`LanguageContext`, `CartContext`)
- **Routing**: React Router DOM v6
- **Charts & Maps**: Recharts, Google Maps API

### Backend API
- **Runtime**: Node.js (v20+ LTS)
- **Framework**: Express.js (v5)
- **Database**: MongoDB with Mongoose ODM (MongoDB Atlas)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **Security & Networking**: CORS whitelist, custom DNS resolver (`8.8.8.8`), security headers
- **Job Scheduling**: Background notification and reminder services

### Machine Learning Microservice
- **Runtime**: Python 3.11
- **Framework**: Flask, Flask-CORS, Gunicorn
- **Deep Learning**: TensorFlow 2.15, `tf_keras`, MobileNetV2 CNN Architecture
- **Image Processing**: Pillow (PIL), NumPy
- **Containerization**: Docker (`python:3.11-slim`)

---

## 🎙️ 6. Multilingual Voice Navigation & Accessibility

AgroArmor implements a voice navigation system designed specifically for low-literacy Indian farmers.

### Supported Languages (11 Indic Languages)
1. **Kannada (ಕನ್ನಡ)** – `kn-IN`
2. **Hindi (हिन्दी)** – `hi-IN`
3. **Telugu (తెలుగు)** – `te-IN`
4. **Tamil (தமிழ்)** – `ta-IN`
5. **English** – `en-IN`
6. **Malayalam (മലയാളം)** – `ml-IN`
7. **Marathi (मराठी)** – `mr-IN`
8. **Bengali (বাংলা)** – `bn-IN`
9. **Gujarati (ગુજરાતી)** – `gu-IN`
10. **Punjabi (ਪੰਜਾਬੀ)** – `pa-IN`
11. **Odia (ଓଡ଼ିଆ)** – `or-IN`

### Key Voice Capabilities
- **Dual Trigger Access**: Dedicated microphone icon in the main navigation bar + floating action button on every screen.
- **Microphone Permission Handling**: Graceful fallback and permission prompts when microphone access is blocked.
- **Indic Script Normalization**: Punctuation and inflection removal preserving regional Unicode characters.
- **Bilingual & Code-Switching**: Understands colloquial combinations (e.g. *"Marketplace kholo"*, *"Doctor page ge hogi"*).
- **Spoken Audio Feedback**: Browser `SpeechSynthesis` confirms navigation in the farmer's native tongue.
- **Pre-tested Voice Commands**:
  - *"Take me to Marketplace."* &rarr; `/marketplace`
  - *"Go to Health."* &rarr; `/medical`
  - *"Open Veterinary."* &rarr; `/medical`
  - *"Show my livestock."* &rarr; `/gps-tracking`
  - *"Open Dashboard."* &rarr; `/`
  - *"Go to Hygiene."* &rarr; `/hygiene-test`
  - *"Go back."* &rarr; Previous page (`__back__`)

---

## 🧠 7. AI/ML Disease Detection Architecture

The ML service (`Farmers-development/ML`) utilizes a Convolutional Neural Network trained on poultry fecal and symptom imagery.

- **Classes Classified**:
  1. `Coccidiosis` (Parasitic intestinal disease)
  2. `Healthy` (Normal baseline)
  3. `New Castle Disease` (Ranikhet contagious viral infection)
  4. `Salmonella` (Bacterial infection)
- **Inference Pipeline**:
  1. Image upload via multipart POST to `/predict`
  2. Image resized to $224 \times 224$ pixels, normalized with MobileNetV2 preprocessing
  3. Softmax probability output with confidence score and class distribution

---

## 📁 8. Project Structure

```
agroarmor/
├── .env.example                     # Environment template for all services
├── .gitignore                       # Production Git ignore rules
├── README.md                        # Master project documentation
├── render.yaml                      # Render Blueprint Infrastructure-as-Code
└── Farmers-development/
    ├── ML/                          # Python Flask Deep Learning Service
    │   ├── app.py                   # Flask API entrypoint (/predict, /health)
    │   ├── chicken_disease_model.h5 # Trained Keras CNN model weights
    │   ├── Dockerfile               # Production Docker container definition
    │   └── requirements.txt         # Python dependencies
    └── farm/
        ├── backend/                 # Node.js Express REST API
        │   ├── config/              # MongoDB connection configuration
        │   ├── controllers/         # Business logic handlers
        │   ├── middleware/          # JWT auth & error handling middleware
        │   ├── models/              # Mongoose database schemas
        │   ├── routes/              # Express API route modules
        │   ├── services/            # Notification & scheduler services
        │   ├── package.json         # Backend dependencies
        │   └── server.js            # Express server entrypoint
        └── frontend/                # React Vite TypeScript Single Page App
            ├── src/
            │   ├── assets/          # Static imagery & graphics
            │   ├── Backend/api/     # Frontend API client modules
            │   ├── components/      # UI components & VoiceAssistant
            │   ├── contexts/        # React Contexts (Language, Cart)
            │   ├── i18n/            # 11 Indian language dictionary files
            │   ├── pages/           # Application views & dashboards
            │   ├── utils/           # Voice registry engine & test suites
            │   ├── App.tsx          # Master routing configuration
            │   └── main.tsx         # React DOM mount point
            ├── package.json         # Frontend dependencies
            └── vite.config.ts       # Vite build & proxy settings
```

---

## 🚀 9. Installation & Local Development

### Prerequisites
- **Node.js**: v18 or v20+ LTS
- **Python**: v3.10 or v3.11
- **MongoDB**: Local MongoDB or MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/Kruthikajimme/agroarmor.git
cd agroarmor
```

### 2. Configure Environment Variables
Copy `.env.example` into your local `.env`:
```bash
cp .env.example .env
```
Ensure `MONGODB_URI` and `JWT_SECRET` are configured.

### 3. Setup and Run the Backend API
```bash
cd Farmers-development/farm/backend
npm install
npm run dev
# Running on http://localhost:5002
```

### 4. Setup and Run the React Frontend
```bash
cd Farmers-development/farm/frontend
npm install
npm run dev
# Running on http://localhost:8083
```

### 5. Setup and Run the ML Microservice
```bash
cd Farmers-development/ML
pip install -r requirements.txt
python app.py
# Running on http://localhost:5000
```

---

## 🧪 10. Verification & Testing

### Voice Navigation Test Suite
Run the automated multilingual voice command interpreter test suite:
```bash
cd Farmers-development/farm/frontend
npx tsx src/utils/voiceRegistry.test.ts
# Result: 94 passed, 0 failed, 100% test passing
```

### Frontend Production Build
Validate production bundling and TypeScript validation:
```bash
cd Farmers-development/farm/frontend
npm run build
# Built cleanly into dist/ directory
```

---

## ☁️ 11. Render Deployment (render.yaml Blueprint)

The project includes an Infrastructure-as-Code Blueprint (`render.yaml`) that deploys all three microservices seamlessly on **Render**:

1. **`agroarmour-ml`**: Python Flask Docker/Python service on `free` plan.
2. **`agroarmour-backend`**: Node.js Express web service with MongoDB Atlas connectivity.
3. **`agroarmourlsm-frontend`**: Static web application publishing the Vite `dist/` bundle with SPA URL rewrites.

### Steps to Deploy on Render:
1. Log into your Render dashboard at [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** &rarr; **Blueprint**.
3. Connect your GitHub repository (`Kruthikajimme/agroarmor`).
4. Render automatically reads `render.yaml` and provisions all 3 services.
5. Set the required secret environment variables (`MONGODB_URI`, `JWT_SECRET`) in the Render Dashboard.
6. Click **Apply Blueprint** to launch the live platform.

---

## 📄 License & Ownership
Copyright © 2026 Kruthika. All rights reserved.
Developed for AgroArmor / AgroArmour Livestock & Poultry Management.
