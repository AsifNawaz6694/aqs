import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

interface Stats {
    total_users: number;
    active_users: number;
    total_products: number;
    active_products: number;
    low_stock_products: number;
    total_clients: number;
    active_clients: number;
    total_quotations?: number;
    pending_quotations?: number;
    accepted_quotations?: number;
    quotations_value?: number;
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
}

interface MonthlyStats {
    new_users: number;
    new_clients: number;
    new_products: number;
}

interface Props {
    stats?: Stats;
    recentActivity?: ActivityItem[];
    activityByDay?: ChartData[];
    productsByCategory?: ChartData[];
    clientsByType?: ChartData[];
    usersByRole?: ChartData[];
    activityByAction?: ChartData[];
    monthlyStats?: MonthlyStats;
}

export default function Dashboard({
    stats,
    recentActivity = [],
    activityByDay = [],
    productsByCategory = [],
    clientsByType = [],
    usersByRole = [],
    activityByAction = [],
    monthlyStats,
}: Props) {
    const { auth } = usePage().props as any;

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'created':
                return 'bg-emerald-100 text-emerald-700';
            case 'updated':
                return 'bg-blue-100 text-blue-700';
            case 'deleted':
                return 'bg-red-100 text-red-700';
            case 'login':
                return 'bg-violet-100 text-violet-700';
            default:
                return 'bg-slate-100 text-slate-700';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const maxActivityCount = Math.max(...activityByDay.map(d => d.count), 1);
    const maxProductCount = Math.max(...productsByCategory.map(d => d.count), 1);

    const statCards = [
        {
            title: 'Total Clients',
            value: stats?.total_clients || 0,
            subtext: `${stats?.active_clients || 0} active`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            color: 'violet',
            href: hasPermission('clients.view') ? route('clients.index') : null,
        },
        {
            title: 'Total Products',
            value: stats?.total_products || 0,
            subtext: stats?.low_stock_products ? `${stats.low_stock_products} low stock` : 'All stocked',
            subtextColor: stats?.low_stock_products ? 'text-amber-600' : 'text-emerald-600',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'emerald',
            href: hasPermission('products.view') ? route('products.index') : null,
        },
        {
            title: 'Quotations',
            value: stats?.total_quotations || 0,
            subtext: `${stats?.pending_quotations || 0} pending`,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'blue',
            href: hasPermission('quotations.view') ? route('quotations.index') : null,
        },
        {
            title: 'Quotation Value',
            value: formatCurrency(stats?.quotations_value || 0),
            subtext: `${stats?.accepted_quotations || 0} accepted`,
            subtextColor: 'text-emerald-600',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'amber',
            href: hasPermission('quotations.view') ? route('quotations.index') : null,
            isLarge: true,
        },
    ];

    const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
        violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200' },
        emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' },
        blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
        amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' },
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* Welcome Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-xl">
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <p className="text-violet-200 text-sm font-medium mb-1">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <h1 className="text-3xl font-bold mb-2">
                                    Welcome back, {auth.user?.name?.split(' ')[0]}!
                                </h1>
                                <p className="text-violet-200 max-w-xl">
                                    Here's what's happening with your quotation system. You have {stats?.pending_quotations || 0} pending quotations awaiting action.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {hasPermission('quotations.create') && (
                                    <Link
                                        href={route('quotations.create')}
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg"
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
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
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

                {/* Stats Cards */}
                {stats && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {statCards.map((card, index) => {
                            const colors = colorClasses[card.color];
                            const CardWrapper = card.href ? Link : 'div';
                            return (
                                <CardWrapper
                                    key={index}
                                    {...(card.href ? { href: card.href } : {})}
                                    className={`relative overflow-hidden bg-white rounded-2xl border ${colors.border} p-6 shadow-sm transition-all hover:shadow-md ${card.href ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-slate-500">{card.title}</p>
                                            <p className={`mt-2 font-bold text-slate-900 ${card.isLarge ? 'text-2xl' : 'text-3xl'}`}>
                                                {card.value}
                                            </p>
                                            <p className={`mt-1 text-sm ${card.subtextColor || 'text-slate-500'}`}>
                                                {card.subtext}
                                            </p>
                                        </div>
                                        <div className={`p-3 rounded-xl ${colors.bg}`}>
                                            <div className={colors.icon}>{card.icon}</div>
                                        </div>
                                    </div>
                                    {card.href && (
                                        <div className="absolute bottom-4 right-4">
                                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    )}
                                </CardWrapper>
                            );
                        })}
                    </div>
                )}

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Activity Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Activity Overview</h3>
                            <span className="text-sm text-slate-500">Last 7 days</span>
                        </div>
                        {activityByDay.length > 0 ? (
                            <div className="flex items-end gap-3 h-52">
                                {activityByDay.map((day, index) => (
                                    <div key={index} className="flex-1 flex flex-col items-center group">
                                        <div className="relative w-full">
                                            <div
                                                className="w-full rounded-lg bg-gradient-to-t from-violet-500 to-purple-500 transition-all group-hover:from-violet-600 group-hover:to-purple-600 shadow-sm"
                                                style={{
                                                    height: `${Math.max((day.count / maxActivityCount) * 180, 8)}px`,
                                                }}
                                            />
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {day.count} activities
                                            </div>
                                        </div>
                                        <span className="mt-3 text-xs font-medium text-slate-500">{day.date}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-52 text-slate-400">
                                <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <p className="text-sm">No activity data available</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Products by Category */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Products by Category</h3>
                            {hasPermission('products.view') && (
                                <Link href={route('products.index')} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                                    View All
                                </Link>
                            )}
                        </div>
                        {productsByCategory.length > 0 ? (
                            <div className="space-y-4">
                                {productsByCategory.slice(0, 6).map((item, index) => {
                                    const percentage = (item.count / maxProductCount) * 100;
                                    const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                                    return (
                                        <div key={index} className="group">
                                            <div className="flex justify-between text-sm mb-1.5">
                                                <span className="font-medium text-slate-700">{item.category || 'Uncategorized'}</span>
                                                <span className="text-slate-500">{item.count} products</span>
                                            </div>
                                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all group-hover:opacity-80 ${colors[index % colors.length]}`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-52 text-slate-400">
                                <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-sm">No product data available</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                            {hasPermission('activity-logs.view') && (
                                <Link href={route('activity-logs.index')} className="text-sm text-violet-600 hover:text-violet-800 font-medium">
                                    View All
                                </Link>
                            )}
                        </div>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.slice(0, 8).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {activity.user_name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-slate-900">{activity.user_name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                                                    {activity.action}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">
                                                {activity.description || `${activity.action} a ${activity.model_type}`}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 text-xs text-slate-400">
                                            {activity.created_at}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12 text-slate-400">
                                <div className="text-center">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm">No recent activity</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Stats & Links */}
                    <div className="space-y-6">
                        {/* Clients by Type */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Clients by Type</h3>
                            {clientsByType.length > 0 ? (
                                <div className="flex justify-around">
                                    {clientsByType.map((item, index) => (
                                        <div key={index} className="text-center">
                                            <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${
                                                item.type === 'Company' ? 'bg-blue-100' : 'bg-violet-100'
                                            }`}>
                                                <span className={`text-2xl font-bold ${
                                                    item.type === 'Company' ? 'text-blue-600' : 'text-violet-600'
                                                }`}>
                                                    {item.count}
                                                </span>
                                            </div>
                                            <p className="mt-2 text-sm font-medium text-slate-600">{item.type}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-4">No data</p>
                            )}
                        </div>

                        {/* Quick Links */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {hasPermission('quotations.view') && (
                                    <Link
                                        href={route('quotations.index')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors group"
                                    >
                                        <div className="p-2 rounded-lg bg-violet-100 group-hover:bg-violet-200 transition-colors">
                                            <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-violet-700">Quotations</span>
                                    </Link>
                                )}
                                {hasPermission('clients.view') && (
                                    <Link
                                        href={route('clients.index')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
                                    >
                                        <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-blue-700">Clients</span>
                                    </Link>
                                )}
                                {hasPermission('products.view') && (
                                    <Link
                                        href={route('products.index')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
                                    >
                                        <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-emerald-700">Products</span>
                                    </Link>
                                )}
                                {hasPermission('users.view') && (
                                    <Link
                                        href={route('users.index')}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group"
                                    >
                                        <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-medium text-amber-700">Users</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
