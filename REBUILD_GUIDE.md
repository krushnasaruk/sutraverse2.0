# Sutras Platform - Complete Rebuild Guide

This document is a comprehensive guide to remaking the entire Sutras (student-platform) codebase from scratch. It details the architecture, tech stack, directory structure, environment configurations, and a step-by-step rebuilding roadmap.

---

## 1. Tech Stack Overview

If you are rebuilding this from scratch, you will need the following core technologies:

* **Framework:** Next.js (App Router, v16.2.3)
* **UI/Frontend:** React (v19), React DOM
* **Database & Auth:** Firebase (Client `firebase` v12, Admin `firebase-admin` v13), Firestore, Firebase Storage
* **AI Integration:** Google Generative AI (`@google/generative-ai`) for Assistant, Copilot, MCQ, and Study Guide generation
* **Notifications:** Expo Server SDK (Push Notifications), Twilio/WhatsApp integration (via API)
* **Biometrics / Camera:** `@vladmandic/face-api`, `react-webcam`, `jsqr` (QR code scanning)
* **Formatting:** `react-markdown`, `remark-gfm`
* **Testing:** Vitest, Testing Library

---

## 2. Environment Variables (`.env.local`)

To build this locally, you must set up your environment variables. 
Create an `.env.local` file at the root:

```env
# Firebase Client Configuration (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin Configuration (Backend)
# Note: Serialize your service account JSON into a string for security, avoid putting the JSON file directly in the codebase.
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account", "project_id":"..."}' 

# Google Generative AI
GEMINI_API_KEY=your_gemini_api_key

# External Services
EXPO_ACCESS_TOKEN=your_expo_token
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

---

## 3. Recommended Directory Structure

For a clean rebuild, adhere to this modular structure:

```
├── public/                 # Static assets (images, icons)
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (admin-panel)/  # Admin UI pages
│   │   ├── (auth)/         # Login, Register, Forgot Password
│   │   ├── (legal)/        # Privacy policy, Terms
│   │   ├── (student-portal)/ # Student dashboard, assignments, classes
│   │   ├── (teacher-portal)/ # Teacher dashboard, management
│   │   ├── api/            # Next.js API Routes (Route Handlers)
│   │   │   ├── assistant/  
│   │   │   ├── copilot/
│   │   │   ├── downloads/
│   │   │   ├── notifications/
│   │   │   └── ...
│   │   ├── globals.css
│   │   └── layout.js       # Root layout
│   │
│   ├── backend/            # Business Logic / Controllers
│   │   └── controllers/    # Separates logic from API route handling
│   │       ├── aiController.js
│   │       ├── assistantController.js
│   │       ├── copilotController.js
│   │       ├── uploadController.js
│   │       └── ...
│   │
│   ├── database/           # Database configurations & scripts
│   │   ├── config/
│   │   │   ├── firebase.js       # Client-side init
│   │   │   └── firebaseAdmin.js  # Server-side admin init
│   │   ├── firestore.rules # Security rules
│   │   └── scripts/        # Migration / Seed scripts
│   │
│   ├── shared/             # Reusable utilities & constants
│   │   ├── constants/
│   │   └── utils/
│   │
│   └── middleware.js       # Edge Middleware (WAF, Rate Limiting, Route Protection)
│
├── .env.local
├── next.config.mjs
└── package.json
```

---

## 4. Step-by-Step Rebuild Guide

### Step 1: Initialize the Project
```bash
npx create-next-app@latest student-platform
# Choose: Yes to App Router, No to Tailwind (unless preferred), Yes to src/ directory.
cd student-platform
```

### Step 2: Install Core Dependencies
```bash
npm install firebase firebase-admin @google/generative-ai expo-server-sdk @vladmandic/face-api react-webcam jsqr react-markdown remark-gfm
```

### Step 3: Setup Firebase Configuration
1. In `src/database/config/firebase.js`, initialize the standard client SDK using `NEXT_PUBLIC_` env vars.
2. In `src/database/config/firebaseAdmin.js`, initialize the admin SDK using the `FIREBASE_SERVICE_ACCOUNT` env var. **Do not store service account key JSON files on disk**.

### Step 4: Build the Shared & Constants Layer
1. Create `src/shared/constants/subjectMap.js` (and similar files) to hold application-wide constants.
2. Create utility functions (e.g., `src/shared/utils/requireUser.js` for authenticating backend API requests).

### Step 5: Implement Backend Controllers
Before writing API routes, build out your business logic in `src/backend/controllers/`.
* `aiController.js` / `copilotController.js`: Initialize `@google/generative-ai` and build prompt handlers.
* `uploadController.js`: Handle secure file uploads. 
* `downloadsfilepathController.js`: Secure file delivery (ensure you implement path traversal protection).

### Step 6: Create the Next.js API Routes
In `src/app/api/`, create the endpoints. Wrap your controller logic here.
* **CRITICAL:** Ensure every protected endpoint validates the Firebase Auth token using the Admin SDK. Do not leave routes unauthenticated.

### Step 7: Build the Frontend Portals
Use Route Groups `(folder)` to logically group the UI without affecting the URL path.
* `(auth)`: Login/Signup components integrating Firebase Auth.
* `(student-portal)`: Dashboards, Assignments, Paper Analysis chat.
* `(teacher-portal)`: Class management, assignment uploading.
* `(admin-panel)`: Global management, seeding data.

### Step 8: Apply Middleware and Security
1. Add `src/middleware.js` to handle global rate limiting, IP banning, and blocking malicious payloads (like `../` in URLs).
2. Write secure `firestore.rules` and `storage.rules` inside `src/database/` and deploy them to Firebase to lock down client-side access.

---

## 5. Key Features to Reimplement

1. **AI Copilot & Assistant:**
   * Utilizes Gemini API to read student contexts or course material and answer queries.
2. **File Downloads System:**
   * Custom local file serving (`src/app/api/downloads/[...filepath]`) or Firebase Storage. If using local files, secure the paths to prevent directory traversal.
3. **Face API / Biometrics:**
   * Integrated via `react-webcam` and `@vladmandic/face-api` for attendance or identity verification.
4. **Push Notifications:**
   * Uses `expo-server-sdk` to send broadcast or targeted messages to connected mobile devices.
5. **Seeding Scripts:**
   * Found in `api/seed-*`. Helpful for populating test data, PYQs (Previous Year Questions), and YouTube links. Ensure these are strictly protected by Admin authentication.

## 6. Security Best Practices (Crucial for Rebuild)

Based on prior audits, ensure you implement the following from day one:
* **Global Auth Helper:** Never trust client data; verify Bearer tokens via Firebase Admin in *every* API route.
* **No Hardcoded Keys:** Do not fallback to hardcoded API keys if `.env` fails. Fail loudly.
* **WAF Middleware:** Enforce Rate-limits at the edge.
* **Strict Firestore Rules:** Default to `allow read, write: if false;` and explicitly open only what is necessary based on `request.auth.uid`.
