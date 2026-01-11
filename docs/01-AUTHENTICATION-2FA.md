# MODULE 01: AUTHENTICATION & TWO-FACTOR AUTHENTICATION (2FA)

## TABLE OF CONTENTS
```
1. Module Overview
2. Database Design
3. Backend Architecture
4. Frontend Implementation
5. Security Mechanisms
6. Request/Response Lifecycle
7. Implementation Guide
```

---

## 1. MODULE OVERVIEW

### 1.1 Purpose
The Authentication module handles user login, logout, password management, and Two-Factor Authentication (2FA) via email OTP. It ensures secure access to the system while maintaining user experience.

### 1.2 Features
- Email/Password based login
- Two-Factor Authentication via email OTP (6-digit code)
- Rate limiting (throttling) for login attempts
- Password setup for new users (via secure token link)
- Password reset functionality
- Session-based authentication
- Remember me functionality
- Automatic session refresh

### 1.3 Business Logic Flow
```
[User enters email/password]
         │
         ▼
[Validate credentials against database]
         │
    ┌────┴────┐
    │         │
[Invalid]  [Valid]
    │         │
    ▼         ▼
[Show error] [Check if 2FA required]
              │
              ▼
    [Generate 6-digit OTP]
              │
              ▼
    [Store in two_factor_codes table]
              │
              ▼
    [Send OTP via email]
              │
              ▼
    [Redirect to 2FA verification page]
              │
              ▼
    [User enters OTP]
              │
         ┌────┴────┐
         │         │
    [Invalid]   [Valid]
         │         │
         ▼         ▼
    [Show error] [Create authenticated session]
                   │
                   ▼
              [Redirect to Dashboard]
```

---

## 2. DATABASE DESIGN

### 2.1 Users Table (Authentication Fields)

#### Table: `users`
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,

    -- Password Setup Fields
    password_setup_token VARCHAR(255) NULL,
    password_setup_token_expires_at TIMESTAMP NULL,
    password_set TINYINT(1) DEFAULT 0,

    -- Role Reference
    role_id BIGINT UNSIGNED NULL,

    -- Timestamps
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    deleted_at TIMESTAMP NULL,

    -- Indexes
    INDEX users_email_index (email),
    INDEX users_role_id_index (role_id),

    -- Foreign Keys
    CONSTRAINT users_role_id_foreign
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Field Specifications
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| name | VARCHAR(255) | NOT NULL | User's full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email address |
| email_verified_at | TIMESTAMP | NULL | Email verification timestamp |
| password | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| remember_token | VARCHAR(100) | NULL | "Remember me" token |
| password_setup_token | VARCHAR(255) | NULL | Token for new user password setup |
| password_setup_token_expires_at | TIMESTAMP | NULL | Token expiration time |
| password_set | TINYINT(1) | DEFAULT 0 | Whether password has been set |
| role_id | BIGINT UNSIGNED | NULL, FK | Reference to roles table |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

### 2.2 Two Factor Codes Table

