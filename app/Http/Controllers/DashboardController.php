<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use App\Models\Client;
use App\Models\Quotation;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        // Summary Statistics with safe checks
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'total_products' => 0,
            'active_products' => 0,
            'low_stock_products' => 0,
            'total_clients' => 0,
            'active_clients' => 0,
            'total_quotations' => 0,
            'pending_quotations' => 0,
            'accepted_quotations' => 0,
            'quotations_value' => 0,
        ];

        // Check if products table exists with expected columns
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'stock_quantity')) {
            $stats['total_products'] = Product::count();
            $stats['active_products'] = Product::where('status', 'active')->count();
            $stats['low_stock_products'] = Product::where('stock_quantity', '<=', 5)->where('status', 'active')->count();
        }

        // Check if clients table exists
        if (Schema::hasTable('clients')) {
            $stats['total_clients'] = Client::count();
            $stats['active_clients'] = Client::where('status', 'active')->count();
        }

        // Check if quotations table exists
        if (Schema::hasTable('quotations')) {
            $stats['total_quotations'] = Quotation::count();
            $stats['pending_quotations'] = Quotation::whereIn('status', [
                Quotation::STATUS_DRAFT,
                Quotation::STATUS_PENDING_REVIEW,
                Quotation::STATUS_APPROVED,
            ])->count();
            $stats['accepted_quotations'] = Quotation::where('status', Quotation::STATUS_ACCEPTED)->count();
            $stats['quotations_value'] = Quotation::where('status', Quotation::STATUS_ACCEPTED)->sum('grand_total');
        }

        // Recent Activity (last 10)
        $recentActivity = collect();
        if (Schema::hasTable('activity_logs')) {
            $recentActivity = ActivityLog::with('causer')
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($log) {
                    $causerName = 'System';
                    if ($log->causer && $log->causer instanceof User) {
                        $causerName = $log->causer->name;
                    }
                    return [
                        'id' => $log->id,
                        'user_name' => $causerName,
                        'action' => $log->event,
                        'model_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                        'description' => $log->description,
                        'created_at' => $log->created_at->diffForHumans(),
                    ];
                });
        }

        // Activity by Day (last 7 days)
        $activityByDay = collect();
        if (Schema::hasTable('activity_logs')) {
            $activityByDay = ActivityLog::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count')
            )
                ->where('created_at', '>=', Carbon::now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date')
                ->get()
                ->map(function ($item) {
                    return [
                        'date' => Carbon::parse($item->date)->format('M d'),
                        'count' => $item->count,
                    ];
                });
        }

        // Products by Category
        $productsByCategory = collect();
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'category')) {
            $productsByCategory = Product::select('category', DB::raw('COUNT(*) as count'))
                ->whereNotNull('category')
                ->groupBy('category')
                ->orderByDesc('count')
                ->take(6)
                ->get()
                ->map(function ($item) {
                    return [
                        'category' => $item->category,
                        'count' => $item->count,
                    ];
                });
        }

        // Clients by Type
        $clientsByType = collect();
        if (Schema::hasTable('clients')) {
            $clientsByType = Client::select('type', DB::raw('COUNT(*) as count'))
                ->groupBy('type')
                ->get()
                ->map(function ($item) {
                    return [
                        'type' => ucfirst($item->type),
                        'count' => $item->count,
                    ];
                });
        }

        // Users by Role
        $usersByRole = collect();
        if (Schema::hasTable('roles')) {
            $usersByRole = User::select('roles.name as role_name', DB::raw('COUNT(users.id) as count'))
                ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
                ->groupBy('roles.id', 'roles.name')
                ->get()
                ->map(function ($item) {
                    return [
                        'role' => $item->role_name ?? 'No Role',
                        'count' => $item->count,
                    ];
                });
        }

        // Activity by Action Type
        $activityByAction = collect();
        if (Schema::hasTable('activity_logs')) {
            $activityByAction = ActivityLog::select('event', DB::raw('COUNT(*) as count'))
                ->groupBy('event')
                ->orderByDesc('count')
                ->get()
                ->map(function ($item) {
                    return [
                        'action' => ucfirst($item->event),
                        'count' => $item->count,
                    ];
                });
        }

        // Monthly Stats
        $newUsersThisMonth = User::where('created_at', '>=', Carbon::now()->startOfMonth())->count();
        $newClientsThisMonth = Schema::hasTable('clients')
            ? Client::where('created_at', '>=', Carbon::now()->startOfMonth())->count()
            : 0;
        $newProductsThisMonth = Schema::hasTable('products')
            ? Product::where('created_at', '>=', Carbon::now()->startOfMonth())->count()
            : 0;

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'activityByDay' => $activityByDay,
            'productsByCategory' => $productsByCategory,
            'clientsByType' => $clientsByType,
            'usersByRole' => $usersByRole,
            'activityByAction' => $activityByAction,
            'monthlyStats' => [
                'new_users' => $newUsersThisMonth,
                'new_clients' => $newClientsThisMonth,
                'new_products' => $newProductsThisMonth,
            ],
        ]);
    }
}
