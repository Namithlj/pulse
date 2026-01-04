✅ STEP 1: Professional README.md (Submission Ready)

You can replace your current README with this.

🎥 Pulse – Video Upload, Sensitivity Processing & Streaming Application
📌 Overview

Pulse is a full-stack video management platform that enables users to upload videos, process them for content sensitivity, and stream them securely with real-time progress updates. The system supports multi-tenant isolation and role-based access control, making it suitable for enterprise-grade content moderation workflows.

🧱 Architecture Overview
Backend

Runtime: Node.js (LTS)

Framework: Express.js

Database: MongoDB (Mongoose ODM)

Authentication: JWT

File Uploads: Multer

Streaming: HTTP Range Requests

Real-Time Updates: Socket.IO

Frontend

Framework: React

Build Tool: Vite

State Management: React Hooks

Styling: CSS

Real-Time Client: Socket.IO Client

🚀 Features
Core Functionality

Secure user authentication (JWT)

Role-Based Access Control (Viewer, Editor, Admin)

Multi-tenant video isolation

Video upload with metadata handling

Automated sensitivity analysis (Safe / Flagged)

Real-time processing progress updates

Optimized video streaming using byte-range requests

Advanced Features

Video filtering by processing status

Real-time dashboard updates

Secure file storage

Modular, scalable architecture

👥 User Roles
Role	Permissions
Viewer	View assigned videos
Editor	Upload & manage own videos
Admin	Full system access
🔄 Processing Pipeline

Video upload validation

Secure storage with unique filenames

Sensitivity analysis simulation

Live progress updates via Socket.IO

Final classification (Safe / Flagged)

Video streaming readiness

🛠️ API Documentation
Authentication

POST /api/auth/register
POST /api/auth/login

Default Admin

For convenience during local development the application will seed a default admin user on first startup.

- Email: `n@gmail.com`
- Password: `n@0987`

You can override these values by setting the environment variables `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` before starting the backend.

The default admin can grant admin/editor/viewer permissions to other users using the admin API or the Admin UI.
API: `PUT /api/auth/users/:id/role` with JSON body `{ "role": "admin" }` (admin-only).

Note on Registration Security

Public registration no longer allows creating accounts with the `admin` role. Any attempt to register with `role: "admin"` will be ignored and the new account will default to `editor` unless the request is made by an authenticated admin (i.e., the request includes a valid admin JWT in the `Authorization` header). Use the Admin UI or the `PUT /api/auth/users/:id/role` endpoint to promote users to admin.

Video Management

POST /api/videos/upload – Upload video
GET /api/videos – List user videos
GET /api/videos/:id – Get video metadata
GET /api/videos/:id/stream – Stream video

## Running Locally (Development)

Prerequisites:

- Node.js (16+ LTS)
- MongoDB running locally (or a MongoDB URI)

Steps:

1. Start the backend

```bash
cd backend
npm install
# optionally set env vars: MONGO_URI, JWT_SECRET, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, PORT
npm run dev
```

2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

3. Open the app: Vite will display a local URL (usually http://localhost:5173)

Default admin credentials (created on first DB connect):

- Email: `n@gmail.com`
- Password: `n@0987`

Use the default admin to manage users (Admin → Users) and promote editors/viewers to admin.

## API Reference (summary)

- `POST /api/auth/register` — register (public registration cannot create `admin` role)
- `POST /api/auth/login` — login (returns JWT)
- `GET /api/auth/me` — authenticated user info (requires Authorization header)
- `GET /api/auth/users` — list users (admin-only)
- `PUT /api/auth/users/:id/role` — change user role (admin-only)
- `POST /api/videos/upload` — upload video (editor/admin)
- `GET /api/videos` — list videos (admin sees all, others see own)
- `GET /api/videos/:id/stream` — stream video (supports range requests; requires auth or ?token=)

## Security & Production Notes

- Do not use the default admin credentials in production. Override via `DEFAULT_ADMIN_EMAIL` and `DEFAULT_ADMIN_PASSWORD` env vars.
- Use HTTPS and set a strong `JWT_SECRET` in production.
- For production file storage, replace local `uploads/` with S3 or other object storage and serve using signed URLs or CDN.
- Replace the simulated sensitivity pipeline with FFmpeg/frame-analysis and add background job processing (e.g., Bull / Redis) for scalability.

## Testing the promote workflow (quick)

1. Register a normal user via the UI or API.
2. Login as default admin (`n@gmail.com` / `n@0987`) and open Admin → Users.
3. Change the user's role to `admin` using the dropdown; the backend will update their role.
4. When that user logs in, the Admin link and page will be available to them.

## GitHub: prepare and push repository

The repository includes a helper PowerShell script `scripts/push-to-github.ps1` to initialize a git repo, create a commit and push to a provided remote. This script is intended for local use on your machine and will require you to provide a remote URL (for example, a GitHub HTTPS or SSH remote). Review the script before running it.

Usage example (PowerShell):

```powershell
# from project root
.\scripts\push-to-github.ps1 -RemoteUrl 'git@github.com:youruser/yourrepo.git' -Branch 'main' -Message 'Initial commit'
```

The script will:

- initialize git if necessary
- add all files
- create a commit with the provided message
- add the remote (if not present)
- push to the specified branch

If you prefer manual steps, run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-remote-url>
git branch -M main
git push -u origin main
```

---

If you want, I can run the push script here (requires your GitHub remote URL and credentials) or guide you through creating the GitHub repo and pushing from your machine.
