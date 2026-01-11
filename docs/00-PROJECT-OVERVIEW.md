# PROJECT OVERVIEW - RENTAL QUOTATION SYSTEM

## TABLE OF CONTENTS
```
00-PROJECT-OVERVIEW.md      <- You are here
01-AUTHENTICATION-2FA.md    <- Authentication & Two-Factor Authentication
02-USER-MANAGEMENT.md       <- User CRUD, Password Setup, User Lifecycle
03-ROLES-PERMISSIONS.md     <- RBAC System, Role-Permission Matrix
04-PRODUCTS.md              <- Product Catalog Management
05-CLIENTS.md               <- Client Management
06-ACTIVITY-LOGS.md         <- System Audit Trail
07-DASHBOARD.md             <- Metrics, KPIs, Analytics
08-PROFILE.md               <- User Profile Management
09-UI-COMPONENTS.md         <- Shared UI Components & Layouts
10-ERROR-HANDLING.md        <- Exception Handling & Error Pages
11-EMAIL-SYSTEM.md          <- Email Templates & Notifications
```

---

## 1. SYSTEM OVERVIEW

### 1.1 Project Description
The Rental Quotation System (RQS) is a comprehensive web application designed for managing rental equipment quotations, client relationships, product catalogs, and sales operations. The system provides role-based access control, two-factor authentication, activity logging, and a modern responsive user interface.

### 1.2 Technology Stack

#### Backend Technologies
```yaml
Framework: Laravel 8.75
PHP Version: ^7.3 | ^7.4 | ^8.0
Database: MySQL (InnoDB)
Session Driver: File/Database
Cache Driver: File/Redis
Queue Driver: Sync/Database
```

#### Backend Packages (composer.json)
```yaml
Core:
  - laravel/framework: ^8.75
  - laravel/sanctum: ^2.8
  - laravel/tinker: ^2.5
  - laravel/breeze: ^1.10 (dev)

Inertia & Frontend:
  - inertiajs/inertia-laravel: ^1.3
  - tightenco/ziggy: ^1.0

File Storage:
  - league/flysystem-aws-s3-v3: ^1.0

PDF Generation:
  - barryvdh/laravel-dompdf: 2.0

Excel Import/Export:
  - maatwebsite/excel: ^3.1

Database:
  - doctrine/dbal: 2.13

HTTP Client:
  - guzzlehttp/guzzle: ^7.0.1

CORS:
  - fruitcake/laravel-cors: ^2.0
```

#### Frontend Technologies
```yaml
JavaScript Framework: React 17.0.2
Build Tool: Laravel Mix 6.0.6
CSS Framework: Tailwind CSS 3.3.0
State Management: Inertia.js React 2.0.14
```

#### Frontend Packages (package.json)
```yaml
Core:
  - react: ^17.0.2
  - react-dom: ^17.0.2
  - @inertiajs/react: ^2.0.14

UI Components:
  - @headlessui/react: ^1.7.19
  - @heroicons/react: ^2.2.0
  - @tailwindcss/forms: ^0.5.2

Rich Text Editor:
  - react-quill: ^2.0.0

Select Component:
  - react-select: ^5.10.2

Date Utilities:
  - date-fns: ^4.1.0
  - date-fns-tz: ^3.2.0

Build Tools:
  - tailwindcss: ^3.3.0
  - postcss: ^8.4.6
  - autoprefixer: ^10.4.2
  - laravel-mix: ^6.0.6
  - sass: ^1.58.0

Utilities:
  - axios: ^0.21.4
  - lodash: ^4.17.21
```

---

## 2. ARCHITECTURE OVERVIEW

