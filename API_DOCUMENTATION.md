# CampusFlow — Backend API Contract & Integration Guide

This document defines the official API contracts, database schemas, authentication flow, and token rotation rules between the **CampusFlow Express Backend (Node.js/TypeScript/PostgreSQL/Prisma)** and the **React (Vite) Frontend**.

---

## 1. Architecture & Protocol Overview

- **Base URL (Local Development)**: `http://localhost:5000/api`
- **Frontend Environment Variable**: `VITE_API_URL=http://localhost:5000/api`
- **Data Exchange Format**: `application/json`
- **Authentication Scheme**: Bearer JWT (`Authorization: Bearer <accessToken>`)
- **Token Strategy**: Short-lived Access Token + Rotating Refresh Token
- **Database**: PostgreSQL hosted on Neon via Prisma ORM

---

## 2. Authentication Flow & Token Lifecycle

```
[ Frontend: React / Axios ]                     [ Backend: Express / JWT / Prisma ]
            │                                                      │
            │── 1. POST /api/auth/login (email, password) ────────>│
            │                                                      │ Verifies credentials (argon2/bcrypt)
            │<── 2. 200 OK { user, accessToken, refreshToken } ────│ Generates JWTs + stores session
            │                                                      │
(Stores tokens in localStorage)                                    │
            │                                                      │
            │── 3. GET /api/users/profile (Bearer accessToken) ───>│
            │                                                      │ Validates JWT signature & expiry
            │<── 4. 200 OK { user profile data } ─────────────────│
            │                                                      │
      [AccessToken Expires]                                        │
            │                                                      │
            │── 5. Protected Request (Expired AccessToken) ───────>│
            │<── 6. 401 Unauthorized (jwt expired) ───────────────│
            │                                                      │
(Axios Interceptor catches 401)                                    │
            │── 7. POST /api/auth/refresh (refreshToken) ─────────>│
            │                                                      │ Validates & rotates refresh token
            │<── 8. 200 OK { accessToken, newRefreshToken } ──────│
(Replays original failed request)                                  │
            │                                                      │
            │── 9. POST /api/auth/logout (refreshToken) ──────────>│
            │                                                      │ Revokes refresh token in database
            │<── 10. 200 OK { success: true, message } ────────────│
(Clears local session)                                             │
```

---

## 3. Endpoints Specification

### 3.1 Health & Database Readiness Check

Check backend server uptime and database connectivity.

- **Method**: `GET`
- **Endpoint**: `/api/health`
- **Authentication**: None (Public)
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-03T14:45:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

---

### 3.2 User Registration

Register a new student account. Registration **always assigns the default `Member` role**. Public administrator registration is strictly disallowed.

- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "name": "Jordan Miller",
  "email": "jordan.miller@campusflow.edu",
  "password": "Password123!",
  "studentId": "STU-94021",
  "department": "Computer Science & Engineering",
  "phone": "+1 (555) 329-8812"
}
```

- **Validation Rules**:
  - `name`: string, min 3 chars, required.
  - `email`: valid university email format, required, unique.
  - `password`: string, min 6 chars, required.
  - `studentId`: string, required.
  - `department`: string, required.

- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "usr_99a81bc201",
      "name": "Jordan Miller",
      "email": "jordan.miller@campusflow.edu",
      "studentId": "STU-94021",
      "department": "Computer Science & Engineering",
      "phone": "+1 (555) 329-8812",
      "role": "Member",
      "roleKey": "member",
      "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256",
      "createdAt": "2026-10-03T14:45:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rf_77d20a8bf01ec2994e"
  }
}
```

- **Error Response `409 Conflict` (Duplicate Email)**:
```json
{
  "success": false,
  "error": "A user with this email address already exists"
}
```

- **Error Response `400 Bad Request` (Validation Failed)**:
```json
{
  "success": false,
  "error": "Password must be at least 6 characters long"
}
```

---

### 3.3 User Login

Authenticate existing user with email and password.

- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Authentication**: None (Public)
- **Request Body**:
```json
{
  "email": "superadmin@campusflow.edu",
  "password": "Password123!"
}
```

- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01a74e99f1",
      "name": "Dr. Eleanor Wright",
      "email": "superadmin@campusflow.edu",
      "studentId": "FAC-88019",
      "department": "University Administration",
      "role": "Super Admin",
      "roleKey": "super_admin",
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rf_921b74a80cefa0218b"
  }
}
```

- **Error Response `401 Unauthorized` (Invalid Credentials)**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

### 3.4 Get Current User Profile

Fetch the currently authenticated user's record.

- **Method**: `GET`
- **Endpoint**: `/api/auth/me` (or `/api/users/profile`)
- **Headers**: `Authorization: Bearer <accessToken>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr_01a74e99f1",
      "name": "Dr. Eleanor Wright",
      "email": "superadmin@campusflow.edu",
      "studentId": "FAC-88019",
      "department": "University Administration",
      "role": "Super Admin",
      "roleKey": "super_admin",
      "phone": "+1 (555) 329-8812",
      "bio": "Dean of Student Affairs and executive administrator.",
      "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256"
    }
  }
}
```

---

### 3.5 Update Profile

Update editable personal profile fields. **Note: Email is immutable and read-only.**

- **Method**: `PUT`
- **Endpoint**: `/api/users/profile`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "name": "Jordan Miller",
  "department": "Computer Science & Engineering",
  "phone": "+1 (555) 998-1122",
  "bio": "Junior CS major interested in distributed systems and open-source campus platforms.",
  "linkedin": "linkedin.com/in/jordanmiller",
  "github": "github.com/jordanmiller"
}
```

- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "usr_99a81bc201",
      "name": "Jordan Miller",
      "email": "jordan.miller@campusflow.edu",
      "department": "Computer Science & Engineering",
      "phone": "+1 (555) 998-1122",
      "bio": "Junior CS major interested in distributed systems and open-source campus platforms."
    }
  }
}
```

---

### 3.6 Refresh Access Token

Exchange a valid refresh token for a fresh access token and rotated refresh token.

- **Method**: `POST`
- **Endpoint**: `/api/auth/refresh`
- **Authentication**: None (Requires valid refreshToken in body or httpOnly cookie)
- **Request Body**:
```json
{
  "refreshToken": "rf_921b74a80cefa0218b"
}
```

- **Response `200 OK`**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rf_new_8820cbe01a9f"
}
```

- **Error Response `401 Unauthorized`**:
```json
{
  "success": false,
  "error": "Refresh token is invalid or has expired. Please sign in again."
}
```

---

### 3.7 Logout & Revocation

Revoke active refresh token session in database and terminate session.

- **Method**: `POST`
- **Endpoint**: `/api/auth/logout`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "refreshToken": "rf_921b74a80cefa0218b"
}
```

- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User logged out successfully and session revoked"
}
```

---

## 4. Role Hierarchy & Access Boundaries

| Role | Role Key | Permissions Scope | Default Landing Page |
|---|---|---|---|
| **Super Admin** | `super_admin` | Global system control, user accounts, roles matrix, financial audits | `/super-admin/dashboard` |
| **Admin** | `admin` | Organization management, events, members, store catalog, announcements | `/admin/dashboard` |
| **Treasurer** | `treasurer` | Treasury ledgers, income/expense records, payments, budget reports | `/treasurer/dashboard` |
| **Event Manager** | `event_manager` | Event scheduling, capacity tracking, QR ticket check-ins, volunteers | `/event-manager/dashboard` |
| **Volunteer** | `volunteer` | Assigned committee tasks, shifts schedule, service hours logging | `/volunteer/dashboard` |
| **Member** | `member` | Digital student membership card, event tickets pass, merchandise orders | `/member/dashboard` |

---

## 5. PostgreSQL / Prisma Schema Reference

The Neon PostgreSQL database uses the following core models:

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String
  studentId    String        @unique
  department   String?
  phone        String?
  bio          String?
  role         Role          @default(MEMBER)
  avatar       String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  revoked   Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

enum Role {
  SUPER_ADMIN
  ADMIN
  TREASURER
  EVENT_MANAGER
  VOLUNTEER
  MEMBER
}
```

---

## 6. Frontend Developer Handoff Checklist

- [x] **Centralized Axios Client**: Configured in [`Frontend/src/services/api.js`](Frontend/src/services/api.js) reading `VITE_API_URL`.
- [x] **JWT Token Injection**: Automatically embeds `Authorization: Bearer <token>` on all requests.
- [x] **Automatic 401 Refresh Rotation**: Detects expired access tokens, requests new token via `/api/auth/refresh`, and retries failed calls.
- [x] **Login Page (`/login`)**: Validates input, displays server error messages, supports loading state, stores JWT tokens, and redirects based on role.
- [x] **Registration Page (`/register` & `/signup`)**: Validates matching passwords, required fields, enforces standard `Member` role (no public admin selector), and displays duplicate email error banners.
- [x] **Profile Page (`/profile`)**: Displays user details, allows editing `name`, `department`, `phone`, `bio`, while strictly keeping `email` and `studentId` as **read-only**.
- [x] **Development Offline Fallback**: If the local Express server is not running during screen layout design, a fallback mode allows frontend developers to test without blocking.
