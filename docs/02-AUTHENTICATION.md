# AUTHENTICATION SYSTEM - ENHANCED

## Overview

Complete authentication system with Login, 2FA via Email, Forgot Password, and Password Setup for admin-created users.

## Authentication Flows

### 1. Login Flow with 2FA

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LOGIN FLOW WITH 2FA                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User enters email/password]                                        │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Validate Credentials │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Invalid ────▶ [Return error, increment attempts] │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Check Rate Limit    │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Exceeded ───▶ [Lock account for 15 min]          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Generate 2FA Code    │                                          │
│  │   (6 digits, 10 min)  │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Send Email with Code │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │ Store pending_user_id │                                          │
│  │     in session        │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  [Redirect to 2FA verification page]                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. 2FA Verification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     2FA VERIFICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User enters 6-digit code]                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Get pending_user_id  │                                          │
│  │     from session      │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── No session ───▶ [Redirect to login]              │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │    Validate Code      │                                          │
│  │  - Match code         │                                          │
│  │  - Check expiry       │                                          │
│  │  - Check used_at      │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Invalid ────▶ [Return error, max 3 attempts]     │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Mark code as used   │                                          │
│  │   (set used_at)       │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Auth::login($user)   │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │ Update last_login_at  │                                          │
│  │ Update last_login_ip  │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Log Activity        │                                          │
│  │   Clear session       │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  [Redirect to Dashboard]                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Forgot Password Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FORGOT PASSWORD FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User clicks "Forgot Password"]                                     │
│              │                                                       │
│              ▼                                                       │
│  [User enters email address]                                         │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │    Rate Limit Check   │                                          │
│  │  (3 requests/hour)    │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Exceeded ───▶ [Return generic message]           │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │    Find User by Email │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Not Found ───▶ [Return SAME success message]     │
│              │                      (prevent email enumeration)     │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Generate Reset Token │                                          │
│  │   (64 char, hashed)   │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │ Store in password_    │                                          │
│  │ reset_tokens table    │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Send Reset Email    │                                          │
│  │  with tokenized link  │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  [Show success message - same for all cases]                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Password Reset Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PASSWORD RESET FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [User clicks link in email]                                         │
│  /password/reset/{token}?email=xxx                                   │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Validate Token      │                                          │
│  │  - Exists in DB       │                                          │
│  │  - Not expired (1hr)  │                                          │
│  │  - Matches email      │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Invalid ────▶ [Show error, link to resend]       │
│              │                                                       │
│              ▼                                                       │
│  [Show password reset form]                                          │
│              │                                                       │
│              ▼                                                       │
│  [User enters new password]                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Validate Password    │                                          │
│  │  - Min 8 characters   │                                          │
│  │  - Confirmation match │                                          │
│  │  - Complexity rules   │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Update User Password │                                          │
│  │  (Argon2id hash)      │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Delete Reset Token   │                                          │
│  │  Invalidate sessions  │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Log Activity        │                                          │
│  │   Send Confirmation   │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  [Redirect to login with success message]                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5. Password Setup Flow (Admin-Created Users)

