<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    // Custom Login with 2FA
    Route::get('login', [LoginController::class, 'showLoginForm'])
        ->name('login');

    Route::post('login', [LoginController::class, 'login'])
        ->name('login.submit');

    // Two-Factor Authentication routes
    Route::get('2fa/verify', [LoginController::class, 'showTwoFactorForm'])
        ->name('2fa.verify');

    Route::post('2fa/verify', [LoginController::class, 'verifyTwoFactor'])
        ->name('2fa.verify.submit');

    Route::post('2fa/resend', [LoginController::class, 'resendTwoFactorCode'])
        ->name('2fa.resend');

    // Password setup routes (for new users)
    Route::get('password/setup/{token}', [LoginController::class, 'showPasswordSetupForm'])
        ->name('password.setup');

    Route::post('password/setup', [LoginController::class, 'completePasswordSetup'])
        ->name('password.setup.submit');

    // Password reset routes
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [LoginController::class, 'logout'])
        ->name('logout');
});
