# 📚 Sutras Mobile App (Android & iOS)

> [!IMPORTANT]
> **React Native to Flutter Migration Plan Active**:
> We are planning a migration from React Native/Expo to Flutter. All PRD, TRD, UI/UX Design tokens, App Flows, Backend Firestore Schemas, and the step-by-step migration guide are documented in:
> 👉 [**Flutter Migration Specification (README_FLUTTER_MIGRATION.md)**](./README_FLUTTER_MIGRATION.md)

Sutras is a React Native mobile application built using **Expo** and **Expo Router**. It serves as the mobile companion to the Sutras platform, featuring AI-powered tools, community features, and student resources.

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- [Android Studio](https://developer.android.com/studio) (for Android development)
- [Java Development Kit (JDK)](https://adoptium.net/) (v17 recommended for React Native)
- [Watchman](https://facebook.github.io/watchman/docs/install) (for macOS users)

### 2. Installation
Navigate to the mobile directory and install dependencies:
```bash
cd mobile
npm install
```

### 3. Running the App
Start the Expo development server:
```bash
npx expo start
```
- Press **`a`** to open the app in an Android emulator.
- Press **`i`** to open the app in an iOS simulator.
- Use the **Expo Go** app on your physical device to scan the QR code.

---

## 🛠️ Android Studio Integration

To work on the native Android code or create production builds, you may need to use Android Studio.

### 1. Generate Native Files
If the `android` folder is missing, generate it using:
```bash
npx expo prebuild
```

### 2. Opening in Android Studio
1. Open **Android Studio**.
2. Select **"Open an existing project"**.
3. Navigate to the `mobile/android` directory and select it.
4. Wait for Gradle to finish syncing.

### 3. Running from Android Studio
Once the project is loaded, you can run the app directly from the "Run" button in Android Studio, selecting your target device/emulator.

---

## 📁 Project Structure

- `src/app/` - File-based routing (Expo Router).
- `src/components/` - Reusable UI components.
- `src/context/` - Global state (Auth, etc.).
- `src/lib/` - Service initializations (Firebase, API).
- `assets/` - Images, fonts, and splash screen resources.

## 🎨 Design System

The app follows a modern UI/UX design inspired by apps like Blinkit and Unstop. 
For detailed information on colors, typography, and component patterns, see:
👉 [**Design System Guide (README_DESIGN.md)**](./README_DESIGN.md)

---

## 🛡️ Features

- **AI Copilot:** Integration with Google Gemini for smart assistance.
- **Firebase Auth:** Secure user authentication.
- **Firestore:** Real-time database for community and notifications.
- **Expo Notifications:** Push notification support.
- **File Sharing:** Support for PDFs and study guides.

## 📝 Troubleshooting

- **Gradle Sync Issues:** Ensure your `local.properties` file in the `android` folder has the correct `sdk.dir` path.
- **Clear Cache:** If you face weird build errors, try:
  ```bash
  npx expo start -c
  ```
- **Android Build Failure:** Try cleaning the gradle build:
  ```bash
  cd android && ./gradlew clean && cd ..
  ```

---

## 📄 License
Part of the Sutras College Project.