```
┌─────────────────────────────────────────────────────────────────────┐
│               PASSWORD SETUP FLOW (NEW USERS)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [Admin creates user via User Management]                            │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Create User with:    │                                          │
│  │  - Random temp pass   │                                          │
│  │  - password_set=false │                                          │
│  │  - setup_token        │                                          │
│  │  - expires_at (48hr)  │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │ Send PasswordSetupMail│                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  [User receives email and clicks link]                               │
│  /password/setup/{token}?email=xxx                                   │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Validate Token      │                                          │
│  │  - Exists             │                                          │
│  │  - Not expired (48hr) │                                          │
│  │  - User not already   │                                          │
│  │    set password       │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ├──── Invalid ────▶ [Error page with resend option]    │
│              │                                                       │
│              ▼                                                       │
│  [Show password setup form]                                          │
│              │                                                       │
│              ▼                                                       │
│  [User sets password]                                                │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │  Update User:         │                                          │
│  │  - Hash password      │                                          │
│  │  - password_set=true  │                                          │
│  │  - Clear token        │                                          │
│  │  - email_verified_at  │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  ┌───────────────────────┐                                          │
│  │   Log Activity        │                                          │
│  │   Auto-login user     │                                          │
│  └───────────┬───────────┘                                          │
│              │                                                       │
│              ▼                                                       │
│  [Redirect to Dashboard]                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### LoginController.php

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Models\TwoFactorCode;
use App\Mail\TwoFactorCodeMail;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class LoginController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/Login');
    }

    public function store(LoginRequest $request)
    {
        // Rate limiting
        $throttleKey = 'login:' . $request->ip();

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
            RateLimiter::hit($throttleKey, 900); // 15 minutes
            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        // Check if user is active
        if ($user->status !== 'active') {
            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        // Check if password is set (for admin-created users)
        if (!$user->password_set) {
            return back()->withErrors([
                'email' => 'Please check your email and set up your password first.',
            ]);
        }

        // Clear rate limiter on successful credential validation
        RateLimiter::clear($throttleKey);

        // Generate 2FA code
        $code = $this->generateTwoFactorCode($user, $request);

        // Send email
        Mail::to($user->email)->send(new TwoFactorCodeMail($user, $code));

        // Store pending user in session
        session([
            'pending_user_id' => $user->id,
            '2fa_expires_at' => now()->addMinutes(10),
        ]);

        return redirect()->route('two-factor.show');
    }

    protected function generateTwoFactorCode(User $user, Request $request): string
    {
        // Delete any existing unused codes
        TwoFactorCode::where('user_id', $user->id)
            ->whereNull('used_at')
            ->delete();

        // Generate new code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        TwoFactorCode::create([
            'user_id' => $user->id,
            'code' => $code,
            'type' => 'login',
            'expires_at' => now()->addMinutes(10),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $code;
    }
}
```

### TwoFactorController.php

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TwoFactorCode;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class TwoFactorController extends Controller
{
    public function show()
    {
        if (!session('pending_user_id')) {
            return redirect()->route('login');
        }

        // Check if 2FA session has expired
        if (now()->isAfter(session('2fa_expires_at'))) {
            session()->forget(['pending_user_id', '2fa_expires_at']);
            return redirect()->route('login')->withErrors([
                'email' => 'Your verification session has expired. Please login again.',
            ]);
        }

        return Inertia::render('Auth/TwoFactor', [
            'expiresAt' => session('2fa_expires_at'),
        ]);
    }

    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $userId = session('pending_user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        // Rate limiting for code attempts
        $throttleKey = '2fa:' . $userId;

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            session()->forget(['pending_user_id', '2fa_expires_at']);
            return redirect()->route('login')->withErrors([
                'code' => 'Too many failed attempts. Please login again.',
            ]);
        }

        // Find valid code
        $twoFactorCode = TwoFactorCode::where('user_id', $userId)
            ->where('code', $request->code)
            ->where('type', 'login')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$twoFactorCode) {
            RateLimiter::hit($throttleKey, 300); // 5 minutes
            return back()->withErrors([
                'code' => 'Invalid or expired verification code.',
            ]);
        }

        // Mark code as used
        $twoFactorCode->update(['used_at' => now()]);

        // Get user and login
        $user = User::find($userId);

        // Update login tracking
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Login user
        Auth::login($user, session('remember_me', false));

        // Clear session data
        session()->forget(['pending_user_id', '2fa_expires_at', 'remember_me']);
        RateLimiter::clear($throttleKey);

        // Log activity
        activity_log('user_logged_in', 'User logged in', $user);

        return redirect()->intended(route('dashboard'));
    }

    public function resend(Request $request)
    {
        $userId = session('pending_user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        // Rate limiting for resend
        $throttleKey = '2fa_resend:' . $userId;

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            return back()->withErrors([
                'code' => 'Please wait before requesting a new code.',
            ]);
        }

        $user = User::find($userId);

        // Generate new code
        $code = $this->generateTwoFactorCode($user, $request);

        // Send email
        Mail::to($user->email)->send(new TwoFactorCodeMail($user, $code));

        // Reset session expiry
        session(['2fa_expires_at' => now()->addMinutes(10)]);

        RateLimiter::hit($throttleKey, 60); // 1 minute

        return back()->with('success', 'A new verification code has been sent to your email.');
    }
}
```

### ForgotPasswordController.php

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\PasswordResetMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    public function create()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function store(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Rate limiting
        $throttleKey = 'password_reset:' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            // Return success anyway to prevent enumeration
            return back()->with('status', 'If an account exists for this email, you will receive a password reset link.');
        }

        RateLimiter::hit($throttleKey, 3600); // 1 hour

        $user = User::where('email', $request->email)->first();

        // Always return success to prevent email enumeration
        $successMessage = 'If an account exists for this email, you will receive a password reset link.';

        if (!$user) {
            return back()->with('status', $successMessage);
        }

        // Generate token
        $token = Str::random(64);

        // Delete existing tokens for this email
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Store hashed token
        DB::table('password_reset_tokens')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        // Send email with unhashed token
        Mail::to($user->email)->send(new PasswordResetMail($user, $token));

        // Log activity
        activity_log('password_reset_requested', 'Password reset requested', $user);

        return back()->with('status', $successMessage);
    }
}
```

