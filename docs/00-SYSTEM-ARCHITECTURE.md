# RENTAL QUOTATION SYSTEM (RQS) - ENHANCED ARCHITECTURE

## Technology Stack (Updated for 2026)

```yaml
Backend:
  Framework: Laravel 12.x
  PHP: ^8.2
  Database: MySQL 8.0+ (InnoDB)
  Cache: Redis
  Queue: Redis
  Session: Redis

Frontend:
  Framework: React 19.x
  Build Tool: Vite 7.x
  CSS: Tailwind CSS 4.x
  State: Inertia.js 2.x
  Charts: Recharts / Chart.js
  Animations: Framer Motion
  Icons: Lucide React
  UI Components: Headless UI + Custom

Security:
  Authentication: Laravel Sanctum
  2FA: TOTP (Time-based OTP)
  Password Hashing: Argon2id
  Rate Limiting: Redis-based
  CSRF: Token-based
  XSS: Content Security Policy
```

## Directory Structure

```
aqs-new/
├── app/
│   ├── Actions/                    # Single-purpose action classes
│   │   ├── Auth/
│   │   │   ├── AuthenticateUser.php
│   │   │   ├── GenerateTwoFactorCode.php
│   │   │   ├── VerifyTwoFactorCode.php
│   │   │   └── ResetPassword.php
│   │   ├── Users/
│   │   │   ├── CreateUser.php
│   │   │   ├── UpdateUser.php
│   │   │   └── DeleteUser.php
│   │   └── ActivityLog/
│   │       └── LogActivity.php
│   │
│   ├── Enums/                      # PHP 8.1+ Enums
│   │   ├── UserStatus.php
│   │   ├── ProductStatus.php
│   │   ├── ClientStatus.php
│   │   └── ActivityType.php
│   │
│   ├── Events/                     # Domain events
│   │   ├── UserCreated.php
│   │   ├── UserLoggedIn.php
│   │   ├── TwoFactorVerified.php
│   │   └── PasswordReset.php
│   │
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginController.php
│   │   │   │   ├── TwoFactorController.php
│   │   │   │   ├── ForgotPasswordController.php
│   │   │   │   ├── ResetPasswordController.php
│   │   │   │   └── LogoutController.php
│   │   │   ├── UserController.php
│   │   │   ├── RoleController.php
│   │   │   ├── PermissionController.php
│   │   │   ├── ProductController.php
│   │   │   ├── ClientController.php
│   │   │   ├── ProfileController.php
│   │   │   ├── DashboardController.php
│   │   │   └── ActivityLogController.php
│   │   │
│   │   ├── Middleware/
│   │   │   ├── HandleInertiaRequests.php
│   │   │   ├── EnsureTwoFactorVerified.php
│   │   │   ├── CheckPermission.php
│   │   │   ├── CheckRole.php
│   │   │   └── TrackActivity.php
│   │   │
│   │   └── Requests/               # Form Request Validation
│   │       ├── Auth/
│   │       │   ├── LoginRequest.php
│   │       │   ├── TwoFactorRequest.php
│   │       │   └── ResetPasswordRequest.php
│   │       ├── UserRequest.php
│   │       ├── ProductRequest.php
│   │       ├── ClientRequest.php
│   │       └── ProfileRequest.php
│   │
│   ├── Listeners/                  # Event listeners
│   │   ├── SendTwoFactorCode.php
│   │   ├── LogUserActivity.php
│   │   └── SendWelcomeEmail.php
│   │
│   ├── Mail/
│   │   ├── TwoFactorCodeMail.php
│   │   ├── PasswordResetMail.php
│   │   ├── WelcomeMail.php
│   │   └── PasswordSetupMail.php
│   │
│   ├── Models/
│   │   ├── User.php
│   │   ├── Role.php
│   │   ├── Permission.php
│   │   ├── Profile.php
│   │   ├── TwoFactorCode.php
│   │   ├── Product.php
│   │   ├── Client.php
│   │   ├── ActivityLog.php
│   │   └── PasswordResetToken.php
│   │
│   ├── Observers/
│   │   ├── UserObserver.php
│   │   ├── ProductObserver.php
│   │   ├── ClientObserver.php
│   │   └── ProfileObserver.php
│   │
│   ├── Policies/                   # Authorization policies
│   │   ├── UserPolicy.php
│   │   ├── ProductPolicy.php
│   │   ├── ClientPolicy.php
│   │   └── RolePolicy.php
│   │
│   ├── Providers/
│   │   ├── AppServiceProvider.php
│   │   ├── AuthServiceProvider.php
│   │   └── EventServiceProvider.php
│   │
│   └── Services/                   # Business logic services
│       ├── AuthService.php
│       ├── TwoFactorService.php
│       ├── ActivityLogService.php
│       ├── DashboardService.php
│       └── ExportService.php
│
├── database/
│   ├── migrations/
│   ├── seeders/
│   │   ├── DatabaseSeeder.php
│   │   ├── RoleSeeder.php
│   │   ├── PermissionSeeder.php
│   │   └── AdminUserSeeder.php
│   └── factories/
│
├── resources/
│   └── js/
│       ├── Components/
│       │   ├── ui/                 # Base UI components
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Avatar.tsx
│       │   │   ├── Dropdown.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── Pagination.tsx
│       │   │   ├── Toast.tsx
│       │   │   └── Loading.tsx
│       │   │
│       │   ├── charts/             # Chart components
│       │   │   ├── AreaChart.tsx
│       │   │   ├── BarChart.tsx
│       │   │   ├── PieChart.tsx
│       │   │   ├── LineChart.tsx
│       │   │   └── StatCard.tsx
│       │   │
│       │   ├── forms/              # Form components
│       │   │   ├── FormInput.tsx
│       │   │   ├── FormSelect.tsx
│       │   │   ├── FormTextarea.tsx
│       │   │   ├── FormCheckbox.tsx
│       │   │   ├── SignaturePad.tsx
│       │   │   └── ImageUpload.tsx
│       │   │
│       │   └── layout/             # Layout components
│       │       ├── Sidebar.tsx
│       │       ├── Header.tsx
│       │       ├── Breadcrumb.tsx
│       │       └── PageHeader.tsx
│       │
│       ├── Layouts/
│       │   ├── AuthLayout.tsx
│       │   ├── GuestLayout.tsx
│       │   └── AppLayout.tsx
│       │
│       ├── Pages/
│       │   ├── Auth/
│       │   │   ├── Login.tsx
│       │   │   ├── TwoFactor.tsx
│       │   │   ├── ForgotPassword.tsx
│       │   │   └── ResetPassword.tsx
│       │   │
│       │   ├── Dashboard/
│       │   │   └── Index.tsx
│       │   │
│       │   ├── Users/
│       │   │   ├── Index.tsx
│       │   │   ├── Create.tsx
│       │   │   ├── Edit.tsx
│       │   │   └── Show.tsx
│       │   │
│       │   ├── Roles/
│       │   │   ├── Index.tsx
│       │   │   ├── Create.tsx
│       │   │   └── Edit.tsx
│       │   │
│       │   ├── Products/
│       │   │   ├── Index.tsx
│       │   │   ├── Create.tsx
│       │   │   ├── Edit.tsx
│       │   │   └── Show.tsx
│       │   │
│       │   ├── Clients/
│       │   │   ├── Index.tsx
│       │   │   ├── Create.tsx
│       │   │   ├── Edit.tsx
│       │   │   └── Show.tsx
│       │   │
│       │   ├── Profile/
│       │   │   └── Edit.tsx
│       │   │
│       │   └── ActivityLogs/
│       │       └── Index.tsx
│       │
│       ├── hooks/                  # Custom React hooks
│       │   ├── useAuth.ts
│       │   ├── usePermission.ts
│       │   ├── useDebounce.ts
│       │   ├── useToast.ts
│       │   └── useAnimatedCounter.ts
│       │
│       ├── lib/                    # Utilities
│       │   ├── utils.ts
│       │   ├── animations.ts
│       │   └── constants.ts
│       │
│       └── types/                  # TypeScript types
│           ├── index.d.ts
│           ├── auth.d.ts
│           ├── models.d.ts
│           └── api.d.ts
│
├── routes/
│   ├── web.php
│   ├── auth.php
│   └── api.php
│
└── docs/                           # Documentation
    ├── 00-SYSTEM-ARCHITECTURE.md
    ├── 01-DATABASE-SCHEMA.md
    ├── 02-AUTHENTICATION.md
    ├── 03-MODULES.md
    └── 04-UI-COMPONENTS.md
```