#### Table: `two_factor_codes`
```sql
CREATE TABLE two_factor_codes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    -- Indexes
    INDEX two_factor_codes_user_id_index (user_id),
    INDEX two_factor_codes_code_index (code),

    -- Foreign Keys
    CONSTRAINT two_factor_codes_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Field Specifications
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary identifier |
| user_id | BIGINT UNSIGNED | NOT NULL, FK | Reference to users table |
| code | VARCHAR(6) | NOT NULL | 6-digit OTP code |
| expires_at | TIMESTAMP | NOT NULL | Code expiration time (10 minutes) |
| used_at | TIMESTAMP | NULL | When code was used (NULL if unused) |

### 2.3 Migration Files

#### Migration: `2014_10_12_000000_create_users_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
}
```

#### Migration: `2026_01_04_100001_add_password_setup_fields_to_users_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddPasswordSetupFieldsToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password_setup_token')->nullable()->after('remember_token');
            $table->timestamp('password_setup_token_expires_at')->nullable()->after('password_setup_token');
            $table->boolean('password_set')->default(false)->after('password_setup_token_expires_at');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['password_setup_token', 'password_setup_token_expires_at', 'password_set']);
        });
    }
}
```

#### Migration: `2026_01_04_100002_create_two_factor_codes_table.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTwoFactorCodesTable extends Migration
{
    public function up()
    {
        Schema::create('two_factor_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('code', 6);
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index('code');
        });
    }

    public function down()
    {
        Schema::dropIfExists('two_factor_codes');
    }
}
```

---

## 3. BACKEND ARCHITECTURE

### 3.1 Models

#### Model: `User.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'password_setup_token',
        'password_setup_token_expires_at',
        'password_set',
        'signature_html',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'password_setup_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password_setup_token_expires_at' => 'datetime',
        'password_set' => 'boolean',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function twoFactorCodes()
    {
        return $this->hasMany(TwoFactorCode::class);
    }

    // ============================================
    // ROLE & PERMISSION METHODS
    // ============================================

    public function isSuperAdmin(): bool
    {
        return $this->role && $this->role->slug === 'superadmin';
    }

    public function isAdmin(): bool
    {
        return $this->role && in_array($this->role->slug, ['superadmin', 'admin']);
    }

    public function hasRole(string $roleSlug): bool
    {
        return $this->role && $this->role->slug === $roleSlug;
    }

    public function hasPermission(string $permissionSlug): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!$this->role) {
            return false;
        }

        return $this->role->permissions()
            ->where('slug', $permissionSlug)
            ->exists();
    }

    public function getPermissionSlugs(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::pluck('slug')->toArray();
        }

        if (!$this->role) {
            return [];
        }

        return $this->role->permissions()->pluck('slug')->toArray();
    }

    // ============================================
    // 2FA METHODS
    // ============================================

    public function generateTwoFactorCode(): TwoFactorCode
    {
        // Invalidate existing codes
        $this->twoFactorCodes()
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['used_at' => now()]);

        // Generate new 6-digit code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        return $this->twoFactorCodes()->create([
            'code' => $code,
            'expires_at' => now()->addMinutes(10),
        ]);
    }

    public function getLatestValidTwoFactorCode(): ?TwoFactorCode
    {
        return $this->twoFactorCodes()
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();
    }
}
```

#### Model: `TwoFactorCode.php`
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TwoFactorCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'code',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    // ============================================
    // RELATIONSHIPS
    // ============================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    public function isValid(): bool
    {
        return $this->used_at === null && $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }
}
```

### 3.2 Controllers

