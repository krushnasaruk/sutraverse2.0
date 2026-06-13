# Sutras — Security Review & Demo Kit

This repository has undergone a comprehensive security audit of its Next.js API routes, Firebase configuration, and Firestore rules. The original findings and security demonstration scripts were packaged in [Sutras-Security.rar](file:///Users/shrikantsaruk/Documents/college%20project/Sutras-Security.rar), which has been extracted to the [sutras-security-extracted](file:///Users/shrikantsaruk/Documents/college%20project/sutras-security-extracted) directory.

This document serves as the master guide for the security vulnerabilities discovered, the scorecard of the codebase, and instructions on how to use the interactive demonstration kit to verify the fixes.

---

## 📊 Codebase Scorecard

The codebase received an overall rating of **6.0 / 10** in [CODE_REVIEW.md](file:///Users/shrikantsaruk/Documents/college%20project/sutras-security-extracted/CODE_REVIEW.md). 

| Dimension | Score | Assessment |
|---|:---:|---|
| **Architecture & Structure** | `6.5 / 10` | Clean domain-driven directory splitting, but contains massive "god" page components (up to 2,300 lines). |
| **Security** | `4.5 / 10` | Strong Firestore database rules, but 13 out of 17 API routes are completely unauthenticated. |
| **Code Quality** | `6.0 / 10` | Readable and consistent styling, but plagued by huge single-file layouts and leftover debug code. |
| **Testing** | `1.0 / 10` | No test runner configured and zero tests written. |
| **Tooling & Hygiene** | `5.0 / 10` | ESLint is configured, but the repo root is cluttered with temporary scripts, data folders, and oversized logs. |
| **Feature Completeness**| `8.5 / 10` | Broad features are fully implemented (AI copilot, Expo push, Twilio WhatsApp, face recognition). |

> [!NOTE]
> The gap between a prototype and a production-ready application lies in **API-route authentication**, **component decomposition**, and **automated testing**.

---

## 🔒 Security Vulnerabilities Summary

A total of 9 issues were identified in [VULNERABILITIES.md](file:///Users/shrikantsaruk/Documents/college%20project/sutras-security-extracted/VULNERABILITIES.md), ranging from critical anonymous API access to configuration issues.

| # | Vulnerability | Severity | Impact | Location |
|:--:|---|:--:|---|---|
| 1 | **Unauthenticated AI Routes** | **High** | Paid Gemini API Key abuse, Denial-of-Wallet (unlimited LLM proxying). | `src/app/api/assistant`, `copilot`, `generate-mcq`, `generate-study-guide`, `summarize-pdf` |
| 2 | **Unauthenticated Push Broadcast** | **High** | Attacker can push spam/phishing messages to all registered devices. | `src/app/api/notifications/send`, `generate-and-send` |
| 3 | **Unauthenticated Seed Routes** | **High** | Anonymous triggers cause Firestore pollution, disk fill (DoS) on media folders. | `src/app/api/seed-files`, `seed-bee`, `seed-m2`, `seed-pyqs`, `seed-youtube` |
| 4 | **Unauthenticated WhatsApp Relay** | **Medium** | Open Twilio SMS/WhatsApp relay to arbitrary numbers on your budget. | `src/app/api/whatsapp` |
| 5 | **Hardcoded Firebase Fallback** | **Low/Med** | Exposes fallbacks in source code and masks missing environmental keys. | `src/database/config/firebase.js:8` |
| 6 | **Service-Account Key on Disk** | **Medium** | Exposure of service-account JSON allows full project takeover. | `src/database/config/firebaseAdmin.js` |
| 7 | **Path Traversal Risk in Downloads** | **Low/Med** | Missing separator check allows matching sibling folders; symlink trust issues. | `src/app/api/downloads/[...filepath]/route.js` |
| 8 | **Permissive Firestore Rules** | **Low/Med** | User profile collection is world-readable; anyone can create notification docs. | `firestore.rules` |
| 9 | **Stored-XSS in AI Rendering** | **Low** | Risk of HTML injection via Markdown if raw HTML parsing is enabled. | `react-markdown` usage |

---

## 🛠️ Security Demo Kit Usage

The [sutras-security-extracted](file:///Users/shrikantsaruk/Documents/college%20project/sutras-security-extracted) folder contains interactive Node.js scripts designed to safely probe these endpoints without causing damage.

### Setup
No external dependencies are required. Node 18+ includes native `fetch` support.

1. Start your local development server:
   ```bash
   npm run dev
   ```
2. Target the local instance:
   ```bash
   export DEMO_TARGET="http://localhost:3000"
   ```

### Running the Probes

* **Run all checks sequentially (Presentation Mode):**
  ```bash
  node sutras-security-extracted/run-all.js
  ```

* **Test Individual Scripts (Safe Probes by default):**
  * **AI Key Abuse:** Sends a single prompt to test if the key is exposed anonymously.
    ```bash
    node sutras-security-extracted/01-ai-keyabuse.js
    ```
  * **Push Notification:** Sends an empty request to prove access to the handler without firing a push.
    ```bash
    node sutras-security-extracted/02-notification-broadcast.js
    ```
  * **Seed Routes:** Safely probes a read-only endpoint representing the seed group config.
    ```bash
    node sutras-security-extracted/03-seed-routes.js
    ```
  * **WhatsApp Relay:** Probes Twilio integration without delivering real messages.
    ```bash
    node sutras-security-extracted/04-whatsapp-relay.js
    ```
  * **Rate Limiting:** Sequential burst of GET requests to prove the lack of throttling.
    ```bash
    node sutras-security-extracted/05-no-ratelimit.js
    ```

> [!WARNING]
> Running the scripts with the `--confirm` flag will trigger real database writes, Twilio messages, or push notifications. Only use this flag on local or isolated staging instances.

---

## 🛡️ Remediation Plan

To address these vulnerabilities, implement the following security layers:

### 1. Implement a Global Auth Helper
Create a utility function to verify Firebase tokens and roles:

```javascript
// src/shared/utils/requireUser.js
import { adminAuth } from '@/database/config/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function requireUser(req, { admin = false } = {}) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  try {
    const token = authHeader.split('Bearer ')[1];
    const user = await adminAuth.verifyIdToken(token);
    
    if (admin) {
      const userDoc = await adminDb.doc(`users/${user.uid}`).get();
      if (userDoc.data()?.isAdmin !== true) {
        return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
      }
    }
    return { user };
  } catch {
    return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) };
  }
}
```

### 2. Guard Route Handlers
Integrate the helper at the top of every protected API handler:

```javascript
// Example for src/app/api/assistant/route.js (AI Endpoint)
import { requireUser } from '@/shared/utils/requireUser';

export async function POST(req) {
  const { user, error } = await requireUser(req);
  if (error) return error;

  // Handler logic...
}
```

### 3. Remove Service Account Key from Disk
Instead of loading the credentials file using file-system paths:
1. Serialize the service account JSON into an environment variable (`FIREBASE_SERVICE_ACCOUNT`).
2. Initialize Firebase Admin dynamically:
   ```javascript
   admin.initializeApp({
     credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
   });
   ```

### 4. Secure the Download Path
Use realpath verification to prevent path traversal issues:
```javascript
import { realpath } from 'fs/promises';
import { sep } from 'path';

const real = await realpath(foundPath);
const base = await realpath(resolvedUploadsDir);
if (real !== base && !real.startsWith(base + sep)) {
  return new NextResponse('Forbidden', { status: 403 });
}
```
