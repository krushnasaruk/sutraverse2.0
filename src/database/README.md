# 🗄️ Sutras Database & Uploads Architecture Guide

This folder contains the Firestore database configuration, security rules, seed scripts, and migration files. This document explains the database integration, the cPanel deployment storage architecture, and the changes implemented when migrating from a single-folder storage system to a dual-folder storage system.

---

## 🚀 cPanel Uploads Storage Architecture

In a standard cPanel/VPS environment, the application code is rebuilt and redeployed frequently. If uploads are stored inside the application directory (e.g., in `public/uploads`), **re-zipping or redeploying code will completely wipe out existing user uploads**.

To prevent data loss, Sutras uses a **persistent external directory** located outside the application bundle.

### 📍 Uploads Path on cPanel
- **Default Location**: `~/user-uploads` (i.e., `/home/<your-cpanel-username>/user-uploads`)
- **Configurable Env Var**: You can control this folder path by setting the `UPLOADS_DIR` environment variable in your `.env.local` or Cloudlinux Node.js environment settings:
  ```env
  UPLOADS_DIR=/home/krushnasaruk.in/user-uploads
  ```
- **Fallback Resolution**: If `UPLOADS_DIR` is not set, the app dynamically locates the folder in this priority order:
  1. System user home directory: `~/user-uploads`
  2. Adjacent directory: `../user-uploads`
  3. App root directory: `./user-uploads`
  4. App public directory: `./public/uploads`

---

## 🔄 The 1-Folder to 2-Folder Migration

### 🤷 Why We Switched
* **Original System (1 Folder)**: Originally, all uploaded files (user notes, homework submissions, profile pictures, and offline PDF question papers) were dumped into a single `uploads` directory inside the project.
* **The Issues**:
  1. Redeployments wiped out all files.
  2. Offline exam papers (static, curated database) were mixed with dynamic student uploads.
  3. Pre-computed study guides and chatbot indexes could easily become corrupt or overwritten.
* **New System (2 Folders)**:
  We segregated the storage into two distinct, high-level directories:
  1. **`user-uploads`**: Houses dynamic, runtime user content (notes, submissions, avatars, and teacher-uploaded materials). This resides outside the app's code tree.
  2. **`pyqs`**: Houses the Previous Year Question paper PDF database. Resides under `/public/pyqs` in development and can also be served externally on cPanel under `/home/<username>/pyqs` or `/home/<username>/user-uploads/pyqs`.

---

## 📂 Subfolder Layout & Routing Rules

When a file is uploaded through the platform (`/api/upload`), it is dynamically sorted into the appropriate subdirectory under the `user-uploads` parent directory based on its `context`:

| Context Type | Targeted Folder | Description |
|---|---|---|
| `avatar` | `avatars/` | Student and teacher profile pictures |
| `teacher-material` | `materials/` | General reference study materials uploaded by faculty |
| `Notes` | `notes/` | Student-submitted lecture and unit notes |
| `PYQ` | `pyqs/` | Student-uploaded past exam question papers |
| `Assignment` | `assignments/` | Teacher-provided homework assignment sheets |
| `submission` | `submissions/` | Completed student assignment answer keys |

---

## 🛡️ Secure File Download Route (`/api/downloads/[...filepath]`)

To serve these external files securely, all file downloads pass through a server-side proxy route: `/api/downloads/[...filepath]`.

```
[Client Request] ──> [/api/downloads/...] ──> [Auth Verification] ──> [Security Check] ──> [Serve File Stream]
```

### 1. 🔒 Authentication & Rate Limiting
- Direct public access to uploads is blocked. Users must provide their Firebase ID token via the header (`Authorization: Bearer <token>`) or query parameter (`?token=<token>`).
- The user's email must be verified (`email_verified == true`).
- A strict rate limiter limits downloads to **20 requests per 10 seconds** per authenticated user. Users exceeding 60 requests are banned for 1 hour to prevent scraping.

### 2. ⚡ Search & Fallback Pipeline
When a download is requested (e.g., `/api/downloads/materials/lecture1.pdf`), the controller searches the following fallback paths in order:
1. `uploadsBase/materials/lecture1.pdf` (cPanel persistent folder)
2. `uploadsBase/user_uploads/materials/lecture1.pdf` (Underscore nesting variant)
3. `uploadsBase/user-uploads/materials/lecture1.pdf` (Dash nesting variant)
4. `public/materials/lecture1.pdf` (Static fallback)
5. `public/uploads/materials/lecture1.pdf` (Legacy fallback)
6. **Recursive Search**: If not found in the exact path, it runs a shallow recursive search (up to depth 3) in the main upload base folder.

### 3. 🛡️ Security Boundary Validation
To prevent directory traversal attacks (e.g. `../.env` or `../../etc/passwd`):
- All path inputs containing `..` or `~` are rejected immediately with a `400 Bad Request`.
- The canonical path of the matched file is resolved using `realpathSync`.
- The route checks that the resolved path starts with one of the allowed parent directory roots: `user-uploads`, `public/`, or `pyqs/`. Sibling directories and server configuration files are strictly inaccessible, returning a `403 Forbidden`.

### 4. 🌐 Dev Mode Proxy
In development mode, if a file is requested but doesn't exist locally, the server automatically proxies the download stream from the live production server (`https://sutraverse.co.in/api/downloads/...`) so developers don't have to copy gigabytes of media files locally.

---

## 📦 Deployment Packaging for cPanel

To support this separated structure, we have scripts under `deployment/cpanel/` that create separate zip archives:

1. **`cpanel-deploy.zip`** (via `pack-cpanel.js`):
   Contains the compiled standalone Next.js build. **Excludes** local `uploads` and `pyqs` directories so that existing files on cPanel are never overwritten during an application update.
2. **`cpanel-user-uploads.zip`** / **`cpanel-data.zip`** (via `pack-user-uploads.js` & `pack-data.js`):
   Contains the data folders (`pyqs/` and `uploads/`). This package only needs to be uploaded and extracted once in the home directory (`/home/<username>/user-uploads`) upon initial setup.