#### Controller: `LoginController.php`
```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TwoFactorCode;
use App\Mail\TwoFactorCodeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LoginController extends Controller
{
    // ============================================
    // SHOW LOGIN FORM
    // ============================================

    public function showLoginForm()
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => true,
            'status' => session('status'),
        ]);
    }

    // ============================================
    // HANDLE LOGIN (STEP 1: CREDENTIALS)
    // ============================================

    public function login(Request $request)
    {
        // Validate input
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Rate limiting
        $throttleKey = Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        // Validate credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey);
            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        // Check if password is set (for new users)
        if (!$user->password_set) {
            return back()->withErrors([
                'email' => 'Please set up your password using the link sent to your email.',
            ]);
        }

        // Clear rate limiter
        RateLimiter::clear($throttleKey);

        // Store user ID in session for 2FA
        session(['2fa_user_id' => $user->id]);
        session(['2fa_remember' => $request->boolean('remember')]);

        // Generate and send 2FA code
        $twoFactorCode = $user->generateTwoFactorCode();
        Mail::to($user->email)->send(new TwoFactorCodeMail($user, $twoFactorCode));

        // Redirect to 2FA verification
        return redirect()->route('2fa.verify');
    }

    // ============================================
    // SHOW 2FA FORM
    // ============================================

    public function showTwoFactorForm()
    {
        $userId = session('2fa_user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);

        if (!$user) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/TwoFactorVerify', [
            'email' => $this->maskEmail($user->email),
            'message' => 'A verification code has been sent to your email.',
        ]);
    }

    // ============================================
    // VERIFY 2FA CODE (STEP 2: OTP)
    // ============================================

    public function verifyTwoFactor(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $userId = session('2fa_user_id');

        if (!$userId) {
            return redirect()->route('login')
                ->withErrors(['code' => 'Session expired. Please login again.']);
        }

        $user = User::find($userId);

        if (!$user) {
            return redirect()->route('login')
                ->withErrors(['code' => 'User not found.']);
        }

        // Find valid code
        $twoFactorCode = $user->twoFactorCodes()
            ->where('code', $request->code)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$twoFactorCode) {
            return back()->withErrors([
                'code' => 'Invalid or expired verification code.',
            ]);
        }

        // Mark code as used
        $twoFactorCode->markAsUsed();

        // Clear 2FA session data
        $remember = session('2fa_remember', false);
        session()->forget(['2fa_user_id', '2fa_remember']);

        // Login user
        Auth::login($user, $remember);

        // Regenerate session
        $request->session()->regenerate();

        // Log successful login
        activity_log(
            'user_login',
            'User logged in: ' . $user->name,
            $user,
            ['ip' => $request->ip(), 'user_agent' => $request->userAgent()]
        );

        return redirect()->intended('/dashboard');
    }

    // ============================================
    // RESEND 2FA CODE
    // ============================================

    public function resendTwoFactorCode(Request $request)
    {
        $userId = session('2fa_user_id');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Session expired. Please login again.',
            ], 401);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 404);
        }

        // Rate limit resend (1 per minute)
        $throttleKey = 'resend_2fa_' . $user->id;

        if (RateLimiter::tooManyAttempts($throttleKey, 1)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Please wait {$seconds} seconds before requesting a new code.",
            ], 429);
        }

        RateLimiter::hit($throttleKey, 60);

        // Generate and send new code
        $twoFactorCode = $user->generateTwoFactorCode();
        Mail::to($user->email)->send(new TwoFactorCodeMail($user, $twoFactorCode));

        return response()->json([
            'success' => true,
            'message' => 'A new verification code has been sent to your email.',
        ]);
    }

    // ============================================
    // LOGOUT
    // ============================================

    public function logout(Request $request)
    {
        $user = Auth::user();

        // Log logout
        if ($user) {
            activity_log(
                'user_logout',
                'User logged out: ' . $user->name,
                $user
            );
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    // ============================================
    // PASSWORD SETUP (NEW USERS)
    // ============================================

    public function showPasswordSetupForm(Request $request, $token)
    {
        $user = User::where('password_setup_token', $token)
            ->where('password_setup_token_expires_at', '>', now())
            ->first();

        if (!$user) {
            return Inertia::render('Auth/PasswordSetup', [
                'error' => 'Invalid or expired setup link.',
                'token' => null,
                'email' => null,
            ]);
        }

        return Inertia::render('Auth/PasswordSetup', [
            'token' => $token,
            'email' => $user->email,
        ]);
    }

    public function completePasswordSetup(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::where('password_setup_token', $request->token)
            ->where('password_setup_token_expires_at', '>', now())
            ->first();

        if (!$user) {
            return back()->withErrors([
                'token' => 'Invalid or expired setup link.',
            ]);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
            'password_set' => true,
            'password_setup_token' => null,
            'password_setup_token_expires_at' => null,
            'email_verified_at' => now(),
        ]);

        // Log password setup
        activity_log(
            'user_password_set',
            'User set password: ' . $user->name,
            $user
        );

        return redirect()->route('login')
            ->with('status', 'Password set successfully. You can now login.');
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $name = $parts[0];
        $domain = $parts[1];

        $maskedName = substr($name, 0, 2) . str_repeat('*', max(0, strlen($name) - 4)) . substr($name, -2);

        return $maskedName . '@' . $domain;
    }
}
```

### 3.3 Form Requests

#### FormRequest: `LoginRequest.php`
```php
<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    public function authenticate()
    {
        $this->ensureIsNotRateLimited();

        if (!Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    public function ensureIsNotRateLimited()
    {
        if (!RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    public function throttleKey()
    {
        return Str::lower($this->input('email')) . '|' . $this->ip();
    }
}
```

### 3.4 Mail Classes

#### Mail: `TwoFactorCodeMail.php`
```php
<?php

namespace App\Mail;

use App\Models\User;
use App\Models\TwoFactorCode;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TwoFactorCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public TwoFactorCode $twoFactorCode;
    public int $expiresInMinutes;

    public function __construct(User $user, TwoFactorCode $twoFactorCode)
    {
        $this->user = $user;
        $this->twoFactorCode = $twoFactorCode;
        $this->expiresInMinutes = (int) $twoFactorCode->expires_at->diffInMinutes(now());
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Login Verification Code - Rental System',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.two-factor-code',
        );
    }

    public function attachments(): array
    {
        return [];
    }

    public function build()
    {
        return $this->subject('Your Login Verification Code - Rental System')
                    ->view('emails.two-factor-code');
    }
}
```

### 3.5 Middleware

#### Middleware: `Authenticate.php`
```php
<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    protected function redirectTo($request)
    {
        if (!$request->expectsJson()) {
            return route('login');
        }
    }
}
```

---

## 4. FRONTEND IMPLEMENTATION