### 2.1 Application Architecture Pattern
```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  React Components (Inertia.js Pages)                    │    │
│  │  - Pages: Auth, Products, Clients, Dashboard, etc.      │    │
│  │  - Components: Forms, Tables, Modals, Buttons           │    │
│  │  - Layouts: Guest, Authenticated, Module-specific       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE LAYER                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - HandleInertiaRequests (shares auth data)             │    │
│  │  - CheckPermission (RBAC enforcement)                   │    │
│  │  - CheckRole (Role verification)                        │    │
│  │  - Authenticate (Session validation)                    │    │
│  │  - VerifyCsrfToken (CSRF protection)                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                             │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - LoginController (Authentication + 2FA)               │    │
│  │  - UserManagementController (User CRUD)                 │    │
│  │  - RoleController / PermissionController (RBAC)         │    │
│  │  - ProductController / ClientsController (Business)     │    │
│  │  - DashboardController (Analytics)                      │    │
│  │  - ActivityLogController (Audit)                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  - ActivityLogService (Centralized logging)             │    │
│  │  - Helper Functions (activity_log, activity_log_with_   │    │
│  │    changes)                                             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MODEL LAYER                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Eloquent Models with:                                  │    │
│  │  - Relationships (belongsTo, hasMany, belongsToMany)    │    │
│  │  - Observers (UserObserver, ProductObserver, etc.)      │    │
│  │  - Scopes, Accessors, Mutators                          │    │
│  │  - SoftDeletes trait                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  MySQL/MariaDB with InnoDB Engine                       │    │
│  │  - Foreign Key Constraints                              │    │
│  │  - Indexes for Performance                              │    │
│  │  - Pivot Tables for Many-to-Many                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Directory Structure
```
rental-quote-system/
├── app/
│   ├── Console/                    # Artisan commands
│   ├── Exceptions/                 # Exception handlers
│   ├── Helpers/
│   │   └── activity_logger.php     # Global logging helper
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/               # Authentication controllers
│   │   │   ├── ActivityLogController.php
│   │   │   ├── ClientsController.php
│   │   │   ├── DashboardController.php
│   │   │   ├── PermissionController.php
│   │   │   ├── ProductController.php
│   │   │   ├── ProfileController.php
│   │   │   ├── RoleController.php
│   │   │   └── UserManagementController.php
│   │   ├── Middleware/
│   │   │   ├── Authenticate.php
│   │   │   ├── CheckPermission.php
│   │   │   ├── CheckRole.php
│   │   │   ├── HandleInertiaRequests.php
│   │   │   └── ShareAuthData.php
│   │   └── Requests/
│   │       └── Auth/
│   │           └── LoginRequest.php
│   ├── Mail/
│   │   ├── PasswordSetupMail.php
│   │   └── TwoFactorCodeMail.php
│   ├── Models/
│   │   ├── ActivityLog.php
│   │   ├── Client.php
│   │   ├── Permission.php
│   │   ├── Product.php
│   │   ├── Profile.php
│   │   ├── Role.php
│   │   ├── TwoFactorCode.php
│   │   └── User.php
│   ├── Observers/
│   │   ├── ClientObserver.php
│   │   ├── ProductObserver.php
│   │   ├── ProfileObserver.php
│   │   └── UserObserver.php
│   ├── Providers/
│   │   └── AppServiceProvider.php  # Observer registration
│   └── Services/
│       └── ActivityLogService.php
├── config/                         # Configuration files
├── database/
│   ├── migrations/                 # Database migrations
│   └── seeders/
│       └── RolesAndPermissionsSeeder.php
├── resources/
│   ├── js/
│   │   ├── Components/             # Reusable React components
│   │   ├── Layouts/                # Page layouts
│   │   └── Pages/                  # Inertia page components
│   │       ├── Auth/
│   │       ├── Products/
│   │       ├── clients/
│   │       ├── Roles/
│   │       ├── Permissions/
│   │       ├── ActivityLogs/
│   │       └── errors/
│   └── views/
│       ├── app.blade.php           # Main blade template
│       └── emails/                 # Email templates
├── routes/
│   ├── web.php                     # Web routes
│   └── auth.php                    # Auth routes
└── storage/                        # File storage
```

---

## 3. DATABASE SCHEMA OVERVIEW

### 3.1 Entity Relationship Diagram (Text)
```
┌─────────────┐       ┌─────────────┐       ┌─────────────────┐
│    users    │──────▶│    roles    │◀─────▶│   permissions   │
└─────────────┘       └─────────────┘       └─────────────────┘
      │                     │                       │
      │                     │                       │
      ▼                     ▼                       │
