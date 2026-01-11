<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Redirect root to login (or dashboard if authenticated)
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'permission:dashboard.view'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.avatar.delete');
    Route::post('/profile/signature', [ProfileController::class, 'updateSignature'])->name('profile.signature.update');
    Route::delete('/profile/signature', [ProfileController::class, 'deleteSignature'])->name('profile.signature.delete');
    Route::patch('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');

    // User Management routes
    Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
    Route::get('/users/export', [UserManagementController::class, 'export'])->name('users.export');
    Route::get('/users/create', [UserManagementController::class, 'create'])->name('users.create');
    Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UserManagementController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit', [UserManagementController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
    Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
    Route::post('/users/{user}/resend-setup-email', [UserManagementController::class, 'resendSetupEmail'])->name('users.resend-setup-email');

    // Role Management routes
    Route::get('/roles', [RoleController::class, 'index'])->name('roles.index')->middleware('permission:roles.view');
    Route::get('/roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('permission:roles.create');
    Route::post('/roles', [RoleController::class, 'store'])->name('roles.store')->middleware('permission:roles.create');
    Route::get('/roles/{role}', [RoleController::class, 'show'])->name('roles.show')->middleware('permission:roles.view');
    Route::get('/roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit')->middleware('permission:roles.edit');
    Route::put('/roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('permission:roles.edit');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('permission:roles.delete');

    // Activity Logs routes
    Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index')->middleware('permission:activity-logs.view');
    Route::get('/activity-logs/export', [ActivityLogController::class, 'export'])->name('activity-logs.export')->middleware('permission:activity-logs.export');
    Route::get('/activity-logs/{activityLog}', [ActivityLogController::class, 'show'])->name('activity-logs.show')->middleware('permission:activity-logs.view');

    // Product routes
    Route::get('/products', [ProductController::class, 'index'])->name('products.index')->middleware('permission:products.view');
    Route::get('/products/export', [ProductController::class, 'export'])->name('products.export')->middleware('permission:products.export');
    Route::get('/products/import', [ProductController::class, 'showImport'])->name('products.import')->middleware('permission:products.import');
    Route::post('/products/import', [ProductController::class, 'import'])->name('products.import.store')->middleware('permission:products.import');
    Route::get('/products/create', [ProductController::class, 'create'])->name('products.create')->middleware('permission:products.create');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store')->middleware('permission:products.create');
    Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show')->middleware('permission:products.view');
    Route::get('/products/{product}/edit', [ProductController::class, 'edit'])->name('products.edit')->middleware('permission:products.edit');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update')->middleware('permission:products.edit');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy')->middleware('permission:products.delete');

    // Client routes
    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index')->middleware('permission:clients.view');
    Route::get('/clients/export', [ClientController::class, 'export'])->name('clients.export')->middleware('permission:clients.export');
    Route::get('/clients/create', [ClientController::class, 'create'])->name('clients.create')->middleware('permission:clients.create');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store')->middleware('permission:clients.create');
    Route::get('/clients/{client}', [ClientController::class, 'show'])->name('clients.show')->middleware('permission:clients.view');
    Route::get('/clients/{client}/edit', [ClientController::class, 'edit'])->name('clients.edit')->middleware('permission:clients.edit');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update')->middleware('permission:clients.edit');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy')->middleware('permission:clients.delete');

    // Quotation routes
    Route::get('/quotations', [QuotationController::class, 'index'])->name('quotations.index')->middleware('permission:quotations.view');
    Route::get('/quotations/export', [QuotationController::class, 'export'])->name('quotations.export')->middleware('permission:quotations.export');
    Route::get('/quotations/search-products', [QuotationController::class, 'searchProducts'])->name('quotations.search-products')->middleware('permission:quotations.create');
    Route::get('/quotations/currencies', [QuotationController::class, 'getCurrencies'])->name('quotations.currencies')->middleware('permission:quotations.view');
    Route::post('/quotations/parse-file', [QuotationController::class, 'parseFile'])->name('quotations.parse-file')->middleware('permission:quotations.create');
    Route::post('/quotations/search-by-references', [QuotationController::class, 'searchProductsByReferences'])->name('quotations.search-by-references')->middleware('permission:quotations.create');
    Route::post('/quotations/create-from-file', [QuotationController::class, 'createFromFile'])->name('quotations.create-from-file')->middleware('permission:quotations.create');
    Route::get('/quotations/create', [QuotationController::class, 'create'])->name('quotations.create')->middleware('permission:quotations.create');
    Route::post('/quotations', [QuotationController::class, 'store'])->name('quotations.store')->middleware('permission:quotations.create');
    Route::get('/quotations/{quotation}', [QuotationController::class, 'show'])->name('quotations.show')->middleware('permission:quotations.view');
    Route::get('/quotations/{quotation}/edit', [QuotationController::class, 'edit'])->name('quotations.edit')->middleware('permission:quotations.edit');
    Route::put('/quotations/{quotation}', [QuotationController::class, 'update'])->name('quotations.update')->middleware('permission:quotations.edit');
    Route::delete('/quotations/{quotation}', [QuotationController::class, 'destroy'])->name('quotations.destroy')->middleware('permission:quotations.delete');

    // Quotation actions
    Route::post('/quotations/{quotation}/submit-for-review', [QuotationController::class, 'submitForReview'])->name('quotations.submit-for-review')->middleware('permission:quotations.submit');
    Route::post('/quotations/{quotation}/approve', [QuotationController::class, 'approve'])->name('quotations.approve')->middleware('permission:quotations.approve');
    Route::post('/quotations/{quotation}/reject', [QuotationController::class, 'reject'])->name('quotations.reject')->middleware('permission:quotations.approve');
    Route::post('/quotations/{quotation}/send', [QuotationController::class, 'send'])->name('quotations.send')->middleware('permission:quotations.send');
    Route::post('/quotations/{quotation}/mark-accepted', [QuotationController::class, 'markAccepted'])->name('quotations.mark-accepted')->middleware('permission:quotations.edit');
    Route::post('/quotations/{quotation}/mark-rejected', [QuotationController::class, 'markRejected'])->name('quotations.mark-rejected')->middleware('permission:quotations.edit');
    Route::post('/quotations/{quotation}/create-version', [QuotationController::class, 'createVersion'])->name('quotations.create-version')->middleware('permission:quotations.create');
    Route::post('/quotations/{quotation}/generate-pdf', [QuotationController::class, 'generatePdf'])->name('quotations.generate-pdf')->middleware('permission:quotations.view');
    Route::get('/quotations/{quotation}/download-pdf', [QuotationController::class, 'downloadPdf'])->name('quotations.download-pdf')->middleware('permission:quotations.view');

    // Settings routes
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index')->middleware('permission:settings.view');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update')->middleware('permission:settings.edit');
});

require __DIR__.'/auth.php';