### 4.1 Login Page Component

#### Page: `resources/js/Pages/Auth/Login.jsx`
```jsx
import React, { useEffect } from 'react';
import Button from '@/Components/Button';
import Checkbox from '@/Components/Checkbox';
import Guest from '@/Layouts/Guest';
import Input from '@/Components/Input';
import Label from '@/Components/Label';
import ValidationErrors from '@/Components/ValidationErrors';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: '',
    });

    useEffect(() => {
        reset('password');
    }, [reset]);

    const handleChange = (event) => {
        setData(
            event.target.name,
            event.target.type === 'checkbox'
                ? event.target.checked
                : event.target.value
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <Guest>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Welcome to</h1>
                <h2 className="text-2xl font-semibold text-gray-600">
                    Rental Quotation System
                </h2>
            </div>

            <Head title="Log in" />

            {status && (
                <div className="mb-4 font-medium text-sm text-green-600">
                    {status}
                </div>
            )}

            <ValidationErrors errors={errors} />

            <form onSubmit={handleSubmit}>
                {/* Email Field */}
                <div>
                    <Label forInput="email" value="Email" />
                    <Input
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        isFocused={true}
                        handleChange={handleChange}
                    />
                </div>

                {/* Password Field */}
                <div className="mt-4">
                    <Label forInput="password" value="Password" />
                    <Input
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        handleChange={handleChange}
                    />
                </div>

                {/* Remember Me */}
                <div className="block mt-4">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            value={data.remember}
                            handleChange={handleChange}
                        />
                        <span className="ml-2 text-sm text-gray-600">
                            Remember me
                        </span>
                    </label>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end mt-4">
                    {canResetPassword && (
                        <Link
                            href="/forgot-password"
                            className="underline text-sm text-gray-600 hover:text-gray-900"
                        >
                            Forgot your password?
                        </Link>
                    )}
                    <Button className="ml-4" processing={processing}>
                        Log in
                    </Button>
                </div>
            </form>
        </Guest>
    );
}
```

### 4.2 Two-Factor Verification Page

#### Page: `resources/js/Pages/Auth/TwoFactorVerify.jsx`
```jsx
import React, { useState, useRef, useEffect } from 'react';
import { useForm } from '@inertiajs/react';

export default function TwoFactorVerify({ email, message }) {
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    // Auto-focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    // Sync codeDigits to form data
    useEffect(() => {
        const fullCode = codeDigits.join('');
        setData('code', fullCode);
    }, [codeDigits]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle individual digit input
    const handleCodeChange = (index, value) => {
        const digit = value.replace(/[^0-9]/g, '').slice(-1);
        const newDigits = [...codeDigits];
        newDigits[index] = digit;
        setCodeDigits(newDigits);

        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace navigation
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!codeDigits[index] && index > 0) {
                const newDigits = [...codeDigits];
                newDigits[index - 1] = '';
                setCodeDigits(newDigits);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newDigits = [...codeDigits];
                newDigits[index] = '';
                setCodeDigits(newDigits);
            }
        }
    };

    // Handle paste
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData
            .getData('text')
            .replace(/[^0-9]/g, '')
            .slice(0, 6);

        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < pastedData.length && i < 6; i++) {
            newDigits[i] = pastedData[i];
        }
        setCodeDigits(newDigits);

        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();
        const fullCode = codeDigits.join('');
        if (fullCode.length === 6) {
            post('/2fa/verify', {
                data: { code: fullCode }
            });
        }
    };

    // Resend code
    const handleResend = async () => {
        if (isResending || countdown > 0) return;

        setIsResending(true);
        setResendMessage('');
        setResendError('');

        try {
            const response = await fetch('/2fa/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector(
                        'meta[name="csrf-token"]'
                    )?.content,
                },
            });

            const result = await response.json();

            if (result.success) {
                setResendMessage(result.message);
                setCountdown(60); // 60 second cooldown
            } else {
                setResendError(result.message);
            }
        } catch (error) {
            setResendError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                            {/* Lock Icon */}
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Verify Your Identity
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            We've sent a 6-digit verification code to
                        </p>
                        <p className="text-sm font-medium text-indigo-600">
                            {email}
                        </p>
                    </div>

                    {/* Messages */}
                    {message && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">{message}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* 6-digit code inputs */}
                        <div className="flex justify-center gap-2 mb-6">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                        errors.code
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-300'
                                    }`}
                                    value={codeDigits[index] || ''}
                                    onChange={(e) => handleCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    disabled={processing}
                                />
                            ))}
                        </div>

                        {/* Error message */}
                        {errors.code && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600 text-center">
                                    {errors.code}
                                </p>
                            </div>
                        )}

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={processing || codeDigits.join('').length < 6}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>

                    {/* Resend code */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={isResending || countdown > 0}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
                        >
                            {isResending
                                ? 'Sending...'
                                : countdown > 0
                                ? `Resend code in ${countdown}s`
                                : 'Resend Code'}
                        </button>
                    </div>

                    {/* Back to login */}
                    <div className="mt-6 text-center">
                        <a
                            href="/login"
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Back to login
                        </a>
                    </div>
                </div>

                {/* Security note */}
                <p className="mt-4 text-center text-xs text-gray-500">
                    This code expires in 10 minutes. For security, never share
                    your verification code with anyone.
                </p>
            </div>
        </div>
    );
}
```

### 4.3 Password Setup Page

#### Page: `resources/js/Pages/Auth/PasswordSetup.jsx`
```jsx
import React from 'react';
import Guest from '@/Layouts/Guest';
import Input from '@/Components/Input';
import Label from '@/Components/Label';
import Button from '@/Components/Button';
import ValidationErrors from '@/Components/ValidationErrors';
import { Head, useForm } from '@inertiajs/react';

