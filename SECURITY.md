# SutraVerse Security Specification & Attack Protection Guide

This document details the security model, vulnerability mitigation strategies, and the roadmap for scaling the SutraVerse platform securely to a multi-college architecture. 

It is divided into two parts:
1. **Implemented Security Updates**: Actions already taken in the codebase to secure the platform.
2. **Multi-College Scale & Threat Modeling**: Security strategies, checklists, and architectures prepared for scaling.

---

> [!IMPORTANT]
> **THE GOLDEN RULE OF SUTRAVERSE DEVELOPMENT**
> *Never trust anything coming from the frontend.*
> Every admin action, college access check, role assignment, and sensitive write must be validated on the backend, via Cloud Functions, or through locked-down Firestore Security Rules.

---

## Part 1: Implemented Security Updates

A series of security fixes have been completed to secure keys, restrict roles, prevent privilege escalation, lock down storage uploads, and prevent unauthorized client access.

### Summary of Completed Updates

| Security Component | Risk Mitigated | Action Taken | Target Location |
| :--- | :--- | :--- | :--- |
| **Firestore Security Rules** | Privilege escalation, unmoderated file approval, document hijacking. | Blocked self-promotion fields (`isAdmin`, `role`, `assignments`). Forced uploads to `status: 'pending'` with matching `uploaderUID`. Restructured post/comment permissions. | [firestore.rules](file:///Users/shrikantsaruk/Documents/college%20project/firestore.rules) |
| **Storage Security Rules** | Wildcard file deletion, config overrides, malware size abuse. | Restricted writes to specific subfolders (`/avatars`, `/materials`, `/submissions`), enforced size/mime constraints, and blocked fallback paths. | [storage.rules](file:///Users/shrikantsaruk/Documents/college%20project/storage.rules) |
| **Console Secrets Leak** | Exposure of Firebase API keys in browser logging. | Removed print statements emitting configuration keys. | [firebase.js](file:///Users/shrikantsaruk/Documents/college%20project/src/lib/firebase.js) |
| **Firebase App Check** | API abuse, request spamming, and direct database queries bypass. | Enabled App Check with Google ReCaptcha V3 provider for browser contexts. | [firebase.js](file:///Users/shrikantsaruk/Documents/college%20project/src/lib/firebase.js) |
| **Email Verification** | Spoofed/unverified registrations accessing rosters or dashboards. | Configured automated verification emails and verification route redirect guards. | [AuthContext.js](file:///Users/shrikantsaruk/Documents/college%20project/src/context/AuthContext.js) |
| **Maintenance Lock Screen** | Standard user access during database migrations or updates. | Added a `MaintenanceGuard` route check driven by live admin toggles. | [MaintenanceGuard.js](file:///Users/shrikantsaruk/Documents/college%20project/src/components/MaintenanceGuard/MaintenanceGuard.js) |
| **Edge-Level Rate Limiting** | DDoS, API brute-forcing, and brute-force logins. | Created an edge-isolate request-limit proxy returning `429 Too Many Requests`. | [proxy.js](file:///Users/shrikantsaruk/Documents/college%20project/src/proxy.js) |
| **Upload API Auth** | Unauthenticated file uploads, server disk exhaustion. | Enforced server-side verification of Firebase ID tokens via the Firebase Admin SDK. | [route.js](file:///Users/shrikantsaruk/Documents/college%20project/src/app/api/upload/route.js) |
| **Directory Traversal** | Arbitrary local file disclosure (`.env`, keys). | Implemented path resolution checks restricting access to public/uploads directory roots. | [route.js](file:///Users/shrikantsaruk/Documents/college%20project/src/app/api/downloads/%5B...filepath%5D/route.js) |


---

### Implementation Details

#### 1. Firestore Security Rules Hardening ([firestore.rules](file:///Users/shrikantsaruk/Documents/college%20project/firestore.rules))
- **Anti-Self-Promotion (Privilege Escalation Protection)**: Users are prevented from modifying their administrative status or roles during creation and updates.
  ```javascript
  // On creation:
  (!request.resource.data.keys().contains('isAdmin') || request.resource.data.isAdmin == false) &&
  (!request.resource.data.keys().contains('role') || request.resource.data.role == 'student')

  // On update:
  !request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin', 'role', 'assignments'])
  ```
- **Moderation Bypass Protection**: Standard users cannot approve their own uploads or submit items with status set to `'approved'`.
  ```javascript
  // On create:
  request.resource.data.status == 'pending' && request.resource.data.uploaderUID == request.auth.uid

  // On update:
  request.resource.data.status == resource.data.status &&
  !request.resource.data.diff(resource.data).affectedKeys().hasAny(['status', 'uploaderUID', 'downloads', 'rating', 'points'])
  ```
- **Granular Collection Lockdowns**:
  * `posts/{postId}` & `comments/{commentId}`: Creation requires standard authentication. Updates/deletions are locked to the author (`resource.data.authorId`) or an admin.
  * `news/{newsId}`, `subjects/{subjectId}`, `youtube/{videoId}`, `roster/{email}`: Changed write permission from any authenticated user to strictly `isAdmin()`.
- **Catch-All Block**: Catch-all writes are blocked (`allow write: if false;`), closing the door to unauthorized collection creations.

#### 2. Storage Security Rules Hardening ([storage.rules](file:///Users/shrikantsaruk/Documents/college%20project/storage.rules))
We replaced the insecure wildcard write rule with structured subfolder rules:
- **`avatars/{fileName}`**: Publicly readable. Writes restricted to authenticated users uploading image files (`image/*`) under 5MB.
- **`materials/{fileName}`**: Publicly readable. Writes restricted to authenticated uploads under 100MB.
- **`submissions/{fileName}`**: Reads restricted to authenticated users. Writes restricted to authenticated uploads under 50MB.
- **Catch-All Block**: Wildcard directories are blocked (`allow read, write: if false;`), preventing arbitrary uploads or file overrides.

#### 3. Console Secrets & App Check Integration
- Sliced Firebase API key printing removed from [firebase.js](file:///Users/shrikantsaruk/Documents/college%20project/src/lib/firebase.js).
- App Check initialized with Google ReCaptcha V3:
  ```javascript
  import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

  if (typeof window !== 'undefined') {
    try {
      const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (recaptchaKey) {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(recaptchaKey),
          isTokenAutoRefreshEnabled: true
        });
      }
    } catch (e) {
      console.warn("Failed to initialize App Check", e);
    }
  }
  ```

#### 4. Email Verification Flow & Access Guarding
- **Auto-Trigger**: Executes `sendEmailVerification` on Firebase signups.
- **Redirect Guard**: If user signs in via email/password and `emailVerified` is `false`, they are redirected to `/verify-email`.

#### 5. Administrative Maintenance Mode Guard
- Driven by `maintenanceMode` and `maintenanceMessage` variables stored in `settings/college`.
- The `MaintenanceGuard` wrapper intercepts layout rendering, forcing non-admins to a locked down page, while allowing administrators to bypass the lock screen.

#### 6. Edge-Level Rate Limiting
- Evaluated in [proxy.js](file:///Users/shrikantsaruk/Documents/college%20project/src/proxy.js) to restrict clients to 500 requests per 1-minute window per IP for API and auth endpoints, returning standard retry headers.

#### 7. Upload API Authentication Guard ([route.js](file:///Users/shrikantsaruk/Documents/college%20project/src/app/api/upload/route.js))
- Enforced server-side validation using the Firebase Admin SDK. All file upload POST requests must contain a valid Firebase `Authorization: Bearer <idToken>` header. This blocks automated crawlers or non-authenticated accounts from loading arbitrary binary assets onto the cPanel host disk.

#### 8. Secure Downloads & Directory Traversal Protection ([route.js](file:///Users/shrikantsaruk/Documents/college%20project/src/app/api/downloads/%5B...filepath%5D/route.js))
- Added rigorous path resolution checks. The system determines the absolute location of requested files and explicitly verifies they belong to permitted root directory scopes (uploads directory, public folders, or active `public_html` static assets). Files containing sensitive patterns like `.env`, database configuration values, or `node_modules` folders are blocked with a `403 Forbidden` response.


---

## Part 2: Multi-College Scale & Threat Modeling

As SutraVerse scales from a single campus to a multi-college platform, the attack surface expands. Below is the threat model and the engineering specifications required to protect data integrity, privacy, and system availability.

### 1. Critical Risks & Protection Strategies

#### 🛡️ Privilege Escalation
* **Threat**: A student attempts to elevate their role to `teacher` or `admin` by modifying request parameters, manipulating local storage, or passing arbitrary payloads to API endpoints.
* **Mitigation**:
  - **Firebase Custom Claims**: Roles (`admin`, `teacher`, `student`) must be stored directly in Firebase Auth Custom Claims rather than regular Firestore documents alone. Custom Claims are cryptographically signed by Firebase and cannot be edited by the client.
  - **Server-Side Validation**: All admin API routes must decode the ID token and verify claims on the server-side before execution.

#### 🏢 Broken Access Control (Cross-College Data Leakage)
* **Threat**: An authenticated student or teacher from College A attempts to read or write notes, PYQs, assignments, or user profiles belonging to College B by modifying database queries or document references.
* **Mitigation**:
  - **College Isolation Layer**: Every document in the database must include a `collegeId` attribute.
  - **Query-Level Validation**: Database rules must mandate that the user's `collegeId` (retrieved from their authenticated user profile or Custom Claims) matches the `collegeId` of the target document:
    ```javascript
    allow read, write: if request.auth != null && resource.data.collegeId == request.auth.token.collegeId;
    ```

#### 🔗 Insecure Direct Object Reference (IDOR)
* **Threat**: An attacker alters document IDs, file IDs, or user IDs in API endpoints (e.g. `/api/downloads/[id]` or `/api/users/[id]`) to read, edit, or delete records belonging to other users.
* **Mitigation**:
  - **No Frontend Trust**: Never trust the user identity or document ownership sent in the body or params of the request.
  - **Rule Enforcement**: Always perform resource validation (e.g. `resource.data.uploaderUID == request.auth.uid`) to ensure users can only modify their own uploads.

#### 🔐 Account Takeover (ATO)
* **Threat**: Attackers use credential stuffing, password reuse databases, or phishing campaigns to gain access to admin or faculty accounts.
* **Mitigation**:
  - **Enforce Multi-Factor Authentication (MFA)**: Mandate MFA (SMS/TOTP) for all administrative and faculty accounts.
  - **Login Monitoring**: Log anomalous logins (e.g., rapid geographic shifts, new device footprints) and automatically trigger security notifications.

#### ☣️ Malicious File Uploads
* **Threat**: Users upload malware, executable scripts (e.g. `.js`, `.sh`), or corrupted files disguised as PDF study guides or assignment sheets.
* **Mitigation**:
  - **Upload Verification**: Restrict allowed mime-types strictly to approved formats (e.g., `application/pdf`, `image/png`, `image/jpeg`).
  - **Size Boundaries**: Restrict file uploads to safe bounds (e.g., maximum 20MB).
  - **Virus Scanning**: Implement a server-side trigger (e.g. using ClamAV or Cloud Storage scanning integrations) to scan files for viruses before they are marked as approved and accessible.

---

### 2. Web Application & Operations Security

#### Web Application Risks
* **Cross-Site Scripting (XSS)**: Ensure all user input is sanitized before rendering in the browser (e.g. comments, notices). Enforce strict Content Security Policy (CSP) headers restricting script source domains.
* **Cross-Site Request Forgery (CSRF)**: Protect state-changing API endpoints by validating origin/referrer headers and using secure, HTTP-only cookies with `SameSite=Strict`.
* **API Abuse**: Impose rate limits and quotas on all API endpoints using client IP and Auth ID tokens. App Check must be strictly enforced on all Firestore and Storage access.
* **Bot Registration Attacks**: Prevent automated bots from creating thousands of dummy accounts by using reCAPTCHA v3 during registration.
* **Data Scraping**: Prevent scrapers from bulk-downloading the notes directory through pagination limits and CDN-level rate limits.

#### Firebase-Specific Risks
* **Firestore & Storage Rules**: Maintain a regular automated rules audit to prevent wildcard access (`allow read, write: if true`).
* **Leaked Service Account Keys**: Never check service account JSON files into git repositories. Store credentials as environment variables in the hosting provider.
* **Unprotected Cloud Functions**: Ensure all Cloud Functions validate request authentication tokens and check user roles before executing.

#### Operational Risks
* **Accidental Admin Deletion**: Implement soft-deletes (`deletedAt` timestamps) rather than hard database document removals for critical collections.
* **Database Corruption & Backup Failure**: Schedule automated daily Firestore backups to a separate Google Cloud Storage bucket with lifecycle retention rules.
* **Insider Abuse**: Implement dual-authorization (multi-sig approvals) for high-impact actions like bulk user deletions or changing site-wide branding configurations.
* **Dependency Vulnerabilities**: Run `npm audit` on a scheduled pipeline to check for vulnerabilities in third-party libraries.

---

## 3. Scaling Security Roadmap

Prior to scaling SutraVerse across multiple campuses, the following security measures must be implemented:

- [ ] **Multi-Factor Authentication (MFA)**: Enable and enforce MFA for all administrative and moderator roles.
- [ ] **Firebase Custom Claims**: Migrate role management to claims (`admin: true`, `teacher: true`, `student: true`).
- [ ] **CollegeId Isolation Layer**: Add a `collegeId` claim to user tokens and query filters.
- [ ] **Admin Audit Logging**: Record every administrative action (branding edits, files approved/deleted, role updates) to a secure `/audit_logs` collection.
- [ ] **Automated Firestore Backups**: Configure automated daily backups using Cloud Scheduler and Cloud Functions.
- [ ] **Malware Scan Trigger**: Connect Firebase Storage triggers to a serverless virus scanner (e.g., Cloud Run executing ClamAV).
- [ ] **Content Security Policy (CSP)**: Configure CSP headers inside Next.js config to restrict script execution, inline styles, and frame injection.
- [ ] **Security Monitoring Dashboard**: Build a log analysis interface using Google Cloud Logging and Error Reporting.
- [ ] **Move Sensitive Writes to Cloud Functions**: Migrate backend administrative actions from direct Firestore client writes to secure HTTPS Cloud Functions.
- [ ] **OWASP Top 10 Penetration Testing**: Conduct comprehensive manual and automated vulnerability scans against the production deployment.