┌─────────────┐       ┌─────────────────┐          │
│  profiles   │       │ role_permission │◀─────────┘
└─────────────┘       │   (pivot)       │
      │               └─────────────────┘
      │
      ▼
┌─────────────────┐
│ two_factor_codes│
└─────────────────┘

┌─────────────┐       ┌─────────────┐
│  products   │       │   clients   │
└─────────────┘       └─────────────┘
      │                     │
      └──────────┬──────────┘
                 │
                 ▼
         ┌─────────────────┐
         │  activity_logs  │
         └─────────────────┘
```

### 3.2 Core Tables Summary
| Table | Description | Key Relationships |
|-------|-------------|-------------------|
| users | System users | belongs_to: roles; has_one: profiles |
| roles | User roles (SuperAdmin, Admin, Sales, Operations) | has_many: users; belongs_to_many: permissions |
| permissions | System permissions | belongs_to_many: roles |
| role_permission | Pivot table for role-permission | - |
| profiles | User profile data | belongs_to: users |
| two_factor_codes | 2FA verification codes | belongs_to: users |
| products | Product catalog | - |
| clients | Client records | - |
| activity_logs | Audit trail | polymorphic: subject, causer |

---

## 4. SECURITY ARCHITECTURE

### 4.1 Authentication Flow
```
[User] → [Login Form] → [LoginController]
                              │
                              ▼
                    [Validate Credentials]
                              │
                    ┌─────────┴─────────┐
                    │                   │
              [Invalid]            [Valid]
                    │                   │
                    ▼                   ▼
              [Error Response]   [Generate 2FA Code]
                                       │
                                       ▼
                              [Send Email with OTP]
                                       │
                                       ▼
                              [2FA Verification Page]
                                       │
                                       ▼
                              [Validate OTP]
                                       │
                              ┌────────┴────────┐
                              │                 │
                        [Invalid]          [Valid]
                              │                 │
                              ▼                 ▼
                        [Error]        [Create Session]
                                             │
                                             ▼
                                     [Redirect to Dashboard]
```

### 4.2 Authorization Model (RBAC)
```
┌─────────────────────────────────────────────────────────────┐
│                     PERMISSION GROUPS                        │
├─────────────────────────────────────────────────────────────┤
│ Dashboard: dashboard.view, dashboard.admin, dashboard.sales │
│ Users: users.view, users.create, users.edit, users.delete   │
│ Roles: roles.view, roles.create, roles.edit, roles.delete   │
│ Products: products.view, products.create, products.edit...  │
│ Clients: clients.view, clients.create, clients.edit...      │
│ Activity: activity.view                                      │
│ Profile: profile.view, profile.edit                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        ROLES                                 │
├─────────────────────────────────────────────────────────────┤
│ SuperAdmin: ALL permissions (bypasses all checks)           │
│ Admin: All except user/role management                      │
│ Sales: Products, Clients, Quotations, Prospecting           │
│ Operations: Quotations (view, create, edit), Products (view)│
└─────────────────────────────────────────────────────────────┘
```

---

## 5. REQUEST LIFECYCLE

### 5.1 Inertia.js Request Flow
```
[Browser Request]
       │
       ▼
[Laravel Router] ──▶ [Middleware Stack]
       │                    │
       │              ┌─────┴─────┐
       │              │           │
       │       [VerifyCsrf] [Authenticate]
       │              │           │
       │              └─────┬─────┘
       │                    │
       ▼                    ▼
[Controller Action] ◀── [CheckPermission]
       │
       ▼
[Business Logic]
       │
       ▼
[Inertia::render('Page', $props)]
       │
       ▼
[HandleInertiaRequests Middleware]
       │
       ├──▶ Shares: auth.user, auth.role, auth.permissions
       ├──▶ Shares: flash.success, flash.error
       └──▶ Shares: ziggy (route helper)
       │
       ▼
[JSON Response with Page Component + Props]
       │
       ▼