export default function PasswordSetup({ token, email, error }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/password/setup');
    };

    if (error) {
        return (
            <Guest>
                <Head title="Password Setup" />
                <div className="text-center">
                    <div className="mb-4 text-red-600">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Link Expired
                    </h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <a
                        href="/login"
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        Return to login
                    </a>
                </div>
            </Guest>
        );
    }

    return (
        <Guest>
            <Head title="Set Up Your Password" />

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Set Up Your Password
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Welcome! Please create a secure password for your account.
                </p>
                <p className="text-sm font-medium text-indigo-600">{email}</p>
            </div>

            <ValidationErrors errors={errors} />

            <form onSubmit={handleSubmit}>
                <input type="hidden" name="token" value={data.token} />

                <div>
                    <Label forInput="password" value="New Password" />
                    <Input
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        handleChange={(e) => setData('password', e.target.value)}
                    />
                </div>

                <div className="mt-4">
                    <Label forInput="password_confirmation" value="Confirm Password" />
                    <Input
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        handleChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    <p className="font-medium">Password requirements:</p>
                    <ul className="list-disc list-inside mt-1">
                        <li>Minimum 8 characters</li>
                    </ul>
                </div>

                <div className="mt-6">
                    <Button className="w-full" processing={processing}>
                        Set Password
                    </Button>
                </div>
            </form>
        </Guest>
    );
}
```

---

## 5. SECURITY MECHANISMS

### 5.1 Password Hashing
```php
// Password is hashed using bcrypt (default in Laravel)
$user->password = Hash::make($request->password);

// Password verification
if (Hash::check($request->password, $user->password)) {
    // Password matches
}
```

### 5.2 Rate Limiting (Throttling)
```php
// Login attempts: 5 per minute per email+IP combination
$throttleKey = Str::lower($request->input('email')) . '|' . $request->ip();

if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
    $seconds = RateLimiter::availableIn($throttleKey);
    // Return error with remaining seconds
}

// On failed attempt
RateLimiter::hit($throttleKey);

// On successful attempt
RateLimiter::clear($throttleKey);

// 2FA resend: 1 per minute per user
$resendKey = 'resend_2fa_' . $user->id;
RateLimiter::hit($resendKey, 60); // Decay in 60 seconds
```

### 5.3 Session Security
```php
// Session regeneration after login
$request->session()->regenerate();

// Session invalidation on logout
$request->session()->invalidate();
$request->session()->regenerateToken();
```

### 5.4 CSRF Protection
```php
// Automatically applied via VerifyCsrfToken middleware
// Frontend must include CSRF token in requests:
'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
```

### 5.5 2FA Code Security
```php
// Code generation: 6-digit random number
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

// Code expiration: 10 minutes
'expires_at' => now()->addMinutes(10)

// Previous codes are invalidated when new code is generated
$this->twoFactorCodes()
    ->whereNull('used_at')
    ->where('expires_at', '>', now())
    ->update(['used_at' => now()]);

