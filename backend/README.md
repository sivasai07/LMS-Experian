# Backend Architecture & API Specification — Leave Management System

A production-ready, RESTful API backend built with **Laravel 12**, **PHP 8.2+**, and **JWT Stateless Authentication**. Engineered using the **Service-Repository Pattern** to maintain strict separation of concerns, transactional integrity, and complete test coverage.

---

## 🏗️ Architectural Patterns

The API follows a strict multi-layered architecture:

```
HTTP Request
    │
    ▼
[Routes (routes/api.php)] ──► Enforces Rate Limits & CORS
    │
    ▼
[Middleware Layer] ────────► JWT Auth (`auth:api`) & RBAC (`role:HR`, `role:Manager`)
    │
    ▼
[Form Request Layer] ──────► Input Validation & Sanitization
    │
    ▼
[Controller Layer] ────────► Thin Request Dispatcher (No business logic)
    │
    ▼
[Service Layer] ───────────► Core Domain Logic, Accruals & DB Transactions
    │
    ▼
[Eloquent Models] ─────────► Database Relational Mapping
    │
    ▼
[API Resource Layer] ──────► Standardized JSON Response Formatting
```

### Architectural Guarantees
- **Strict Types**: `declare(strict_types=1);` enforced across all files.
- **Thin Controllers**: Controllers validate inputs via Form Requests, delegate business logic to dedicated Service classes, and return Eloquent API Resources.
- **Transactional Safety**: All state-changing multi-model operations (leave balance deductions, user creation with balances) are executed inside `DB::transaction()` blocks.

---

## 📂 Directory Structure

```
backend/
├── app/
│   ├── Enums/                     # PHP 8 Enums (LeaveStatus, Gender, BloodGroup, UserStatus)
│   ├── Exceptions/                # Custom Domain Exceptions & Global Exception Handler
│   ├── Http/
│   │   ├── Controllers/API/       # Thin API Controllers grouped by feature
│   │   │   ├── Auth/              # AuthController (login, logout, refresh, profile)
│   │   │   ├── Leave/             # Dashboard, LeaveRequest, Balance, Type, Holiday
│   │   │   ├── Master/            # Department, Grade, JobTitle
│   │   │   └── User/              # User, Profile, Team
│   │   ├── Middleware/            # RoleMiddleware (RBAC enforcement)
│   │   ├── Requests/              # Form Request Validation classes
│   │   └── Resources/             # API Resources for JSON serialization
│   ├── Models/                    # Eloquent Models (User, LeaveRequest, LeaveBalance, etc.)
│   └── Services/                  # Service Layer (AuthService, LeaveService, BalanceService)
├── database/
│   ├── factories/                 # Model factories for automated testing
│   ├── seeders/                   # Initial Database Seeders (Roles, Admin, Leave Types)
│   └── migrations/                # Database Schema Migrations
├── routes/
│   └── api.php                    # Endpoints definition with version prefix (/api/v1)
└── tests/
    ├── Feature/                   # PHPUnit Integration Feature Tests
    └── Unit/                      # Unit Tests for Services & Logic
```

---

## 🔌 API Endpoint Reference Table

All endpoints are prefixed with `/api/v1` and accept/return `application/json`.

### 1. Authentication Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate user credentials & receive JWT token |
| `POST` | `/auth/logout` | Authenticated | Invalidate current JWT session |
| `GET` | `/auth/me` | Authenticated | Fetch active user identity payload |
| `POST` | `/auth/refresh` | Authenticated | Issue refreshed JWT bearer token |
| `POST` | `/auth/change-password` | Authenticated | Update user password |

### 2. Dashboard & Analytics Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/dashboard/employee` | Employee | Personal balance statistics, recent requests & upcoming holidays |
| `GET` | `/dashboard/manager` | Manager | Team leave summary, pending approvals & team on leave today |
| `GET` | `/dashboard/hr` | HR Admin | Organization metrics, department breakdown & company leave donut |

### 3. Leave Requests Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/leave-requests` | Employee | Submit new leave application |
| `GET` | `/leave-requests/my` | Employee | Fetch personal leave request history |
| `GET` | `/leave-requests/pending` | Manager / HR | Fetch pending requests assigned for approval |
| `GET` | `/leave-requests` | HR Admin | Fetch organization-wide leave request audit log |
| `GET` | `/leave-requests/{id}` | Authenticated | View single leave request details |
| `POST` | `/leave-requests/{id}/approve` | Manager / HR | Approve pending leave request |
| `POST` | `/leave-requests/{id}/reject` | Manager / HR | Reject pending leave request |
| `POST` | `/leave-requests/{id}/cancel` | Employee | Cancel pending/approved request & restore balance |

### 4. Leave Balances Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/leave-balances/my` | Employee | Fetch current personal leave balance allocations |
| `GET` | `/users/{id}/leave-balances` | Manager / HR | Fetch specific employee leave balances |

### 5. Master Data Endpoints
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET/POST` | `/departments` | HR Admin | Department listing & creation |
| `PUT/DELETE` | `/departments/{id}` | HR Admin | Update or delete department |
| `GET/POST` | `/grades` | HR Admin | Grade level listing & creation |
| `GET/POST` | `/job-titles` | HR Admin | Job designation listing & creation |
| `GET/POST` | `/leave-types` | HR Admin | Leave category listing & creation |
| `GET/POST` | `/holidays` | HR Admin | Public holiday calendar management |

---

## 🛢️ Database Relational Schema

- **`users`**: Stores employee profiles, department/grade/job_title IDs, manager_id self-relation, role_id, and status.
- **`roles`**: Defines RBAC roles (`HR`, `Manager`, `Employee`).
- **`leave_types`**: Configured leave categories (Annual, Sick, Casual, Unpaid).
- **`leave_balances`**: Tracks `allocated`, `used`, and `balance` days per user and year.
- **`leave_requests`**: Stores application date ranges, calculated `working_days`, half-day flags, status (`Pending`, `Approved`, `Rejected`, `Cancelled`), and manager remarks.
- **`holidays`**: Stores company public holiday dates and descriptions.

---

## 🧪 Automated Testing

The backend includes a comprehensive PHPUnit test suite validating all controllers, services, policies, and calculation rules:

```bash
# Execute full PHPUnit test suite
php artisan test

# Execute specific feature test class
php artisan test --filter=LeaveRequestTest

# Execute with test coverage summary
php artisan test --coverage
```