[React Renders Page Component]
```

---

## 6. CROSS-MODULE INTERACTIONS

### 6.1 User → Role → Permission Flow
```
User Creation:
[UserManagementController::store]
       │
       ├──▶ Create User record
       ├──▶ Assign role_id (foreign key)
       ├──▶ Generate password_setup_token
       ├──▶ Send PasswordSetupMail
       └──▶ Log activity (UserObserver::created)

Permission Check:
[CheckPermission Middleware]
       │
       ├──▶ Load user.role relationship
       ├──▶ Check isSuperAdmin() → bypass all
       └──▶ Check hasPermission($slug)
                    │
                    ▼
            [Role::permissions relationship]
                    │
                    ▼
            [Check if slug exists in permissions]
```

### 6.2 Activity Logging Flow
```
[Model Event Triggered (created, updated, deleted)]
       │
       ▼
[Observer Method Called]
       │
       ▼
[activity_log() Helper Function]
       │
       ├──▶ Extract subject_id, subject_type
       ├──▶ Get current user (causer_id, causer_type)
       ├──▶ Get user's role name
       ├──▶ Get IP address from request
       ├──▶ Determine module from type/subject
       └──▶ Create ActivityLog record
```

---

## 7. CODING STANDARDS & CONVENTIONS

### 7.1 Naming Conventions
```yaml
Controllers:
  - Singular resource name + "Controller"
  - Example: ProductController, UserManagementController

Models:
  - Singular, PascalCase
  - Example: User, Product, ActivityLog

Database Tables:
  - Plural, snake_case
  - Example: users, products, activity_logs

Migrations:
  - Descriptive action + table name
  - Example: create_users_table, add_role_id_to_users_table

Routes:
  - RESTful naming: index, create, store, show, edit, update, destroy
  - Kebab-case for URLs: /activity-logs, /user-management

React Components:
  - PascalCase for component files
  - Example: UserManagement.jsx, TwoFactorVerify.jsx

Permissions:
  - resource.action format
  - Example: users.view, products.create, roles.delete
```

### 7.2 Code Organization Patterns
```yaml
Controller Methods:
  1. Validate request
  2. Execute business logic
  3. Log activity (if applicable)
  4. Return Inertia response or redirect

Model Organization:
  1. Traits (use SoftDeletes, etc.)
  2. $fillable, $hidden, $casts
  3. Relationships
  4. Accessors/Mutators
  5. Scopes
  6. Custom methods

React Component Organization:
  1. Imports
  2. Custom hooks
  3. Component function
  4. State declarations
  5. useEffect hooks
  6. Event handlers
  7. Render return
```

---

## 8. IMPLEMENTATION SEQUENCE

For implementing this system from scratch, follow this order:

```
PHASE 1: Foundation
├── 1. Database Setup (migrations)
├── 2. Base Models (User, Role, Permission)
├── 3. Authentication System (Login, 2FA)
└── 4. RBAC System (Roles, Permissions, Middleware)

PHASE 2: Core Features
├── 5. User Management Module
├── 6. Activity Logging System
├── 7. Profile Management
└── 8. Dashboard (basic)

PHASE 3: Business Modules
├── 9. Products Module
├── 10. Clients Module
└── 11. Dashboard (full metrics)

PHASE 4: Polish
├── 12. UI Components Library
├── 13. Error Handling
├── 14. Email System
└── 15. Testing & Optimization
```

---

## 9. DOCUMENT NAVIGATION

Each subsequent document provides complete implementation details for its module. Read them in order for best understanding:

| Document | Module | Key Contents |
|----------|--------|--------------|
| 01 | Authentication & 2FA | Login flow, OTP, session management |
| 02 | User Management | User CRUD, password setup, status management |
| 03 | Roles & Permissions | RBAC, permission matrix, middleware |
| 04 | Products | Product catalog, import, status toggle |
| 05 | Clients | Client management, search, filtering |
| 06 | Activity Logs | Audit trail, observers, filtering |
| 07 | Dashboard | Metrics, KPIs, data aggregation |
| 08 | Profile | User profile, signature management |
| 09 | UI Components | Reusable components, layouts |
| 10 | Error Handling | Exception handling, error pages |
| 11 | Email System | Mail classes, templates |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**System:** Rental Quotation System (RQS)
