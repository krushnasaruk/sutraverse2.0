# 🎓 Sutras — The Gamified AI-ERP for Modern Universities

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/)

---

## 🦈 The Pitch: Why Sutras is the Future of Higher Education

Every year, universities pay millions of dollars for clunky, outdated, and uninspired student portals (LMS/ERP). Students hate using them, teachers hate managing them, and academic engagement is at an all-time low. 

**Enter Sutras.**

We have built a sleek, gamified, and AI-first student platform designed to maximize engagement, secure class attendance, and supercharge study productivity. By combining cutting-edge AI academic tools with gaming mechanics (streaks, leaderboards, levels), we transform boring college administrative tasks into an engaging student experience.

---

## 🚨 The Pain Points We Solve

1. **The Attendance Leak:** Students proxy for friends. With Sutras, our **Facial Recognition & Geo-Radar Check-In** ensures that the student is physically present within 15 meters of the classroom before checking in.
2. **Scattered Study Materials:** Notes, past papers (PYQs), and assignments are scattered across messaging groups. Sutras acts as a **unified, fast, and structured hub** for notes and previous year papers.
3. **Passive Study Habits:** Students struggle to summarize huge PDFs. Our **AI Copilot** reads lecture notes, generates custom interactive quizzes (MCQs) in real-time, and builds study guides on demand.
4. **Poor Student Retention:** Administrative portals feel like a chore. Sutras uses **Gamification (daily attendance streaks, experience points, badges, and class leaderboards)** to make showing up to class rewarding.

---

## 🔥 Key Product Pillars

### 🧠 1. The AI Learning Suite
* **AI Copilot:** A context-aware chatbot trained on class materials to help students ask questions and learn fast.
* **Quiz Generator:** Instantly converts lecture slides and documents into interactive practice tests.
* **Auto Study Guides:** Summarizes lecture PDFs into brief, readable study files on the fly.

### 🔒 2. Anti-Proxy Attendance & Biometrics
* **Geo-Radar Verification:** Checks student GPS location to verify they are in the classroom.
* **Facial Detection:** Compares live camera scans against enrolled student profiles to prevent proxy check-ins.
* **Fast PIN/QR check-in:** Quick scanner routines for seamless, secure record logging.

### 🎮 3. Gamification Engine
* **Daily Streaks:** Show up to class, keep your streak alive, and protect your streak when submitting leave requests.
* **Level & Badge Progression:** Gain experience points (XP) for uploading notes, taking quizzes, and scoring high.
* **Leaderboards:** Friendly competition across branches to motivate student performance.

### 📂 4. Organized Resource Hub
* **Subjects Hub:** Neat access cards for first-year and branch-specific study notes.
* **Assignments Desk:** Instant uploads, progress bars, and teacher grading review panels.
* **PYQ Paper Archives:** A dynamically indexed archive for past SPPU exams, supporting Word, PowerPoint, and ZIP folders.

---

## 🛠️ High-Level Architecture

* **Frontend Experience:** Modern Next.js application built with a premium dark-mode aesthetic and smooth micro-animations.
* **Backend API & Security:** Secure serverless routes backed by custom Edge Middleware that prevents malicious files, SQL injections, and rate-limits expensive endpoints.
* **Database & Files System:** Structured cloud storage and real-time Firestore database synchronization for class announcements and grades.

---

## 🚀 Setup & Launch

Interested in deploying Sutras at your campus?

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Setup your Firebase variables in `.env.local`
3. Launch local dev environment:
   ```bash
   npm run dev
   ```
