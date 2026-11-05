# 🍽️ BTMeals — Hostel Mess Management System

[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.83.6-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.1-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-6.9-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)

**BTMeals** is a comprehensive, full-stack digital mess management system engineered for residential university hostels (customized for **B.T. Men's Hall**). It replaces traditional paper registers and manual token systems with a modern, role-governed mobile application and robust RESTful backend.

---

## 📑 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Mobile App Setup](#2-mobile-app-setup)
- [Database Models Overview](#-database-models-overview)
- [API Reference](#-api-reference)
- [Audit & Optimization Roadmap](#-audit--optimization-roadmap)
- [License](#-license)

---

## 🌟 Key Features

### 👤 Student Self-Service Portal
- **Meal On/Off Toggle**: Students can toggle daily meals (Morning / Lunch and Night / Dinner) with instant state persistence.
- **Dietary Preference**: Switch between Vegetarian (`VEG`) and Non-Vegetarian (`NON_VEG`) per meal slot.
- **Automated Cutoff Enforcement**:
  - **Morning Meal Cutoff**: `07:00 AM`
  - **Night Meal Cutoff**: `05:00 PM (17:00)`
  - *Toggles for past or locked slots are securely rejected both client-side and server-side.*
- **Personal Attendance History**: Transparent access to daily attendance records and meal count breakdowns.

### 🏛️ Committee & Administrative Governance
- **Maintenance Prefect**:
  - Reviews and approves/rejects new student registrations before app access is granted.
  - Controls hostel-wide holidays and global meal shutdowns during semester breaks.
- **Mess Prefect**:
  - Dynamically assigns 3 students as **Mess Managers** for each calendar month.
- **Student Managers**:
  - Real-time headcounts of eating students (Total, Veg, Non-Veg) for cooking staff preparation.
  - Full-featured weekly menu editor (separate Veg & Non-Veg dish listings).
  - Bulk daily attendance marking interface.
- **Super Admin**:
  - System-wide user directory inspection, emergency student suspension, and annual committee role assignments.

### 🎨 Premium UI/UX Design System
- Built with a tailored **Dark Gold Glassmorphism** visual aesthetic.
- Optimized for one-handed thumb reachability, smooth scroll interactions, and responsive feedback.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer (Expo / React Native)"]
        UI["Mobile App UI\n(Tabs, Admin Panels, Auth)"]
        Store["Zustand Store\n(Auth & Session)"]
        AxiosClient["Axios HTTP Client\n(JWT Interceptor & Auto-Refresh)"]
        UI --> Store
        Store --> AxiosClient
    end

    subgraph Server ["Backend Layer (Node.js & Express 5)"]
        Router["Express Router & Rate Limiter"]
        AuthMid["Auth Middleware\n(JWT Verification)"]
        RoleGuard["Role Guard Middleware\n(Super Admin, Prefect, Manager)"]
        Validators["Zod Schema Validation"]
        Services["Business Logic Services\n(MealService, AuthService, UserService, MenuService)"]

        AxiosClient -->|"HTTP / Bearer Token"| Router
        Router --> Validators
        Validators --> AuthMid
        AuthMid --> RoleGuard
        RoleGuard --> Services
    end

    subgraph Data ["Data Layer (PostgreSQL)"]
        PrismaClient["Prisma ORM Client"]
        PostgresDB[(PostgreSQL Database)]

        Services --> PrismaClient
        PrismaClient --> PostgresDB
    end
```

---

## 👥 Role-Based Access Control (RBAC)

The hostel governance is organized into tiered roles:

| Role | Key Permissions & Responsibilities | Validity |
| :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Full system control, role revocations, user suspensions, global settings | Permanent |
| **`MAINTENANCE_PREFECT`** | Review pending registrations, schedule hostel holidays, toggle global meal shutdown | Academic Year |
| **`MESS_PREFECT`** | Appoint 3 monthly managers, oversee mess operations | Academic Year |
| **`MANAGER`** | Update weekly menu, monitor live cooking counts, mark student attendance | 1 Month (Assigned) |
| **`STUDENT`** | Toggle meals before cutoff, choose Veg/Non-Veg, view daily menu & attendance | Permanent (While enrolled) |

---

## 💻 Tech Stack

### Mobile Application
- **Framework**: [Expo](https://expo.dev/) (SDK 55) with [React Native](https://reactnative.dev/) (0.83.6) & React 19
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing with typed routes)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Storage**: `expo-secure-store` (Encrypted keychain / keystore storage for JWT tokens)
- **Styling & Visuals**: `expo-linear-gradient`, `@expo/vector-icons`, Custom Glassmorphic Theme System

### Backend Server
- **Runtime**: [Node.js](https://nodejs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Web Framework**: [Express 5](https://expressjs.com/)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) with [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: Stateless JSON Web Tokens (Access + Refresh token pair) with `bcryptjs` (12 rounds)
- **Validation**: [Zod](https://zod.dev/) request body & query schema validation

---

## 📁 Project Directory Structure

```text
BTMeals/
├── assets/                    # App icons, splash screens, vector assets
├── docs/                      # Specification documents & architectural references
│   └── Project Requirements.docx
├── server/                    # Express backend & Prisma configuration
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL data models & enums
│   │   └── seed.ts            # Database seeder (Hostel, Slots, Super Admin)
│   ├── src/
│   │   ├── config/            # Database & environment configurations
│   │   ├── middleware/        # JWT auth, role guards, Zod validators, error handler
│   │   ├── routes/            # REST API endpoints (auth, meals, menu, attendance...)
│   │   ├── services/          # Core domain business logic
│   │   ├── utils/             # JWT, password hashing, role resolver
│   │   ├── app.ts             # Express application setup
│   │   └── index.ts           # Server bootstrap
│   ├── .env.example           # Backend environment template
│   └── package.json
├── src/                       # React Native Expo mobile source code
│   ├── api/                   # Axios API client & typed endpoints
│   ├── app/                   # Expo Router screens
│   │   ├── (auth)/            # Login, registration, pending approval
│   │   ├── (tabs)/            # Home, Meals, Menu, Profile
│   │   ├── admin/             # Super Admin management screens
│   │   ├── maintenance/       # Registration approvals & holiday controls
│   │   ├── manager/           # Menu editor, live meal counts, attendance
│   │   ├── mess-prefect/      # 3-manager monthly delegation interface
│   │   └── _layout.tsx        # Root navigation stack
│   ├── components/            # Reusable UI components (Button, Input, Card, Badge)
│   ├── constants/             # Design tokens, color palettes, API URLs
│   ├── stores/                # Zustand global authentication store
│   └── types/                 # Shared TypeScript interfaces
├── app.json                   # Expo application manifest
├── package.json               # Root dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** $\ge$ 18.0.0
- **npm** or **pnpm**
- **PostgreSQL** $\ge$ 14 (Running locally or hosted via Supabase / Neon / AWS RDS)
- **Expo Go** app installed on your physical mobile device (Android / iOS)

---

### 1. Backend Setup

1. **Navigate to the server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your PostgreSQL database URL and secure JWT secrets:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:password@localhost:5432/btmeals_db"
   JWT_ACCESS_SECRET="your-super-secret-access-key"
   JWT_REFRESH_SECRET="your-super-secret-refresh-key"
   JWT_ACCESS_EXPIRY="15m"
   JWT_REFRESH_EXPIRY="7d"
   ```

4. **Initialize Database & Seed Data**:
   ```bash
   # Push schema to database
   npx prisma db push

   # Seed default hostel, meal slots (Morning & Night), and Super Admin
   npm run db:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:3000`.*

---

### 2. Mobile App Setup

1. **Navigate to root directory**:
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Endpoint**:
   Open `src/constants/config.ts` and set `API_BASE_URL` to your machine's local network IP:
   ```typescript
   export const API_BASE_URL = __DEV__
     ? 'http://<YOUR_LOCAL_IP>:3000/api'
     : 'https://api.yourdomain.com/api';
   ```

4. **Start Expo**:
   ```bash
   npx expo start
   ```
   *Scan the QR code using the **Expo Go** app on Android or the Camera app on iOS.*

---

### 🔑 Default Credentials (Seed Data)

After running `npm run db:seed`, log in with:
- **Phone Number**: `9999999999`
- **Password**: `admin123`
- **Hostel Code**: `BTMH`

---

## 🗄️ Database Models Overview

- **`Hostel`**: Core hostel entity (`name`, `code: "BTMH"`).
- **`User`**: Account profiles (`name`, `phone`, `rollNumber`, `roomNumber`, `status: PENDING|APPROVED|REJECTED|SUSPENDED`).
- **`UserRole`**: Role delegation records (`role`, `year`, `month: 0-12`, `isActive`).
- **`MealSlot`**: Meal windows (`Morning` at 07:00 AM cutoff, `Night` at 05:00 PM cutoff).
- **`MealPreference`**: User meal choice (`isOn`, `preference: VEG|NON_VEG`, `effectiveFrom: Date`).
- **`WeeklyMenu`**: Recurring weekly menu (`dayOfWeek: 0-6`, `items: Json`, `menuType: VEG|NON_VEG`).
- **`MealAttendance`**: Student meal attendance logs (`wasPresent`, `preferenceUsed`, `date`).
- **`Holiday`**: Scheduled mess closures with automated meal suspension.
- **`GlobalMealToggle`**: Emergency mess suspension toggle.

---

## 🔌 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public | Register new student (`status: PENDING`) |
| `POST` | `/login` | Public | Phone & password login, returns JWT token pair |
| `POST` | `/refresh` | Public | Exchange refresh token for new access token |
| `PUT` | `/change-password` | Authenticated | Update user password |

### Meals (`/api/meals`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/status` | Student | 7-day meal status with lock indicators |
| `PUT` | `/preference` | Student | Toggle meal ON/OFF or Veg/Non-Veg from date onwards |
| `GET` | `/count/:date/:slotId` | Manager | Live headcount for specific date & meal slot |
| `GET` | `/students/:date/:slotId` | Manager | List students with meal ON |
| `GET` | `/today-stats` | Authenticated | Public transparency stats for today |

### Manager & Menu (`/api/menu`, `/api/attendance`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/menu/weekly` | Authenticated | Full 7-day weekly menu |
| `PUT` | `/menu/weekly` | Manager | Update recurring weekly dishes |
| `POST` | `/attendance/mark` | Manager | Bulk submit attendance records |
| `GET` | `/attendance/my-history` | Student | Personal meal attendance history |

### Administration (`/api/roles`, `/api/users`, `/api/holidays`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/users/pending` | Maintenance Prefect | View students awaiting registration approval |
| `PUT` | `/users/:id/approve`| Maintenance Prefect | Approve student account |
| `POST` | `/roles/assign-managers` | Mess Prefect | Assign 3 student managers for the month |
| `POST` | `/roles/assign` | Super Admin | Assign annual committee roles |
| `POST` | `/holidays` | Maintenance Prefect | Schedule holiday closure |

---

## 🛠️ Audit & Optimization Roadmap

As identified in our in-depth codebase audit, the following optimizations are scheduled for implementation:

1. **Timezone Cutoff Stabilization**: Enforce `Asia/Kolkata` (IST) timezone parsing on server cutoffs regardless of host VM timezone (UTC).
2. **SQL Aggregate Meal Counting**: Replace sequential $O(N)$ looping in `getMealCount` with a high-performance single SQL `GROUP BY` query.
3. **Middleware Role Sync**: Wire `roleResolver.ts` directly into `authenticate` middleware to enforce monthly manager expirations.
4. **Registration Auto-Refresh**: Store provisional registration session data so `/pending` can automatically refresh and navigate upon approval.
5. **React Query Integration**: Leverage `@tanstack/react-query` to cache weekly menus and user profiles, reducing redundant mobile network calls.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
