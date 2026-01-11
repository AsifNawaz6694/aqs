import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface Stats {
    total_users: number;
    active_users: number;
    total_products: number;
    active_products: number;
    low_stock_products: number;
    total_clients: number;
    active_clients: number;
    new_clients_this_month: number;
    total_quotations: number;
    pending_quotations: number;
    approved_quotations: number;
    sent_quotations: number;
    accepted_quotations: number;
    rejected_quotations: number;
    quotations_value: number;
    pending_value: number;
    conversion_rate: number;
    avg_quotation_value: number;
}

interface ActivityItem {
    id: number;
    user_name: string;
    action: string;
    model_type: string | null;
    description: string | null;
    created_at: string;
}

interface ChartData {
    date?: string;
    count: number;
    category?: string;
    type?: string;
    role?: string;
    action?: string;
    day?: string;
}

interface QuotationStatusData {
    status: string;
    key: string;
    count: number;
    value: number;
    color: string;
}

interface QuotationTrendData {
    date: string;
    created: number;
    accepted: number;
    value: number;
}

interface TopClient {
    id: number;
    name: string;
    type: string;
    quotation_count: number;
    total_value: number;
    accepted_value: number;
}

interface MonthlyData {
    month: string;
    short: string;
    created: number;
    accepted: number;
    value: number;
}

interface MonthlyStats {
    new_users: number;
    new_clients: number;
    new_products: number;
    new_quotations: number;
    month_value: number;
}

interface PerformanceMetrics {
    quotations_this_week: number;
    quotations_last_week: number;
    week_change: number;
    avg_items_per_quotation: number;
}

interface UserOption {
    id: number;
    name: string;
}

interface Filters {
    user_id: number | null;
    date_range: string;
    date_from: string | null;
    date_to: string | null;
}

interface Props {
    stats?: Stats;
    recentActivity?: ActivityItem[];
    activityByDay?: ChartData[];
    productsByCategory?: ChartData[];
    clientsByType?: ChartData[];
    usersByRole?: ChartData[];
    activityByAction?: ChartData[];
    quotationsByStatus?: QuotationStatusData[];
    quotationsTrend?: QuotationTrendData[];
    topClients?: TopClient[];
    quotationsByMonth?: MonthlyData[];
    monthlyStats?: MonthlyStats;
    performanceMetrics?: PerformanceMetrics;
    users?: UserOption[];
    filters?: Filters;
}