### ResetPasswordController.php

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\PasswordChangedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ResetPasswordController extends Controller
{
    public function create(Request $request, string $token)
    {
        $email = $request->query('email');

        // Validate token exists
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$record) {
            return Inertia::render('Auth/ResetPassword', [
                'error' => 'Invalid password reset link.',
                'token' => null,
                'email' => null,
            ]);
        }

        // Check token validity
        if (!Hash::check($token, $record->token)) {
            return Inertia::render('Auth/ResetPassword', [
                'error' => 'Invalid password reset link.',
                'token' => null,
                'email' => null,
            ]);
        }

        // Check expiry (1 hour)
        if (now()->diffInMinutes($record->created_at) > 60) {
            return Inertia::render('Auth/ResetPassword', [
                'error' => 'This password reset link has expired.',
                'token' => null,
                'email' => null,
            ]);
        }

        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $email,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        // Validate token
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return back()->withErrors(['email' => 'Invalid password reset token.']);
        }

        // Check expiry
        if (now()->diffInMinutes($record->created_at) > 60) {
            return back()->withErrors(['email' => 'This password reset link has expired.']);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors(['email' => 'User not found.']);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Delete token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        // Invalidate all sessions (security measure)
        DB::table('sessions')->where('user_id', $user->id)->delete();

        // Send confirmation email
        Mail::to($user->email)->send(new PasswordChangedMail($user));

        // Log activity
        activity_log('password_reset_completed', 'Password reset completed', $user);

        return redirect()->route('login')
            ->with('status', 'Your password has been reset. Please login with your new password.');
    }
}
```

### PasswordSetupController.php

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class PasswordSetupController extends Controller
{
    public function create(Request $request, string $token)
    {
        $email = $request->query('email');

        // Find user by token and email
        $user = User::where('email', $email)
            ->where('password_setup_token', $token)
            ->where('password_set', false)
            ->first();

        if (!$user) {
            return Inertia::render('Auth/PasswordSetup', [
                'error' => 'Invalid setup link. Please contact your administrator.',
                'token' => null,
                'email' => null,
            ]);
        }

        // Check expiry (48 hours)
        if ($user->password_setup_token_expires_at < now()) {
            return Inertia::render('Auth/PasswordSetup', [
                'error' => 'This setup link has expired. Please contact your administrator to resend.',
                'token' => null,
                'email' => null,
                'canResend' => true,
            ]);
        }

        return Inertia::render('Auth/PasswordSetup', [
            'token' => $token,
            'email' => $email,
            'userName' => $user->name,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        // Find user
        $user = User::where('email', $request->email)
            ->where('password_setup_token', $request->token)
            ->where('password_set', false)
            ->first();

        if (!$user) {
            return back()->withErrors(['email' => 'Invalid setup link.']);
        }

        // Check expiry
        if ($user->password_setup_token_expires_at < now()) {
            return back()->withErrors(['email' => 'This setup link has expired.']);
        }

        // Update user
        $user->update([
            'password' => Hash::make($request->password),
            'password_set' => true,
            'password_setup_token' => null,
            'password_setup_token_expires_at' => null,
            'email_verified_at' => now(),
        ]);

        // Log activity
        activity_log('password_setup_completed', 'User set up their password', $user);

        // Auto-login
        Auth::login($user);

        return redirect()->route('dashboard')
            ->with('success', 'Welcome! Your password has been set successfully.');
    }
}
```

