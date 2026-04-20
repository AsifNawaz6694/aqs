<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TwoFactorCode;
use App\Models\ActivityLog;
use App\Mail\TwoFactorCodeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => true,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle login (Step 1: Credentials).
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Rate limiting
        $throttleKey = Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            Log::warning('Login rate limit exceeded', ['email' => $request->email, 'ip' => $request->ip()]);
            return back()->withErrors([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ]);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        // Validate credentials
        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey);

            // Log failed login attempt
            ActivityLog::log(
                event: 'login_failed',
                description: "Failed login attempt for: {$request->email}",
                subject: $user,
                causer: null,
                properties: [
                    'email' => $request->email,
                    'reason' => !$user ? 'User not found' : 'Invalid password',
                ],
                module: 'authentication'
            );

            return back()->withErrors([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        // Check if user is active
        if ($user->status !== 'active') {
            Log::warning('Inactive user login attempt', ['user_id' => $user->id, 'email' => $user->email, 'ip' => $request->ip()]);
            return back()->withErrors([
                'email' => 'Your account has been deactivated. Please contact administrator.',
            ]);
        }

        // Check if password is set (for new users)
        if (!$user->password_set) {
            Log::info('Login attempt by user without password setup', ['user_id' => $user->id, 'email' => $user->email]);
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
        $twoFactorCode = TwoFactorCode::createForUser($user, 'login');
        Mail::to($user->email)->send(new TwoFactorCodeMail($user, $twoFactorCode));

        Log::info('2FA code sent', ['user_id' => $user->id, 'email' => $user->email, 'ip' => $request->ip()]);

        // Redirect to 2FA verification
        return redirect()->route('2fa.verify');
    }

    /**
     * Show the 2FA verification form.
     */
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

    /**
     * Verify 2FA code (Step 2: OTP).
     */
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
            Log::warning('Invalid 2FA code attempt', ['user_id' => $user->id, 'ip' => $request->ip()]);
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

        // Update last login info
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Log successful login
        ActivityLog::log(
            event: 'login',
            description: "User logged in: {$user->name}",
            subject: $user,
            causer: $user,
            properties: [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role?->name,
                'login_method' => '2FA Email',
            ],
            module: 'authentication'
        );

        // Regenerate session
        $request->session()->regenerate();

        return redirect()->intended('/dashboard');
    }

    /**
     * Resend 2FA code.
     */
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
        $twoFactorCode = TwoFactorCode::createForUser($user, 'login');
        Mail::to($user->email)->send(new TwoFactorCodeMail($user, $twoFactorCode));

        Log::info('2FA code resent', ['user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'A new verification code has been sent to your email.',
        ]);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request)
    {
        $user = Auth::user();

        // Log logout before clearing session
        if ($user) {
            ActivityLog::log(
                event: 'logout',
                description: "User logged out: {$user->name}",
                subject: $user,
                causer: $user,
                properties: [
                    'user_id' => $user->id,
                    'email' => $user->email,
                ],
                module: 'authentication'
            );
        }

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    /**
     * Show the password setup form.
     */
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

    /**
     * Complete password setup.
     */
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

        Log::info('Password setup completed', ['user_id' => $user->id, 'email' => $user->email]);

        ActivityLog::log(
            'password_setup',
            "User completed password setup: {$user->name}",
            $user,
            $user,
            ['email' => $user->email],
            [],
            'authentication'
        );

        return redirect()->route('login')
            ->with('status', 'Password set successfully. You can now login.');
    }

    /**
     * Mask email for display.
     */
    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        $name = $parts[0];
        $domain = $parts[1];

        if (strlen($name) <= 4) {
            $maskedName = substr($name, 0, 1) . str_repeat('*', strlen($name) - 1);
        } else {
            $maskedName = substr($name, 0, 2) . str_repeat('*', strlen($name) - 4) . substr($name, -2);
        }

        return $maskedName . '@' . $domain;
    }
}