// Animated counter component
function AnimatedCounter({ value, duration = 1000, prefix = '', suffix = '' }: { value: number; duration?: number; prefix?: string; suffix?: string }) {
    const [count, setCount] = useState(0);
    const countRef = useRef(0);

    useEffect(() => {
        const startTime = Date.now();
        const startValue = countRef.current;
        const endValue = value;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * easeOut;

            setCount(Math.round(currentValue));
            countRef.current = Math.round(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

export default function Dashboard({
    stats,
    recentActivity = [],
    activityByDay = [],
    productsByCategory = [],
    clientsByType = [],
    quotationsByStatus = [],
    quotationsTrend = [],
    topClients = [],
    quotationsByMonth = [],
    monthlyStats,
    performanceMetrics,
    users = [],
    filters,
}: Props) {
    const { auth } = usePage().props as any;

    // Filter state
    const [selectedUserId, setSelectedUserId] = useState<string>(filters?.user_id?.toString() || '');
    const [selectedDateRange, setSelectedDateRange] = useState<string>(filters?.date_range || '');
    const [customDateFrom, setCustomDateFrom] = useState<string>(filters?.date_from || '');
    const [customDateTo, setCustomDateTo] = useState<string>(filters?.date_to || '');

    const dateRangeOptions = [
        { value: '', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last_7_days', label: 'Last 7 Days' },
        { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'this_month', label: 'This Month' },
        { value: 'last_month', label: 'Last Month' },
        { value: 'this_quarter', label: 'This Quarter' },
        { value: 'last_quarter', label: 'Last Quarter' },
        { value: 'this_year', label: 'This Year' },
        { value: 'last_year', label: 'Last Year' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        if (selectedUserId) {
            params.user_id = selectedUserId;
        }
        if (selectedDateRange) {
            params.date_range = selectedDateRange;
        }
        if (selectedDateRange === 'custom') {
            if (customDateFrom) params.date_from = customDateFrom;
            if (customDateTo) params.date_to = customDateTo;
        }

        router.get(route('dashboard'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [selectedUserId, selectedDateRange, customDateFrom, customDateTo]);

    const clearFilters = () => {
        setSelectedUserId('');
        setSelectedDateRange('');
        setCustomDateFrom('');
        setCustomDateTo('');
        router.get(route('dashboard'), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Auto apply filters on change (except for custom dates)
    useEffect(() => {
        if (selectedDateRange !== 'custom') {
            applyFilters();
        }
    }, [selectedUserId, selectedDateRange]);

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'created': return 'bg-emerald-100 text-emerald-700';
            case 'updated': return 'bg-blue-100 text-blue-700';
            case 'deleted': return 'bg-red-100 text-red-700';
            case 'login': return 'bg-violet-100 text-violet-700';
            case 'logout': return 'bg-slate-100 text-slate-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Activity Line Chart Data
    const activityChartData = {
        labels: activityByDay.map(d => d.day || d.date),
        datasets: [
            {
                label: 'Activities',
                data: activityByDay.map(d => d.count),
                fill: true,
                borderColor: 'rgb(139, 92, 246)',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                pointBackgroundColor: 'rgb(139, 92, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    };

    // Quotations by Month Bar Chart
    const quotationsMonthlyChartData = {
        labels: quotationsByMonth.map(d => d.short),
        datasets: [
            {
                label: 'Created',
                data: quotationsByMonth.map(d => d.created),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 8,
                borderSkipped: false,
            },
            {
                label: 'Accepted',
                data: quotationsByMonth.map(d => d.accepted),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    // Quotations Status Doughnut Chart
    const quotationsStatusChartData = {
        labels: quotationsByStatus.map(d => d.status),
        datasets: [
            {
                data: quotationsByStatus.map(d => d.count),
                backgroundColor: quotationsByStatus.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 10,
            },
        ],
    };

    // Products by Category Horizontal Bar
    const productsCategoryChartData = {
        labels: productsByCategory.map(d => d.category || 'Other'),
        datasets: [
            {
                label: 'Products',
                data: productsByCategory.map(d => d.count),
                backgroundColor: [
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                ],
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 13, weight: 'bold' as const },
                bodyFont: { size: 12 },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#94a3b8' },
            },
            y: {
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: { font: { size: 11 }, color: '#94a3b8' },
            },
        },
    };

    const barChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            legend: { display: true, position: 'top' as const, labels: { usePointStyle: true, padding: 20 } },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
            },
        },
    };

    const horizontalBarOptions = {
        ...chartOptions,
        indexAxis: 'y' as const,
        scales: {
            x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b' } },
        },
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Welcome Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 rounded-full bg-white/10 blur-3xl" />

                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <p className="text-violet-200 text-sm font-medium mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <h1 className="text-4xl font-bold mb-3">
                                    Welcome back, {auth.user?.name?.split(' ')[0]}!
                                </h1>
                                <p className="text-violet-200 max-w-xl text-lg">
                                    {stats?.pending_quotations ? (
                                        <>You have <span className="text-white font-semibold">{stats.pending_quotations} pending quotations</span> awaiting action.</>
                                    ) : (
                                        <></>
                                    )}
                                </p>

                                {/* Quick Stats in Hero */}
                                <div className="flex flex-wrap gap-6 mt-6">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                                        <p className="text-violet-200 text-xs uppercase tracking-wider">This Month</p>
                                        <p className="text-2xl font-bold">
                                            <AnimatedCounter value={monthlyStats?.new_quotations || 0} />
                                        </p>
                                        <p className="text-violet-200 text-sm">New Quotations</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                                        <p className="text-violet-200 text-xs uppercase tracking-wider">Revenue</p>
                                        <p className="text-2xl font-bold">{formatCurrency(monthlyStats?.month_value || 0)}</p>
                                        <p className="text-violet-200 text-sm">Accepted Value</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 border border-white/20">
                                        <p className="text-violet-200 text-xs uppercase tracking-wider">Conversion</p>
                                        <p className="text-2xl font-bold">
                                            <AnimatedCounter value={stats?.conversion_rate || 0} suffix="%" />
                                        </p>
                                        <p className="text-violet-200 text-sm">Success Rate</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {hasPermission('quotations.create') && (
                                    <Link
                                        href={route('quotations.create')}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-violet-700 font-semibold rounded-2xl hover:bg-violet-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Quotation
                                    </Link>
                                )}
                                {hasPermission('clients.create') && (
                                    <Link
                                        href={route('clients.create')}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Add Client
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modern Filters Section */}
                <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Filter Icon & Label */}
                        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">Dashboard Filters</p>
                                <p className="text-xs text-slate-500">Filter stats by user & date</p>
                            </div>
                        </div>

                        {/* User Filter */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-3 min-w-[200px]">
                                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="flex-1 bg-transparent border-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer pr-8"
                                >
                                    <option value="">All Users</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id.toString()}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date Range Filter */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-3 min-w-[200px]">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <select
                                    value={selectedDateRange}
                                    onChange={(e) => setSelectedDateRange(e.target.value)}
                                    className="flex-1 bg-transparent border-0 text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer pr-8"
                                >
                                    {dateRangeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Custom Date Range */}
                        {selectedDateRange === 'custom' && (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-200">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500">From</span>
                                        <input
                                            type="date"
                                            value={customDateFrom}
                                            onChange={(e) => setCustomDateFrom(e.target.value)}
                                            className="bg-transparent border-0 text-sm font-medium text-slate-700 focus:ring-0"
                                        />
                                    </div>
                                </div>
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="relative bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500">To</span>
                                        <input
                                            type="date"
                                            value={customDateTo}
                                            onChange={(e) => setCustomDateTo(e.target.value)}
                                            className="bg-transparent border-0 text-sm font-medium text-slate-700 focus:ring-0"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={applyFilters}
                                    className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                                >
                                    Apply
                                </button>
                            </div>
                        )}

                        {/* Clear & Active Filters */}
                        <div className="flex items-center gap-3 ml-auto">
                            {(selectedUserId || selectedDateRange) && (
                                <>
                                    <div className="flex items-center gap-2">
                                        {selectedUserId && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-100 text-violet-700 rounded-full">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                {users.find(u => u.id.toString() === selectedUserId)?.name}
                                            </span>
                                        )}
                                        {selectedDateRange && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {dateRangeOptions.find(d => d.value === selectedDateRange)?.label}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={clearFilters}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Clear All
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Performance & Quick Actions - Moved after filters */}
                <div className="grid gap-4 lg:grid-cols-4">
                    {/* Week Performance */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-sm">This Week</h3>
                            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                (performanceMetrics?.week_change || 0) >= 0
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-red-500/20 text-red-200'
                            }`}>
                                {(performanceMetrics?.week_change || 0) >= 0 ? '+' : ''}{performanceMetrics?.week_change || 0}%
                            </div>
                        </div>
                        <p className="text-3xl font-bold mb-0.5">
                            <AnimatedCounter value={performanceMetrics?.quotations_this_week || 0} />
                        </p>
                        <p className="text-indigo-200 text-xs">Quotations created</p>
                        <p className="text-indigo-300/70 text-xs mt-1">vs {performanceMetrics?.quotations_last_week || 0} last week</p>
                    </div>

                    {/* Clients by Type */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <h3 className="font-semibold text-slate-900 text-sm mb-3">Clients by Type</h3>
                        {clientsByType.length > 0 ? (
                            <div className="space-y-2">
                                {clientsByType.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                item.type === 'Company' ? 'bg-blue-100' : 'bg-violet-100'
                                            }`}>
                                                {item.type === 'Company' ? (
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="font-medium text-slate-700 text-sm">{item.type}</span>
                                        </div>
                                        <span className="text-xl font-bold text-slate-900">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-slate-400 py-2 text-sm">No data</p>
                        )}
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <h3 className="font-semibold text-slate-900 text-sm mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {hasPermission('quotations.view') && (
                                <Link
                                    href={route('quotations.index')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-violet-100 group-hover:bg-violet-200 group-hover:scale-110 transition-all">
                                        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700">Quotations</span>
                                </Link>
                            )}
                            {hasPermission('clients.view') && (
                                <Link
                                    href={route('clients.index')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 group-hover:scale-110 transition-all">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700">Clients</span>
                                </Link>
                            )}
                            {hasPermission('products.view') && (
                                <Link
                                    href={route('products.index')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 group-hover:scale-110 transition-all">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700">Products</span>
                                </Link>
                            )}
                            {hasPermission('users.view') && (
                                <Link
                                    href={route('users.index')}
                                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 group-hover:scale-110 transition-all">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-slate-700">Users</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Stats Cards */}
                {stats && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Total Clients Card */}
                        <Link
                            href={hasPermission('clients.view') ? route('clients.index') : '#'}
                            className="group relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-lg hover:border-violet-200 transition-all hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-3 bg-violet-100 rounded-xl group-hover:bg-violet-200 transition-colors">
                                        <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                        +{stats.new_clients_this_month} this month
                                    </span>
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Total Clients</h3>
                                <p className="text-3xl font-bold text-slate-900">
                                    <AnimatedCounter value={stats.total_clients} />
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{stats.active_clients} active</p>
                            </div>
                        </Link>

                        {/* Products Card */}
                        <Link
                            href={hasPermission('products.view') ? route('products.index') : '#'}
                            className="group relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-lg hover:border-emerald-200 transition-all hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
                                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    {stats.low_stock_products > 0 && (
                                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                                            {stats.low_stock_products} low stock
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Total Products</h3>
                                <p className="text-3xl font-bold text-slate-900">
                                    <AnimatedCounter value={stats.total_products} />
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{stats.active_products} active</p>
                            </div>
                        </Link>

                        {/* Quotations Card */}
                        <Link
                            href={hasPermission('quotations.view') ? route('quotations.index') : '#'}
                            className="group relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-lg hover:border-blue-200 transition-all hover:-translate-y-1"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    {stats.pending_quotations > 0 && (
                                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full animate-pulse">
                                            {stats.pending_quotations} pending
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 mb-1">Quotations</h3>
                                <p className="text-3xl font-bold text-slate-900">
                                    <AnimatedCounter value={stats.total_quotations} />
                                </p>
                                <p className="text-sm text-slate-500 mt-1">{stats.sent_quotations} sent</p>
                            </div>
                        </Link>

                        {/* Revenue Card */}
                        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
                            <div className="relative text-white">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs font-medium text-white/80 bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                                        {stats.accepted_quotations} won
                                    </span>
                                </div>
                                <h3 className="text-sm font-medium text-white/80 mb-1">Total Revenue</h3>
                                <p className="text-2xl font-bold">{formatCurrency(stats.quotations_value)}</p>
                                <p className="text-sm text-white/80 mt-1">{formatCurrency(stats.pending_value)} pending</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Row 1 */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Activity Trend Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Activity Overview</h3>
                                <p className="text-sm text-slate-500">System activity over the last 14 days</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-3 h-3 rounded-full bg-violet-500" />
                                <span className="text-slate-600">Activities</span>
                            </div>
                        </div>
                        <div className="h-72">
                            {activityByDay.length > 0 ? (
                                <Line data={activityChartData} options={chartOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <p className="font-medium">No activity data</p>
                                        <p className="text-sm mt-1">Activities will appear here</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quotation Status Donut */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Quotation Status</h3>
                                <p className="text-sm text-slate-500">Distribution by status</p>
                            </div>
                        </div>
                        <div className="h-52 relative">
                            {quotationsByStatus.length > 0 ? (
                                <>
                                    <Doughnut data={quotationsStatusChartData} options={doughnutOptions} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-slate-900">{stats?.total_quotations || 0}</p>
                                            <p className="text-xs text-slate-500">Total</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    <p className="text-sm">No quotation data</p>
                                </div>
                            )}
                        </div>
                        {/* Status Legend */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {quotationsByStatus.slice(0, 6).map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-slate-600 truncate">{item.status}</span>
                                    <span className="text-slate-400 ml-auto">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Monthly Quotations Bar Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Quotations Trend</h3>
                                <p className="text-sm text-slate-500">Created vs Accepted (last 6 months)</p>
                            </div>
                            {hasPermission('quotations.view') && (
                                <Link href={route('quotations.index')} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                                    View All
                                </Link>
                            )}
                        </div>
                        <div className="h-72">
                            {quotationsByMonth.length > 0 ? (
                                <Bar data={quotationsMonthlyChartData} options={barChartOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    <p className="text-sm">No data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Products by Category */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Products by Category</h3>
                                <p className="text-sm text-slate-500">Top categories by product count</p>
                            </div>
                            {hasPermission('products.view') && (
                                <Link href={route('products.index')} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                                    View All
                                </Link>
                            )}
                        </div>
                        <div className="h-72">
                            {productsByCategory.length > 0 ? (
                                <Bar data={productsCategoryChartData} options={horizontalBarOptions} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-400">
                                    <div className="text-center">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <p className="font-medium">No products yet</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Top Clients */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Top Clients</h3>
                                <p className="text-sm text-slate-500">By quotation value</p>
                            </div>
                            {hasPermission('clients.view') && (
                                <Link href={route('clients.index')} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                                    View All
                                </Link>
                            )}
                        </div>
                        {topClients.length > 0 ? (
                            <div className="space-y-4">
                                {topClients.map((client, index) => (
                                    <div key={client.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                            index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500' :
                                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                                            'bg-gradient-to-br from-violet-500 to-purple-600'
                                        }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{client.name}</p>
                                            <p className="text-sm text-slate-500">{client.quotation_count} quotations</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-slate-900">{formatCurrency(client.total_value)}</p>
                                            <p className="text-xs text-emerald-600">{formatCurrency(client.accepted_value)} won</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <p className="text-sm">No clients yet</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                                <p className="text-sm text-slate-500">Latest system events</p>
                            </div>
                            {hasPermission('activity-logs.view') && (
                                <Link href={route('activity-logs.index')} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                                    View All
                                </Link>
                            )}
                        </div>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivity.slice(0, 8).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                            <span className="text-sm font-bold text-white">
                                                {activity.user_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-medium text-slate-900">{activity.user_name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                                                    {activity.action}
                                                </span>
                                                {activity.model_type && (
                                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                        {activity.model_type}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">
                                                {activity.description || `${activity.action} a ${activity.model_type}`}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap">
                                            {activity.created_at}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
