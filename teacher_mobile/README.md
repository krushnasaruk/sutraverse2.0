# 🧑‍🏫 Sutras Professor — Teacher Portal Mobile

Official Flutter application for faculty and administrators of the Sutras platform. This app is directly synchronized with the web portal and provides mobile-first tools for classroom management, attendance broadcasting, and automated student-parent communication.

---

## 🚀 Core Features

### 1. Classroom Intelligence
*   **Multi-Class Dashboard**: Seamlessly switch between assigned classes and subjects.
*   **Real-time Stats**: Instant visibility into attendance percentages, pending leave requests, and assignment submission rates.
*   **Defaulter Watch**: Automatic flagging of students falling below the 75% attendance threshold.

### 2. High-Tech Attendance
*   **Radar Broadcast**: Start a geo-fenced attendance session. Students within a 15m radius can check-in using the Sutras mobile app.
*   **Dynamic QR Generator**: Generate a secure, time-limited QR code for in-class scanning.
*   **Manual Override**: Quickly mark individual students present/absent from the mobile roster.

### 3. ERP & Academic Management
*   **Grade Center**: Post marks for internal tests and assignments.
*   **SPPU Integration**: Automatic calculation of estimated SGPAs based on 2019 pattern criteria.
*   **Leave Approval**: View, reject, or approve student leave requests with one tap.
*   **Diary/Logbook**: Maintain a digital record of syllabus completion and topics covered in each lecture.

### 4. Smart Communication
*   **Campus Broadcast**: Send push notifications to the entire class for urgent updates or holiday notices.
*   **WhatsApp Connect**: Integrated shortcuts to message students or parents via the Twilio/WhatsApp API logic.

---

## 🛠️ Technical Setup

### Prerequisites
*   [Flutter SDK](https://docs.flutter.dev/get-started/install) (v3.0.0+)
*   [Firebase Account](https://firebase.google.com/) (Connected to the same project as the web portal)

### Getting Started
1.  **Install Dependencies**:
    ```bash
    flutter pub get
    ```
2.  **Firebase Configuration**:
    *   Place your `google-services.json` (Android) in `android/app/`.
    *   Place your `GoogleService-Info.plist` (iOS) in `ios/Runner/`.
3.  **Run the App**:
    ```bash
    flutter run
    ```

---

## 📁 Project Structure

*   `lib/core/`: Application constants, themes, and configuration.
*   `lib/models/`: Data models (Classroom, Student, Attendance, etc.).
*   `lib/services/`: Firebase Auth, Firestore, and Geolocation service logic.
*   `lib/ui/screens/`: Feature-specific screens (Attendance, Grading, Analytics).
*   `lib/ui/widgets/`: Reusable UI components (Bento cards, Custom buttons).

---

## 🌓 Theme Support
The app supports a premium **Glassmorphic UI** in both Dark and Light modes, matching the visual identity of the Sutras platform.