---

## Frontend Implementation

### Login.tsx

```tsx
import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md mx-auto"
            >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome Back
                        </h1>
                        <p className="text-gray-500 mt-2">
                            Sign in to your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                            {errors.email && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-2 text-sm text-red-600"
                                >
                                    {errors.email}
                                </motion.p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                                Remember me
                            </label>
                        </div>

                        {/* Submit */}
                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>
        </GuestLayout>
    );
}
```

### TwoFactor.tsx

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import GuestLayout from '@/Layouts/GuestLayout';

interface Props {
    expiresAt: string;
}

export default function TwoFactor({ expiresAt }: Props) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer
    useEffect(() => {
        const expires = new Date(expiresAt).getTime();
        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.max(0, Math.floor((expires - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (newCode.every((digit) => digit !== '')) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newCode = [...code];
        pasted.split('').forEach((digit, i) => {
            if (i < 6) newCode[i] = digit;
        });
        setCode(newCode);

        if (newCode.every((digit) => digit !== '')) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleSubmit = (fullCode: string) => {
        setProcessing(true);
        setError('');

        router.post('/two-factor/verify', { code: fullCode }, {
            onError: (errors) => {
                setError(errors.code || 'Verification failed');
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleResend = () => {
        router.post('/two-factor/resend');
    };

    return (
        <GuestLayout>
            <Head title="Verify Your Identity" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md mx-auto"
            >
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Verify Your Identity
                        </h1>
                        <p className="text-gray-500 mt-2">
                            We've sent a 6-digit code to your email
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-6">
                        <span className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-600' : 'text-gray-600'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Error */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Code Input */}
                    <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <motion.input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                disabled={processing}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all disabled:opacity-50"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                            />
                        ))}
                    </div>

                    {/* Processing Indicator */}
                    {processing && (
                        <div className="flex justify-center mb-4">
                            <svg className="animate-spin h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    )}

                    {/* Resend */}
                    <div className="text-center">
                        <p className="text-gray-500 text-sm">
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResend}
                                className="text-indigo-600 hover:text-indigo-500 font-medium"
                            >
                                Resend
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </GuestLayout>
    );
}
```

---

## Routes Configuration

```php
// routes/auth.php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\PasswordSetupController;

// Guest routes
Route::middleware('guest')->group(function () {
    // Login
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    // Two-Factor
    Route::get('/two-factor', [TwoFactorController::class, 'show'])->name('two-factor.show');
    Route::post('/two-factor/verify', [TwoFactorController::class, 'verify'])->name('two-factor.verify');
    Route::post('/two-factor/resend', [TwoFactorController::class, 'resend'])->name('two-factor.resend');

    // Forgot Password
    Route::get('/forgot-password', [ForgotPasswordController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [ForgotPasswordController::class, 'store'])->name('password.email');

    // Reset Password
    Route::get('/password/reset/{token}', [ResetPasswordController::class, 'create'])->name('password.reset');
    Route::post('/password/reset', [ResetPasswordController::class, 'store'])->name('password.update');

    // Password Setup (for admin-created users)
    Route::get('/password/setup/{token}', [PasswordSetupController::class, 'create'])->name('password.setup');
    Route::post('/password/setup', [PasswordSetupController::class, 'store'])->name('password.setup.store');
});

// Authenticated routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LogoutController::class, 'destroy'])->name('logout');
});
```

---

## Security Measures

1. **Rate Limiting**: Login attempts, 2FA attempts, password reset requests
2. **Token Hashing**: Password reset tokens are hashed before storage
3. **Email Enumeration Prevention**: Same response for valid/invalid emails
4. **Session Invalidation**: All sessions cleared on password reset
5. **Token Expiration**: 2FA (10 min), Reset (1 hour), Setup (48 hours)
6. **Password Complexity**: Min 8 chars, mixed case, numbers, symbols
7. **IP/User Agent Logging**: Tracked for security auditing
8. **Argon2id Hashing**: Modern password hashing algorithm

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Module:** Authentication
