# Sutras Platform - Frontend Architecture & Dashboard Guide

This document provides a highly detailed overview of the frontend architecture for the Sutras platform, focusing specifically on the **Student Portal** and the **Admin Panel**. This guide is intended to help developers understand the UI structure, features, and dashboards when rebuilding or maintaining the application.

---

## 1. Frontend Architectural Overview

The frontend is built using **Next.js (App Router)** and **React 19**, leveraging modern React features (like `use client`, Hooks, and Context API). 

### Core Structure
The UI is modularized using Next.js Route Groups (directories wrapped in parentheses like `(student-portal)`) to separate concerns without affecting the URL paths.

- **Styling:** Vanilla CSS Modules (`page.module.css`) for scoped component styling, combined with global styles (`globals.css`) and responsive overrides (`mobile.css`). A Glassmorphism aesthetic is prominent throughout the app.
- **State Management & Context:** React Context is heavily used (`AuthContext`, `CollegeContext`) to provide user session data and branding settings across the platform.
- **Icons:** A custom icon library (`IconShield`, `IconCheck`, etc.) is used consistently across dashboards for visual hierarchy.
- **Backend Integration:** The frontend directly interfaces with Firebase (Firestore, Storage, Auth) using the Client SDK for real-time data fetching, supplemented by Next.js API route calls for secured server operations.

---

## 2. Student Portal (`/src/app/(student-portal)`)

The Student Portal is the primary interface for end-users, containing all academic and community features.

### 2.1 Main Dashboard (`/dashboard`)
The central hub for students after logging in.
*   **Overview:** Displays a summary of the student's academic progress, recent assignments, and quick links to core features.
*   **Classroom Tab (`ClassroomTab.js`):** Integrates the user's specific class data, pulling subjects and faculty details based on their `year`, `branch`, and `division`.

### 2.2 Academic Resources
*   **Subjects (`/subjects`):** Organizes study materials, notes, and course modules by branch and year.
*   **PYQs (`/pyqs`):** Previous Year Questions archive. Allows students to filter and download past exam papers for practice.
*   **Paper Analysis (`/paper-analysis`):** A specialized tool (often AI-assisted) that breaks down past papers to highlight important topics, frequency of questions, and exam patterns.
*   **Assignments (`/assignments`):** A dashboard to view pending, submitted, and graded assignments. Includes submission portals and deadline tracking.
*   **Upload (`/upload`):** Allows students (or contributors) to upload new notes, PYQs, and assignments to the platform. Uploaded files usually go into a 'pending' state awaiting admin approval.

### 2.3 Interactive & AI Features
*   **AI Tutor / Assistant (`/assistant`):** Powered by Google Generative AI, this provides a chat interface where students can ask academic questions, get study guides, or receive explanations of complex topics.
*   **Exam Mode (`/exam-mode`):** A timed practice testing environment where students can take mock tests or attempt multiple-choice questions (MCQs) under exam conditions.
*   **YouTube Library (`/youtube`):** A curated repository of video lectures organized by subject, managed centrally by the admin.

### 2.4 Community & Extracurriculars
*   **Community (`/community`):** A discussion forum where students can post questions, share resources, and interact with peers.
*   **Clubs (`/clubs`):** A directory of student organizations. Students can view club profiles, upcoming events, and join requests.
*   **News (`/news`):** A feed for college notices, campus news, and announcements.
*   **Leaderboard (`/leaderboard`):** A gamified ranking system that displays top contributors (students who upload notes or answer questions) to encourage engagement.
*   **Profile (`/profile`):** User settings where students can update their branch, year, avatar, and personal details.

---

## 3. Admin Panel (`/src/app/(admin-panel)`)

The Admin Panel (`/admin`) is a highly privileged area accessible only to predefined admin emails (e.g., `sutraverse11@gmail.com`) or users with the `isAdmin` flag. It provides comprehensive control over the platform's content and appearance.

### 3.1 Content Moderation (File Management)
The default view for admins is the file moderation queue.
*   **Pending Queue:** When students upload materials (Notes, PYQs, Assignments), they appear here. Admins can **Approve** (making them public), **Reject** (deleting them), or **Edit** metadata (fixing titles, subjects, or branches).
*   **Reported Files:** A dashboard to review files flagged by users for issues (e.g., wrong syllabus, poor quality). Admins can dismiss reports or remove the files.
*   **Automated Notifications:** Approving a file automatically triggers a push notification to relevant users via the `/api/notifications/generate-and-send` endpoint.

### 3.2 User Management (`UserAdmin.js`)
*   **Role Toggling:** Admins can instantly toggle a user's role between `student` and `teacher`.
*   **Teacher Assignments:** Admins can assign specific subjects to teachers, designate them as Class Teachers, or HODs (Head of Department), linking them to specific class IDs (e.g., `1st Year-Computer-A`).
*   **Profile Overrides:** Ability to manually update a student's roll number, student ID, branch, and division.

### 3.3 Platform Customization & Branding (`BrandingAdmin.js`)
The admin panel offers deep white-labeling and UI customization, stored in the `settings/college` Firestore document.
*   **Feature Toggles:** Admins can turn entire modules on or off (e.g., disabling 'Exam Mode' or 'Community').
*   **Branding Colors:** Real-time editing of Primary, Secondary, and Accent colors for both Light and Dark modes. Colors can be applied globally.
*   **Typography & Styling:** Options to switch fonts (`fontFamily`), toggle glassmorphism, and adjust corner radiuses (rounded vs. sharp).
*   **Text & Copy:** Admins can customize the College Name, Tagline, Hero Subtitles, and default placeholder texts across the app.
*   **Welcome Popups & Announcements:** Configure site-wide alert banners or welcome modals.
*   **Maintenance Mode:** A toggle to instantly put the site into maintenance mode with a custom message.

### 3.4 Community & News Moderation
*   **News Management:** Approve or reject community news and notices submitted by users. Approving news triggers a campus-wide push notification.
*   **Clubs Management:** Review, approve, or reject new student club applications.

### 3.5 Broadcast System (`BroadcastSection.js`)
*   **Push Notifications:** A direct interface to send custom Push Notifications (Title and Body) to all connected devices across the campus using the Expo Server SDK.

### 3.6 Data Seeding Tools
*   **Database Utilities:** Buttons to run background scripts (like `handleSeedM2` or `handleSeedBEE`) that quickly populate the database with core syllabus notes, or scripts to bulk-fix metadata across thousands of files.

### 3.7 YouTube Admin (`YouTubeAdmin.js`)
*   **Video Management:** A dedicated sub-dashboard to add, categorize, and remove YouTube lecture links that appear in the student portal's YouTube library.

---

## 4. Summary of Data Flow in Dashboards

1. **Client Request:** A dashboard (e.g., `page.js` in `/admin`) mounts and checks `AuthContext` to verify the user.
2. **Data Fetching:** Standard `useEffect` hooks trigger Firebase SDK calls (e.g., `getDocs(collection(db, 'files'))`).
3. **State Updates:** React `useState` holds the arrays of users, files, or news items.
4. **Mutations:** Admin actions (Approve/Reject) update the Firestore document via `updateDoc` or `deleteDoc` and optionally call a Next.js API route (`fetch('/api/notifications/...')`) for side effects like push notifications.
5. **Real-time Context:** The `CollegeContext` listens to the `settings/college` document. When the admin updates branding, the context updates instantly, reflecting color and feature changes across the entire app for all users.
