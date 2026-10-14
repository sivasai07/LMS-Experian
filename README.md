# Enterprise Leave Management System (LMS)

> A modern, full-stack, enterprise-grade Leave Management Solution built with **Laravel 12 (RESTful API)** and **React 19 (Vite SPA)**. Features automated working day calculations, custom half-day range options, public holiday exclusions, 5-day consecutive leave limits, role-based access control (RBAC), multi-tab session synchronization, dark mode, and interactive data visualization.

---

## 🚀 Key Features

### 🏢 Enterprise Leave Calculation Engine
- **Custom Half-Day Options**: Supports both single-day half-day requests and multi-day start/end half-day combinations (`First Half` / `Second Half` / `Full Day`).
- **Automated Working Days Calculation**: Excludes Saturday/Sunday weekends and company public holidays automatically.
- **Consecutive Leave Caps**: Enforces max 5 consecutive working days limit per request. Blocks submission if range contains 0 working days or > 5 consecutive days.
- **Accruals & Balance Deductions**: Automatically tracks allocated, used, and remaining leave balances per employee.

### 👥 Role-Based Access Control (RBAC)
- **Employee**: Apply for leave, track balances, view personal leave history, view policy rules, and interact with the company holiday calendar.
- **Manager**: Review pending team leave applications (Approve / Reject with remarks), manage direct reports, and view team calendar status.
- **HR Administrator**: Full organization-wide governance, employee account CRUD & deactivation/restoration, leave type configuration, public holiday calendar setup, department/grade/job title management, and company leave summary analytics.

### 🎨 Modern UI/UX Architecture
- **Interactive Data Visualization**: Custom SVG donut chart cards with hover legend sync for personal and company-wide leave summaries.
- **Theme Support**: Complete Light and Dark mode toggle utilizing CSS custom properties (`var(--color-surface)`, `var(--color-text-primary)`).
- **Cross-Tab Auth Sync**: Real-time session synchronization across sibling browser tabs via BroadcastChannel API with localStorage fallbacks.
- **Responsive Layout**: Collapsible sidebar, sticky navigation bar, and accessible modal dialogs.

---

## 🛠️ Technology Stack

### Backend Stack
- **Framework**: Laravel 12 (PHP 8.2+)
- **Authentication**: JWT (`php-open-source-saver/jwt-auth`)
- **Architecture**: Service Layer Pattern, Form Request Validation, Eloquent Resources
- **Database**: SQLite (Development/Testing) / MySQL 8.0+ (Production)
- **Testing**: PHPUnit Test Suite

### Frontend Stack
- **Framework**: React 19 + Vite 8
- **State Management**: Redux Toolkit & React Context API
- **Routing**: React Router DOM 6 (Lazy Loading & Code Splitting)
- **Styling**: Vanilla CSS Variables & Design System (Glassmorphic cards, dynamic tokens)
- **HTTP Client**: Axios with centralized Request/Response Interceptors
- **Notifications**: React Hot Toast

---

## 📁 Repository Structure

```
leave-management/
├── backend/                  # Laravel 12 RESTful API Application
│   ├── app/
│   │   ├── Http/Controllers/ # Thin API Controllers
│   │   ├── Models/           # Eloquent Models & Relations
│   │   ├── Services/         # Core Business Logic & Calculations
│   │   └── Http/Requests/    # Input Validation Enforcers
│   ├── database/             # Migrations, Factories & Database Seeders
│   └── tests/                # PHPUnit Automated Test Suite
└── frontend/                 # React 19 Vite Single Page Application (SPA)
    ├── src/
    │   ├── api/              # Axios API Service Modules
    │   ├── components/       # Reusable UI (Buttons, Cards, Modals, Badges)
    │   ├── contexts/         # Auth, Theme, and Notification Contexts
    │   ├── features/         # Feature-Based Modules (Auth, Leave, Employee, HR)
    │   ├── hooks/            # Custom Hooks (useAuth, useApi, useAuthSync)
    │   ├── routes/           # Protected & Role-Guarded Application Routes
    │   └── utils/            # Helper Utilities, Validators & Date Calculations
    └── README.md
```

---

## ⚙️ Quick Start & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0+ and `npm`
- **PHP**: v8.2+
- **Composer**: v2.0+

---

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install PHP dependencies
composer install

# Environment configuration
cp .env.example .env

# Generate JWT Secret Key
php artisan jwt:secret

# Run database migrations and seed default data
php artisan migrate:fresh --seed

# Start the Laravel development server
php artisan serve
```
> Backend API will start running at `http://localhost:8000`.

---

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
> Frontend SPA will start running at `http://localhost:5173`.

---

## 🔑 Default Credentials (Demo Accounts)

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **HR Admin** | `hr@leavemanagement.test` | `Password@123` | Full Admin & Governance |
| **Manager** | `d` | `Password@123` | Team Approvals & Direct Reports |
| **Employee** | `employee@company.com` | `Password123` | Personal Leave Applications |

---

## 🧪 Testing & Verification

### Backend PHPUnit Tests
```bash
cd backend
php artisan test
```

### Frontend Production Build & ESLint Check
```bash
cd frontend
npm run lint
npm run build
```

---

## 📄 License
This project is licensed under the **MIT License**.