// Code is marked as used after successful verification
$twoFactorCode->markAsUsed();
```

### 5.6 Password Setup Token Security
```php
// Token generation (in UserManagementController)
$token = Str::random(64);
$user->password_setup_token = $token;
$user->password_setup_token_expires_at = now()->addHours(48);

// Token is cleared after use
$user->update([
    'password_setup_token' => null,
    'password_setup_token_expires_at' => null,
]);
```

---

## 6. ROUTES CONFIGURATION

### 6.1 Authentication Routes (`routes/web.php`)
```php
// Public authentication routes
Route::get('/login', [LoginController::class, 'showLoginForm'])
    ->name('login');
Route::post('/login', [LoginController::class, 'login'])
    ->name('login.submit');
Route::post('/logout', [LoginController::class, 'logout'])
    ->name('logout');

// Two-Factor Authentication routes
Route::get('/2fa/verify', [LoginController::class, 'showTwoFactorForm'])
    ->name('2fa.verify');
Route::post('/2fa/verify', [LoginController::class, 'verifyTwoFactor'])
    ->name('2fa.verify.submit');
Route::post('/2fa/resend', [LoginController::class, 'resendTwoFactorCode'])
    ->name('2fa.resend');

// Password setup routes (for new users)
Route::get('/password/setup/{token}', [LoginController::class, 'showPasswordSetupForm'])
    ->name('password.setup');
Route::post('/password/setup', [LoginController::class, 'completePasswordSetup'])
    ->name('password.setup.submit');
```

### 6.2 Additional Auth Routes (`routes/auth.php`)
```php
Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');
    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.update');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', [EmailVerificationPromptController::class, '__invoke'])
        ->name('verification.notice');
    Route::get('verify-email/{id}/{hash}', [VerifyEmailController::class, '__invoke'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');
});
```

---

## 7. IMPLEMENTATION GUIDE

### 7.1 Step-by-Step Implementation

#### Step 1: Create Migrations
```bash
php artisan make:migration create_users_table
php artisan make:migration add_password_setup_fields_to_users_table
php artisan make:migration create_two_factor_codes_table
php artisan migrate
```

#### Step 2: Create Models
```bash
php artisan make:model User
php artisan make:model TwoFactorCode
```

#### Step 3: Create Controller
```bash
php artisan make:controller Auth/LoginController
```

#### Step 4: Create Mail Class
```bash
php artisan make:mail TwoFactorCodeMail
```

#### Step 5: Create Email View
Create `resources/views/emails/two-factor-code.blade.php`:
```blade
<!DOCTYPE html>
<html>
<head>
    <title>Verification Code</title>
</head>
<body>
    <h1>Hello {{ $user->name }},</h1>
    <p>Your verification code is:</p>
    <h2 style="font-size: 32px; letter-spacing: 8px; font-weight: bold;">
        {{ $twoFactorCode->code }}
    </h2>
    <p>This code will expire in {{ $expiresInMinutes }} minutes.</p>
    <p>If you did not request this code, please ignore this email.</p>
</body>
</html>
```

#### Step 6: Create Frontend Components
```bash
# Create pages
resources/js/Pages/Auth/Login.jsx
resources/js/Pages/Auth/TwoFactorVerify.jsx
resources/js/Pages/Auth/PasswordSetup.jsx
```

#### Step 7: Configure Routes
Add routes to `routes/web.php` as shown in section 6.1.

#### Step 8: Test the Flow
1. Navigate to `/login`
2. Enter valid credentials
3. Verify 2FA code is received via email
4. Enter code on 2FA page
5. Verify redirect to dashboard
6. Test logout functionality

---

## 8. ERROR HANDLING

### 8.1 Login Errors
| Error | Trigger | Message |
|-------|---------|---------|
| Invalid credentials | Wrong email/password | "These credentials do not match our records." |
| Rate limited | Too many attempts | "Too many login attempts. Please try again in X seconds." |
| Password not set | New user not setup | "Please set up your password using the link sent to your email." |

### 8.2 2FA Errors
| Error | Trigger | Message |
|-------|---------|---------|
| Invalid code | Wrong OTP | "Invalid or expired verification code." |
| Session expired | Session timeout | "Session expired. Please login again." |
| User not found | Deleted user | "User not found." |

### 8.3 Password Setup Errors
| Error | Trigger | Message |
|-------|---------|---------|
| Invalid token | Wrong/expired token | "Invalid or expired setup link." |
| Password mismatch | Confirmation doesn't match | Validation error |
| Password too short | < 8 characters | Validation error |

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Module:** Authentication & Two-Factor Authentication