## Application Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Browser ──▶ Vite Dev Server (HMR) ──▶ Laravel Router                │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐              │
│                                     │   Middleware    │              │
│                                     │   Pipeline      │              │
│                                     └────────┬────────┘              │
│                                              │                        │
│              ┌───────────────────────────────┼───────────────────┐   │
│              │                               │                   │   │
│              ▼                               ▼                   ▼   │
│      ┌──────────────┐              ┌──────────────┐      ┌──────────┐│
│      │VerifyCsrfToken│             │ Authenticate │      │RateLimit ││
│      └──────────────┘              └──────────────┘      └──────────┘│
│              │                               │                   │   │
│              └───────────────────────────────┼───────────────────┘   │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐              │
│                                     │ CheckPermission │              │
│                                     └────────┬────────┘              │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐              │
│                                     │   Controller    │              │
│                                     └────────┬────────┘              │
│                                              │                        │
│                         ┌────────────────────┼────────────────────┐  │
│                         │                    │                    │  │
│                         ▼                    ▼                    ▼  │
│                  ┌────────────┐      ┌────────────┐       ┌─────────┐│
│                  │  Actions   │      │  Services  │       │ Events  ││
│                  └────────────┘      └────────────┘       └─────────┘│
│                         │                    │                    │  │
│                         └────────────────────┼────────────────────┘  │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐              │
│                                     │ Inertia::render │              │
│                                     └────────┬────────┘              │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐              │
│                                     │HandleInertiaReq │              │
│                                     │  (Share Data)   │              │
│                                     └────────┬────────┘              │
│                                              │                        │
│                                              ▼                        │
│                                       JSON Response                   │
│                                              │                        │
│                                              ▼                        │
│                                     ┌─────────────────┐              │
│                                     │ React Component │              │
│                                     │   Rendering     │              │
│                                     └─────────────────┘              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```
