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
    private ?int $userId = null;
    private ?Carbon $dateFrom = null;
    private ?Carbon $dateTo = null;

    /**
     * Display the dashboard.
     */
    public function index(Request $request)
    {
        // Parse filters
        $this->parseFilters($request);

        // Get users for filter dropdown
        $users = User::select('id', 'name')->orderBy('name')->get();

        // Summary Statistics with safe checks
        $stats = $this->getStats();

        // Recent Activity (last 10)
        $recentActivity = $this->getRecentActivity();

        // Activity by Day (last 7 days)
        $activityByDay = $this->getActivityByDay();

        // Products by Category
        $productsByCategory = $this->getProductsByCategory();

        // Clients by Type
        $clientsByType = $this->getClientsByType();

        // Users by Role
        $usersByRole = $this->getUsersByRole();

        // Activity by Action Type
        $activityByAction = $this->getActivityByAction();

        // Quotation Stats
        $quotationsByStatus = $this->getQuotationsByStatus();
        $quotationsTrend = $this->getQuotationsTrend();
        $topClients = $this->getTopClients();
        $quotationsByMonth = $this->getQuotationsByMonth();

        // Top Products and Quotations
        $topProducts = $this->getTopProducts();
        $topQuotations = $this->getTopQuotations();

        // Monthly Stats
        $monthlyStats = $this->getMonthlyStats();

        // Performance metrics
        $performanceMetrics = $this->getPerformanceMetrics();

        return Inertia::render('Dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'activityByDay' => $activityByDay,
            'productsByCategory' => $productsByCategory,
            'clientsByType' => $clientsByType,
            'usersByRole' => $usersByRole,
            'activityByAction' => $activityByAction,
            'quotationsByStatus' => $quotationsByStatus,
            'quotationsTrend' => $quotationsTrend,
            'topClients' => $topClients,
            'topProducts' => $topProducts,
            'topQuotations' => $topQuotations,
            'quotationsByMonth' => $quotationsByMonth,
            'monthlyStats' => $monthlyStats,
            'performanceMetrics' => $performanceMetrics,
            'users' => $users,
            'filters' => [
                'user_id' => $this->userId,
                'date_range' => request('date_range', ''),
                'date_from' => $this->dateFrom?->format('Y-m-d'),
                'date_to' => $this->dateTo?->format('Y-m-d'),
            ],
        ]);
    }

    private function parseFilters(Request $request): void
    {
        // User filter
        if ($request->filled('user_id')) {
            $this->userId = (int) $request->user_id;
        }

        // Date range filter
        $dateRange = $request->get('date_range', '');

        switch ($dateRange) {
            case 'today':
                $this->dateFrom = Carbon::today();
                $this->dateTo = Carbon::today()->endOfDay();
                break;
            case 'yesterday':
                $this->dateFrom = Carbon::yesterday();
                $this->dateTo = Carbon::yesterday()->endOfDay();
                break;
            case 'last_7_days':
                $this->dateFrom = Carbon::now()->subDays(6)->startOfDay();
                $this->dateTo = Carbon::now()->endOfDay();
                break;
            case 'last_30_days':
                $this->dateFrom = Carbon::now()->subDays(29)->startOfDay();
                $this->dateTo = Carbon::now()->endOfDay();
                break;
            case 'this_month':
                $this->dateFrom = Carbon::now()->startOfMonth();
                $this->dateTo = Carbon::now()->endOfMonth();
                break;
            case 'last_month':
                $this->dateFrom = Carbon::now()->subMonth()->startOfMonth();
                $this->dateTo = Carbon::now()->subMonth()->endOfMonth();
                break;
            case 'this_quarter':
                $this->dateFrom = Carbon::now()->startOfQuarter();
                $this->dateTo = Carbon::now()->endOfQuarter();
                break;
            case 'last_quarter':
                $this->dateFrom = Carbon::now()->subQuarter()->startOfQuarter();
                $this->dateTo = Carbon::now()->subQuarter()->endOfQuarter();
                break;
            case 'this_year':
                $this->dateFrom = Carbon::now()->startOfYear();
                $this->dateTo = Carbon::now()->endOfYear();
                break;
            case 'last_year':
                $this->dateFrom = Carbon::now()->subYear()->startOfYear();
                $this->dateTo = Carbon::now()->subYear()->endOfYear();
                break;
            case 'custom':
                if ($request->filled('date_from')) {
                    $this->dateFrom = Carbon::parse($request->date_from)->startOfDay();
                }
                if ($request->filled('date_to')) {
                    $this->dateTo = Carbon::parse($request->date_to)->endOfDay();
                }
                break;
        }
    }

    private function getStats(): array
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('status', 'active')->count(),
            'total_products' => 0,
            'active_products' => 0,
            'low_stock_products' => 0,
            'total_clients' => 0,
            'active_clients' => 0,
            'new_clients_this_month' => 0,
            'total_quotations' => 0,
            'pending_quotations' => 0,
            'approved_quotations' => 0,
            'sent_quotations' => 0,
            'accepted_quotations' => 0,
            'rejected_quotations' => 0,
            'quotations_value' => 0,
            'pending_value' => 0,
            'conversion_rate' => 0,
            'avg_quotation_value' => 0,
        ];

        // Products
        if (Schema::hasTable('products')) {
            $stats['total_products'] = Product::count();
            $stats['active_products'] = Product::where('status', 'active')->count();
            if (Schema::hasColumn('products', 'stock_quantity')) {
                $stats['low_stock_products'] = Product::where('stock_quantity', '<=', 5)
                    ->where('status', 'active')
                    ->count();
            }
        }

        // Clients
        if (Schema::hasTable('clients')) {
            $stats['total_clients'] = Client::count();
            $stats['active_clients'] = Client::where('status', 'active')->count();
            $stats['new_clients_this_month'] = Client::where('created_at', '>=', Carbon::now()->startOfMonth())->count();
        }

        // Quotations - apply filters
        if (Schema::hasTable('quotations')) {
            $baseQuery = Quotation::query();

            // Apply user filter
            if ($this->userId) {
                $baseQuery->where('created_by', $this->userId);
            }

            // Apply date filter
            if ($this->dateFrom) {
                $baseQuery->where('created_at', '>=', $this->dateFrom);
            }
            if ($this->dateTo) {
                $baseQuery->where('created_at', '<=', $this->dateTo);
            }

            $stats['total_quotations'] = (clone $baseQuery)->count();
            $stats['pending_quotations'] = (clone $baseQuery)->whereIn('status', [
                Quotation::STATUS_DRAFT,
                Quotation::STATUS_PENDING_REVIEW,
            ])->count();
            $stats['approved_quotations'] = (clone $baseQuery)->where('status', Quotation::STATUS_APPROVED)->count();
            $stats['sent_quotations'] = (clone $baseQuery)->where('status', Quotation::STATUS_SENT)->count();
            $stats['accepted_quotations'] = (clone $baseQuery)->where('status', Quotation::STATUS_ACCEPTED)->count();
            $stats['rejected_quotations'] = (clone $baseQuery)->where('status', Quotation::STATUS_REJECTED)->count();

            $stats['quotations_value'] = (clone $baseQuery)->where('status', Quotation::STATUS_ACCEPTED)->sum('grand_total');
            $stats['pending_value'] = (clone $baseQuery)->whereIn('status', [
                Quotation::STATUS_SENT,
                Quotation::STATUS_APPROVED,
            ])->sum('grand_total');

            // Conversion rate: accepted / (sent + accepted + rejected)
            $totalSentOrDecided = $stats['sent_quotations'] + $stats['accepted_quotations'] + $stats['rejected_quotations'];
            $stats['conversion_rate'] = $totalSentOrDecided > 0
                ? round(($stats['accepted_quotations'] / $totalSentOrDecided) * 100, 1)
                : 0;

            // Average quotation value
            $stats['avg_quotation_value'] = (clone $baseQuery)->where('status', Quotation::STATUS_ACCEPTED)->avg('grand_total') ?? 0;
        }

        return $stats;
    }

    private function getRecentActivity()
    {
        if (!Schema::hasTable('activity_logs')) {
            return collect();
        }

        $query = ActivityLog::with('causer');

        // Apply user filter
        if ($this->userId) {
            $query->where('causer_id', $this->userId);
        }

        // Apply date filter
        if ($this->dateFrom) {
            $query->where('created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $query->where('created_at', '<=', $this->dateTo);
        }

        return $query->latest()
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

    private function getActivityByDay()
    {
        if (!Schema::hasTable('activity_logs')) {
            return collect();
        }

        // Determine date range for display
        $startDate = $this->dateFrom ?? Carbon::now()->subDays(13);
        $endDate = $this->dateTo ?? Carbon::now();

        // Ensure we have at least 14 days of data
        $daysDiff = $startDate->diffInDays($endDate);
        if ($daysDiff < 14 && !$this->dateFrom) {
            $startDate = Carbon::now()->subDays(13);
        }

        $days = collect();
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $days->put($currentDate->format('Y-m-d'), [
                'date' => $currentDate->format('M d'),
                'full_date' => $currentDate->format('Y-m-d'),
                'count' => 0,
                'day' => $currentDate->format('D'),
            ]);
            $currentDate->addDay();
        }

        $query = ActivityLog::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate);

        // Apply user filter
        if ($this->userId) {
            $query->where('causer_id', $this->userId);
        }

        $activityCounts = $query->groupBy('date')->get();

        foreach ($activityCounts as $activity) {
            if ($days->has($activity->date)) {
                $dayData = $days->get($activity->date);
                $dayData['count'] = $activity->count;
                $days->put($activity->date, $dayData);
            }
        }

        return $days->values();
    }

    private function getProductsByCategory()
    {
        if (!Schema::hasTable('products') || !Schema::hasColumn('products', 'category')) {
            return collect();
        }

        return Product::select('category', DB::raw('COUNT(*) as count'))
            ->whereNotNull('category')
            ->groupBy('category')
            ->orderByDesc('count')
            ->take(6)
            ->get()
            ->map(fn($item) => [
                'category' => $item->category,
                'count' => $item->count,
            ]);
    }

    private function getClientsByType()
    {
        if (!Schema::hasTable('clients')) {
            return collect();
        }

        return Client::select('type', DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get()
            ->map(fn($item) => [
                'type' => ucfirst($item->type),
                'count' => $item->count,
            ]);
    }

    private function getUsersByRole()
    {
        if (!Schema::hasTable('roles')) {
            return collect();
        }

        return User::select('roles.name as role_name', DB::raw('COUNT(users.id) as count'))
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->groupBy('roles.id', 'roles.name')
            ->get()
            ->map(fn($item) => [
                'role' => $item->role_name ?? 'No Role',
                'count' => $item->count,
            ]);
    }

    private function getActivityByAction()
    {
        if (!Schema::hasTable('activity_logs')) {
            return collect();
        }

        return ActivityLog::select('event', DB::raw('COUNT(*) as count'))
            ->groupBy('event')
            ->orderByDesc('count')
            ->get()
            ->map(fn($item) => [
                'action' => ucfirst($item->event),
                'count' => $item->count,
            ]);
    }

    private function getQuotationsByStatus()
    {
        if (!Schema::hasTable('quotations')) {
            return collect();
        }

        $statusColors = [
            'draft' => '#94a3b8',
            'pending_review' => '#f59e0b',
            'approved' => '#10b981',
            'sent' => '#3b82f6',
            'accepted' => '#22c55e',
            'rejected' => '#ef4444',
            'expired' => '#6b7280',
            'cancelled' => '#9ca3af',
        ];

        $query = Quotation::select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(grand_total) as value'));

        // Apply user filter
        if ($this->userId) {
            $query->where('created_by', $this->userId);
        }

        // Apply date filter
        if ($this->dateFrom) {
            $query->where('created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $query->where('created_at', '<=', $this->dateTo);
        }

        return $query->groupBy('status')
            ->get()
            ->map(fn($item) => [
                'status' => ucfirst(str_replace('_', ' ', $item->status)),
                'key' => $item->status,
                'count' => $item->count,
                'value' => $item->value ?? 0,
                'color' => $statusColors[$item->status] ?? '#6b7280',
            ]);
    }

    private function getQuotationsTrend()
    {
        if (!Schema::hasTable('quotations')) {
            return collect();
        }

        // Determine date range
        $startDate = $this->dateFrom ?? Carbon::now()->subDays(29);
        $endDate = $this->dateTo ?? Carbon::now();

        $days = collect();
        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $days->put($currentDate->format('Y-m-d'), [
                'date' => $currentDate->format('M d'),
                'created' => 0,
                'accepted' => 0,
                'value' => 0,
            ]);
            $currentDate->addDay();
        }

        // Created quotations per day
        $createdQuery = Quotation::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(grand_total) as value')
        )
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate);

        if ($this->userId) {
            $createdQuery->where('created_by', $this->userId);
        }

        $created = $createdQuery->groupBy('date')->get();

        foreach ($created as $item) {
            if ($days->has($item->date)) {
                $dayData = $days->get($item->date);
                $dayData['created'] = $item->count;
                $dayData['value'] = $item->value ?? 0;
                $days->put($item->date, $dayData);
            }
        }

        // Accepted quotations (by updated_at when status changed to accepted)
        $acceptedQuery = Quotation::select(
            DB::raw('DATE(updated_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->where('status', Quotation::STATUS_ACCEPTED)
            ->where('updated_at', '>=', $startDate)
            ->where('updated_at', '<=', $endDate);

        if ($this->userId) {
            $acceptedQuery->where('created_by', $this->userId);
        }

        $accepted = $acceptedQuery->groupBy('date')->get();

        foreach ($accepted as $item) {
            if ($days->has($item->date)) {
                $dayData = $days->get($item->date);
                $dayData['accepted'] = $item->count;
                $days->put($item->date, $dayData);
            }
        }

        return $days->values();
    }

    private function getTopClients()
    {
        if (!Schema::hasTable('quotations') || !Schema::hasTable('clients')) {
            return collect();
        }

        $query = Quotation::select(
            'clients.id',
            'clients.name',
            'clients.company_name',
            'clients.type',
            DB::raw('COUNT(quotations.id) as quotation_count'),
            DB::raw('SUM(quotations.grand_total) as total_value'),
            DB::raw('SUM(CASE WHEN quotations.status = "accepted" THEN quotations.grand_total ELSE 0 END) as accepted_value')
        )
            ->join('clients', 'quotations.client_id', '=', 'clients.id');

        // Apply user filter
        if ($this->userId) {
            $query->where('quotations.created_by', $this->userId);
        }

        // Apply date filter
        if ($this->dateFrom) {
            $query->where('quotations.created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $query->where('quotations.created_at', '<=', $this->dateTo);
        }

        return $query->groupBy('clients.id', 'clients.name', 'clients.company_name', 'clients.type')
            ->orderByDesc('total_value')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $displayName = $item->company_name ?: $item->name;
                return [
                    'id' => $item->id,
                    'name' => $displayName ?: 'Unknown Client',
                    'type' => ucfirst($item->type ?? 'individual'),
                    'quotation_count' => $item->quotation_count,
                    'total_value' => $item->total_value ?? 0,
                    'accepted_value' => $item->accepted_value ?? 0,
                ];
            });
    }

    private function getQuotationsByMonth()
    {
        if (!Schema::hasTable('quotations')) {
            return collect();
        }

        // Determine months range based on filters or default to last 6 months
        $startDate = $this->dateFrom ?? Carbon::now()->subMonths(5)->startOfMonth();
        $endDate = $this->dateTo ?? Carbon::now()->endOfMonth();

        $months = collect();
        $currentDate = $startDate->copy()->startOfMonth();
        while ($currentDate <= $endDate) {
            $months->put($currentDate->format('Y-m'), [
                'month' => $currentDate->format('M Y'),
                'short' => $currentDate->format('M'),
                'created' => 0,
                'accepted' => 0,
                'value' => 0,
            ]);
            $currentDate->addMonth();
        }

        // Created by month
        $createdQuery = Quotation::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count'),
            DB::raw('SUM(grand_total) as value')
        )
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate);

        if ($this->userId) {
            $createdQuery->where('created_by', $this->userId);
        }

        $created = $createdQuery->groupBy('month')->get();

        foreach ($created as $item) {
            if ($months->has($item->month)) {
                $monthData = $months->get($item->month);
                $monthData['created'] = $item->count;
                $monthData['value'] = $item->value ?? 0;
                $months->put($item->month, $monthData);
            }
        }

        // Accepted by month
        $acceptedQuery = Quotation::select(
            DB::raw('DATE_FORMAT(updated_at, "%Y-%m") as month'),
            DB::raw('COUNT(*) as count')
        )
            ->where('status', Quotation::STATUS_ACCEPTED)
            ->where('updated_at', '>=', $startDate)
            ->where('updated_at', '<=', $endDate);

        if ($this->userId) {
            $acceptedQuery->where('created_by', $this->userId);
        }

        $accepted = $acceptedQuery->groupBy('month')->get();

        foreach ($accepted as $item) {
            if ($months->has($item->month)) {
                $monthData = $months->get($item->month);
                $monthData['accepted'] = $item->count;
                $months->put($item->month, $monthData);
            }
        }

        return $months->values();
    }

    private function getMonthlyStats(): array
    {
        // Use filter dates or default to current month
        $startDate = $this->dateFrom ?? Carbon::now()->startOfMonth();
        $endDate = $this->dateTo ?? Carbon::now()->endOfMonth();

        $stats = [
            'new_users' => User::whereBetween('created_at', [$startDate, $endDate])->count(),
            'new_clients' => 0,
            'new_products' => 0,
            'new_quotations' => 0,
            'month_value' => 0,
        ];

        if (Schema::hasTable('clients')) {
            $stats['new_clients'] = Client::whereBetween('created_at', [$startDate, $endDate])->count();
        }

        if (Schema::hasTable('products')) {
            $stats['new_products'] = Product::whereBetween('created_at', [$startDate, $endDate])->count();
        }

        if (Schema::hasTable('quotations')) {
            $quotationQuery = Quotation::whereBetween('created_at', [$startDate, $endDate]);
            if ($this->userId) {
                $quotationQuery->where('created_by', $this->userId);
            }
            $stats['new_quotations'] = $quotationQuery->count();

            $valueQuery = Quotation::where('status', Quotation::STATUS_ACCEPTED)
                ->whereBetween('updated_at', [$startDate, $endDate]);
            if ($this->userId) {
                $valueQuery->where('created_by', $this->userId);
            }
            $stats['month_value'] = $valueQuery->sum('grand_total');
        }

        return $stats;
    }

    private function getPerformanceMetrics(): array
    {
        if (!Schema::hasTable('quotations')) {
            return [
                'avg_response_time' => 0,
                'quotations_this_week' => 0,
                'quotations_last_week' => 0,
                'week_change' => 0,
            ];
        }

        $thisWeekQuery = Quotation::where('created_at', '>=', Carbon::now()->startOfWeek());
        $lastWeekQuery = Quotation::whereBetween('created_at', [
            Carbon::now()->subWeek()->startOfWeek(),
            Carbon::now()->subWeek()->endOfWeek(),
        ]);

        if ($this->userId) {
            $thisWeekQuery->where('created_by', $this->userId);
            $lastWeekQuery->where('created_by', $this->userId);
        }

        $thisWeek = $thisWeekQuery->count();
        $lastWeek = $lastWeekQuery->count();

        $weekChange = $lastWeek > 0
            ? round((($thisWeek - $lastWeek) / $lastWeek) * 100, 1)
            : ($thisWeek > 0 ? 100 : 0);

        // Get quotation count for avg items calculation
        $quotationCountQuery = Quotation::query();
        if ($this->userId) {
            $quotationCountQuery->where('created_by', $this->userId);
        }
        if ($this->dateFrom) {
            $quotationCountQuery->where('created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $quotationCountQuery->where('created_at', '<=', $this->dateTo);
        }
        $quotationCount = $quotationCountQuery->count();

        // Get items count
        $itemsQuery = DB::table('quotation_items')
            ->join('quotations', 'quotation_items.quotation_id', '=', 'quotations.id');
        if ($this->userId) {
            $itemsQuery->where('quotations.created_by', $this->userId);
        }
        if ($this->dateFrom) {
            $itemsQuery->where('quotations.created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $itemsQuery->where('quotations.created_at', '<=', $this->dateTo);
        }
        $itemsCount = $itemsQuery->count();

        return [
            'quotations_this_week' => $thisWeek,
            'quotations_last_week' => $lastWeek,
            'week_change' => $weekChange,
            'avg_items_per_quotation' => round(
                $itemsCount / max($quotationCount, 1),
                1
            ),
        ];
    }

    private function getTopProducts()
    {
        if (!Schema::hasTable('quotation_items') || !Schema::hasTable('quotations')) {
            return collect();
        }

        $query = DB::table('quotation_items')
            ->join('quotations', 'quotation_items.quotation_id', '=', 'quotations.id')
            ->select(
                'quotation_items.name',
                'quotation_items.item_code',
                DB::raw('COUNT(*) as usage_count'),
                DB::raw('SUM(quotation_items.quantity) as total_quantity'),
                DB::raw('SUM(quotation_items.unit_price * quotation_items.quantity) as total_value')
            );

        // Apply user filter
        if ($this->userId) {
            $query->where('quotations.created_by', $this->userId);
        }

        // Apply date filter
        if ($this->dateFrom) {
            $query->where('quotations.created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $query->where('quotations.created_at', '<=', $this->dateTo);
        }

        return $query->groupBy('quotation_items.name', 'quotation_items.item_code')
            ->orderByDesc('total_value')
            ->take(5)
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'item_code' => $item->item_code,
                'usage_count' => $item->usage_count,
                'total_quantity' => round($item->total_quantity, 2),
                'total_value' => $item->total_value ?? 0,
            ]);
    }

    private function getTopQuotations()
    {
        if (!Schema::hasTable('quotations')) {
            return collect();
        }

        $query = Quotation::with(['client:id,name,company_name', 'user:id,name'])
            ->select('id', 'quotation_number', 'client_id', 'user_id', 'status', 'grand_total', 'created_at');

        // Apply user filter
        if ($this->userId) {
            $query->where('created_by', $this->userId);
        }

        // Apply date filter
        if ($this->dateFrom) {
            $query->where('created_at', '>=', $this->dateFrom);
        }
        if ($this->dateTo) {
            $query->where('created_at', '<=', $this->dateTo);
        }

        return $query->orderByDesc('grand_total')
            ->take(5)
            ->get()
            ->map(fn($item) => [
                'id' => $item->id,
                'quotation_number' => $item->quotation_number,
                'client_name' => $item->client?->company_name ?: $item->client?->name ?: 'Unknown',
                'user_name' => $item->user?->name ?? 'Unknown',
                'status' => ucfirst(str_replace('_', ' ', $item->status)),
                'status_key' => $item->status,
                'grand_total' => $item->grand_total ?? 0,
                'created_at' => $item->created_at->format('M d, Y'),
            ]);
    }
}
