# Frontend Architecture & Documentation — Leave Management System

A high-performance, responsive Single Page Application (SPA) built with **React 19**, **Vite 8**, **Redux Toolkit**, and **Vanilla CSS Variables**. Designed with modern UI aesthetic standards (glassmorphic surfaces, vibrant dark mode tokens, micro-interactions, and responsive grids).

---

## 🏗️ Architecture & Component Hierarchy

```
frontend/src/
├── api/                        # Modular HTTP Services
│   ├── axios.js                # Centralized Axios client & 401 interceptors
│   ├── authApi.js              # Session & profile endpoints
│   ├── leaveApi.js             # Applications, approvals, & balances
│   ├── userApi.js              # Employee CRUD & team endpoints
│   ├── departmentApi.js        # Department master endpoints
│   ├── holidayApi.js           # Company calendar endpoints
│   └── dashboardApi.js         # Role-based analytics endpoints
├── components/                 # Design System UI Components
│   ├── common/                 # Reusable Atoms & Molecules
│   │   ├── Avatar/             # User avatar with initial fallbacks
│   │   ├── Badge/              # Status indicators (Pending, Approved, Rejected)
│   │   ├── Button/             # Multi-variant action button with smart loaders
│   │   ├── Card/               # Surface card container
│   │   ├── Input/              # Form text inputs with prefix/suffix icons
│   │   ├── Modal/              # Accessible dialog modal with ESC listener
│   │   ├── Select/             # Dropdown select control
│   │   ├── Pagination/         # Accessible table pagination bar
│   │   ├── Search/             # Real-time search bar with clear button
│   │   ├── Skeleton/           # Shimmer loading placeholders
│   │   └── ThemeToggle/        # Light/Dark mode switcher
│   └── layout/                 # Layout Shell Components
│       ├── Navbar/             # Top app header & profile dropdown
│       ├── Sidebar/            # Collapsible RBAC navigation drawer
│       └── PageHeader/         # Page title & action toolbar header
├── constants/                  # Configuration & Enums
│   ├── apiEndpoints.js         # API route path constants
│   ├── roles.js                # RBAC role tokens (HR, Manager, Employee)
│   ├── routes.js               # Application client routes
│   └── leaveStatus.js          # Status badge color mappings
├── contexts/                   # Global Context Providers
│   ├── AuthContext.jsx         # Legacy authentication context
│   ├── NotificationContext.jsx # Toast notification dispatcher
│   └── ThemeContext.jsx        # Light/Dark theme switcher
├── features/                   # Domain Feature Modules
│   ├── auth/                   # Landing page, login modal, change password
│   ├── dashboard/              # Role-customized dashboards (Employee, Manager, HR)
│   ├── employee/               # Employee directory & team view
│   ├── holiday/                # Public holiday calendar management
│   ├── leave/                  # Apply leave form, leave history, approval tables
│   ├── master/                 # Master data pages (Departments, Grades, Job Titles, Types)
│   └── profile/                # Self-service employee profile portal
├── hooks/                      # Custom React Hooks
│   ├── useApi.js               # Async API state wrapper
│   ├── useAuth.js              # Redux auth thunks & state accessor
│   ├── useAuthSync.js          # Cross-tab session sync hook
│   ├── useClickOutside.js      # Popover outside click listener
│   ├── useDebounce.js          # Input query debouncer
│   ├── usePagination.js        # Table pagination hook
│   └── useTheme.js             # Theme context consumer hook
├── routes/                     # Guarded Routing Setup
│   ├── AppRoutes.jsx           # Lazy-loaded router configuration
│   ├── ProtectedRoute.jsx      # JWT authentication guard
│   └── RoleRoute.jsx           # RBAC permission guard
├── store/                      # Redux Toolkit Global State
│   ├── index.js                # Store configuration
│   └── slices/                 # Feature slices (auth, user, leave, dashboard)
└── utils/                      # Pure Helper Utilities
    ├── date.js                 # Intl date formatting & day differences
    ├── helpers.js              # Error extraction & string manipulation
    ├── permissions.js          # RBAC predicate functions
    ├── storage.js              # Web storage engine wrapper
    └── validators.js           # Form validation rules
```

---

## ⚖️ Working Days & Leave Engine Business Rules

The frontend implements an **Enterprise HR Leave Calculation Engine** (`ApplyLeaveForm.jsx`) that computes exact payable working days in real-time before submission:

1. **Date Range Validation**: Start date must be less than or equal to end date.
2. **Weekend Exclusion**: Saturdays (`getDay() === 6`) and Sundays (`getDay() === 0`) are automatically excluded from working days.
3. **Company Public Holidays Exclusion**: Dates matching configured company holidays are automatically deducted.
4. **Half-Day Calculations**:
   - **Single Day Request**:
     - `First Half` or `Second Half` selection = **0.5 Working Day**.
     - `Full Day` selection = **1.0 Working Day**.
   - **Multi-Day Request**:
     - `First Half` on Start Date (starts morning 9 AM) = **1.0 Day** for start date.
     - `Second Half` on Start Date (starts afternoon 1 PM) = **0.5 Day** for start date.
     - `First Half` on End Date (ends lunch 1 PM) = **0.5 Day** for end date.
     - `Second Half` on End Date (ends evening 5 PM) = **1.0 Day** for end date.
5. **Consecutive Leave Cap**:
   - Maximum consecutive working days per request is **5 days**. If requested days > 5, submission is blocked with an error.
   - If selected dates fall entirely on weekends/holidays (0 working days), submission is blocked.

---

## 🎨 Theme & Design System

The application utilizes a CSS Custom Properties design token system supporting **Light Mode** and **Dark Mode**:

```css
/* Light Mode Defaults */
:root {
  --color-primary: #1d6fa4;
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text-primary: #0f172a;
  --color-border: #e2e8f0;
}

/* Dark Mode Overrides */
[data-theme='dark'] {
  --color-primary: #38bdf8;
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text-primary: #f8fafc;
  --color-border: #334155;
}
```

---

## 🔄 Cross-Tab Authentication Sync

Session state is synchronized across open browser tabs via `useAuthSync` hook and `authSyncService`:
- Uses **`BroadcastChannel` API** for instant tab-to-tab event messaging.
- Falls back to window `storage` events for compatibility.
- Signing out in one tab instantly purges JWT tokens and ejects all other open tabs to the login page without infinite broadcast loops.

---

## ⚙️ Development Commands

```bash
# Install NPM dependencies
npm install

# Run Vite dev server with Hot Module Replacement (HMR)
npm run dev

# Run ESLint validation
npm run lint

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
