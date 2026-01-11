import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ActivityLog {
    id: number;
    log_name: string;
    event: string;
    description: string | null;
    subject_type: string | null;
    subject_type_full: string | null;
    subject_id: number | null;
    causer_id: number | null;
    causer_name: string;
    causer_email: string | null;
    causer_role: string | null;
    module: string | null;
    properties: Record<string, any>;
    changes: {
        old?: Record<string, any>;
        new?: Record<string, any>;
    };
    has_changes: boolean;
    ip_address: string | null;
    user_agent: string | null;
    url: string | null;
    method: string | null;
    created_at: string;
    created_at_human: string;
}

interface PaginatedLogs {
    data: ActivityLog[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface SubjectType {
    value: string;
    label: string;
}

interface Props {
    logs: PaginatedLogs;
    users: User[];
    events: string[];
    subjectTypes: SubjectType[];
    modules: string[];
    filters: {
        user_id?: string;
        event?: string;
        subject_type?: string;
        module?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function Index({ logs, users, events, subjectTypes, modules, filters }: Props) {
    const { auth } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [detailModal, setDetailModal] = useState<ActivityLog | null>(null);

    // Track if date filters have been explicitly set by user
    const [datesModified, setDatesModified] = useState({
        date_from: !!filters.date_from,
        date_to: !!filters.date_to,
    });

    const [filterValues, setFilterValues] = useState({
        user_id: filters.user_id || '',
        event: filters.event || '',
        subject_type: filters.subject_type || '',
        module: filters.module || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        search: filters.search || '',
    });

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        Object.entries(filterValues).forEach(([key, value]) => {
            // Only include date filters if they've been explicitly modified
            if (key === 'date_from' || key === 'date_to') {
                if (value && datesModified[key as 'date_from' | 'date_to']) {
                    params[key] = value;
                }
            } else if (value) {
                params[key] = value;
            }
        });
        router.get(route('activity-logs.index'), params, { preserveState: true });
    };

    const clearFilters = () => {
        setFilterValues({
            user_id: '',
            event: '',
            subject_type: '',
            module: '',
            date_from: '',
            date_to: '',
            search: '',
        });
        setDatesModified({ date_from: false, date_to: false });
        router.get(route('activity-logs.index'));
    };

    const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
        setFilterValues({ ...filterValues, [field]: value });
        setDatesModified({ ...datesModified, [field]: true });
    };

    const hasActiveFilters = Object.values(filters).some((v) => v);

    // Close modal on ESC key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && detailModal) {
                setDetailModal(null);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [detailModal]);

    const getEventColor = (event: string) => {
        switch (event) {
            case 'created':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'updated':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'deleted':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'login':
                return 'bg-violet-100 text-violet-800 border-violet-200';
            case 'logout':
                return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'exported':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'sent':
                return 'bg-cyan-100 text-cyan-800 border-cyan-200';
            case 'viewed':
                return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEventIcon = (event: string) => {
        switch (event) {
            case 'created':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                );
            case 'updated':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                );
            case 'deleted':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                );
            case 'login':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                );
            case 'logout':
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
        }
    };

    const getMethodBadge = (method: string | null) => {
        if (!method) return null;
        const colors: Record<string, string> = {
            GET: 'bg-blue-100 text-blue-700',
            POST: 'bg-green-100 text-green-700',
            PUT: 'bg-amber-100 text-amber-700',
            PATCH: 'bg-orange-100 text-orange-700',
            DELETE: 'bg-red-100 text-red-700',
        };
        return colors[method] || 'bg-gray-100 text-gray-700';
    };

    const formatChanges = (changes: { old?: Record<string, any>; new?: Record<string, any> }) => {
        if (!changes || (!changes.old && !changes.new)) return [];

        const result: { field: string; old: any; new: any }[] = [];
        const newValues = changes.new || {};
        const oldValues = changes.old || {};

        Object.keys(newValues).forEach((key) => {
            if (key !== 'updated_at' && key !== 'created_at') {
                result.push({
                    field: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    old: oldValues[key] ?? '-',
                    new: newValues[key] ?? '-',
                });
            }
        });

        return result;
    };

    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Activity Logs" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Activity Logs</h1>
                        <p className="text-slate-500 mt-1">Complete audit trail of all system activities</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                showFilters || hasActiveFilters
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-1 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                                    Active
                                </span>
                            )}
                        </button>
                        {hasPermission('activity-logs.export') && (
                            <a
                                href={route('activity-logs.export', filters)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export CSV
                            </a>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <form onSubmit={handleFilter}>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Search</label>
                                    <input
                                        type="text"
                                        value={filterValues.search}
                                        onChange={(e) => setFilterValues({ ...filterValues, search: e.target.value })}
                                        placeholder="Search in description..."
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">User</label>
                                    <select
                                        value={filterValues.user_id}
                                        onChange={(e) => setFilterValues({ ...filterValues, user_id: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    >
                                        <option value="">All Users</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Event</label>
                                    <select
                                        value={filterValues.event}
                                        onChange={(e) => setFilterValues({ ...filterValues, event: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    >
                                        <option value="">All Events</option>
                                        {events.map((event) => (
                                            <option key={event} value={event}>
                                                {event.charAt(0).toUpperCase() + event.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Module</label>
                                    <select
                                        value={filterValues.module}
                                        onChange={(e) => setFilterValues({ ...filterValues, module: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    >
                                        <option value="">All Modules</option>
                                        {modules.map((module) => (
                                            <option key={module} value={module}>
                                                {module.charAt(0).toUpperCase() + module.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Type</label>
                                    <select
                                        value={filterValues.subject_type}
                                        onChange={(e) => setFilterValues({ ...filterValues, subject_type: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    >
                                        <option value="">All Types</option>
                                        {subjectTypes.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date From</label>
                                    <input
                                        type="date"
                                        value={filterValues.date_from || getTodayDate()}
                                        onChange={(e) => handleDateChange('date_from', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                            datesModified.date_from ? 'border-violet-400 bg-violet-50' : 'border-slate-300'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Date To</label>
                                    <input
                                        type="date"
                                        value={filterValues.date_to || getTodayDate()}
                                        onChange={(e) => handleDateChange('date_to', e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                            datesModified.date_to ? 'border-violet-400 bg-violet-50' : 'border-slate-300'
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                                >
                                    Clear All
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-slate-900">{logs.total}</div>
                        <div className="text-sm text-slate-500">Total Activities</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-emerald-600">
                            {logs.data.filter(l => l.event === 'created').length}
                        </div>
                        <div className="text-sm text-slate-500">Created (this page)</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-blue-600">
                            {logs.data.filter(l => l.event === 'updated').length}
                        </div>
                        <div className="text-sm text-slate-500">Updated (this page)</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="text-2xl font-bold text-red-600">
                            {logs.data.filter(l => l.event === 'deleted').length}
                        </div>
                        <div className="text-sm text-slate-500">Deleted (this page)</div>
                    </div>
                </div>

                {/* Activity Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Performed By
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Action
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Module / Subject
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {logs.data.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </div>
                                            <div className="text-xs text-slate-400">{log.created_at_human}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                                    {log.causer_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-slate-900">{log.causer_name}</div>
                                                    <div className="text-xs text-slate-500">{log.causer_email || 'System Action'}</div>
                                                    {log.causer_role && (
                                                        <div className="text-xs text-violet-600">{log.causer_role}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getEventColor(log.event)}`}>
                                                {getEventIcon(log.event)}
                                                {log.event.charAt(0).toUpperCase() + log.event.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">
                                                {log.module ? log.module.charAt(0).toUpperCase() + log.module.slice(1) : '-'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {log.subject_type && (
                                                    <span className="text-slate-600">{log.subject_type}</span>
                                                )}
                                                {log.subject_id && (
                                                    <span className="text-slate-400"> #{log.subject_id}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate text-sm text-slate-600" title={log.description || ''}>
                                                {log.description || '-'}
                                            </div>
                                            {log.ip_address && (
                                                <div className="text-xs text-slate-400 mt-1">
                                                    IP: {log.ip_address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => setDetailModal(log)}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                                title="View Details"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {logs.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-slate-500 font-medium">No activity logs found</p>
                                            <p className="text-slate-400 text-sm mt-1">Activities will appear here as they occur</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-sm text-slate-600">
                                    Showing <span className="font-medium">{(logs.current_page - 1) * logs.per_page + 1}</span> to{' '}
                                    <span className="font-medium">{Math.min(logs.current_page * logs.per_page, logs.total)}</span> of{' '}
                                    <span className="font-medium">{logs.total}</span> results
                                </div>
                                <div className="flex gap-1">
                                    {logs.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                                link.active
                                                    ? 'bg-violet-600 text-white'
                                                    : link.url
                                                    ? 'text-slate-700 hover:bg-slate-200'
                                                    : 'text-slate-400 cursor-not-allowed'
                                            }`}
                                            preserveState
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {detailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-purple-600">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">Activity Details</h3>
                                        <p className="text-sm text-white/80">Log ID: #{detailModal.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDetailModal(null)}
                                    className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            {/* Who, What, When Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase mb-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Performed By
                                    </div>
                                    <div className="font-semibold text-slate-900">{detailModal.causer_name}</div>
                                    <div className="text-sm text-slate-500">{detailModal.causer_email || 'System'}</div>
                                    {detailModal.causer_role && (
                                        <div className="text-xs text-violet-600 mt-1">{detailModal.causer_role}</div>
                                    )}
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase mb-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Action
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getEventColor(detailModal.event)}`}>
                                        {getEventIcon(detailModal.event)}
                                        {detailModal.event.charAt(0).toUpperCase() + detailModal.event.slice(1)}
                                    </span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase mb-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        When
                                    </div>
                                    <div className="font-semibold text-slate-900">
                                        {new Date(detailModal.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {new Date(detailModal.created_at).toLocaleTimeString()}
                                    </div>
                                    <div className="text-xs text-slate-400">{detailModal.created_at_human}</div>
                                </div>
                            </div>

                            {/* Subject & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase mb-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        Subject
                                    </div>
                                    <div className="font-semibold text-slate-900">
                                        {detailModal.module ? detailModal.module.charAt(0).toUpperCase() + detailModal.module.slice(1) : 'N/A'}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                        {detailModal.subject_type} {detailModal.subject_id && `#${detailModal.subject_id}`}
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase mb-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        Description
                                    </div>
                                    <div className="text-slate-700">{detailModal.description || 'No description provided'}</div>
                                </div>
                            </div>

                            {/* Technical Details */}
                            <div className="bg-slate-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase mb-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                    </svg>
                                    Technical Details
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-slate-500 text-xs">IP Address</div>
                                        <div className="font-mono text-slate-900">{detailModal.ip_address || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 text-xs">Method</div>
                                        {detailModal.method ? (
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getMethodBadge(detailModal.method)}`}>
                                                {detailModal.method}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-slate-500 text-xs">URL</div>
                                        <div className="font-mono text-slate-900 text-xs truncate" title={detailModal.url || ''}>
                                            {detailModal.url || '-'}
                                        </div>
                                    </div>
                                </div>
                                {detailModal.user_agent && (
                                    <div className="mt-3 pt-3 border-t border-slate-200">
                                        <div className="text-slate-500 text-xs mb-1">User Agent</div>
                                        <div className="font-mono text-xs text-slate-600 break-all">{detailModal.user_agent}</div>
                                    </div>
                                )}
                            </div>

                            {/* Changes Section */}
                            {detailModal.has_changes && formatChanges(detailModal.changes).length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Field Changes
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Field</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-red-600 uppercase">Previous Value</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-600 uppercase">New Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {formatChanges(detailModal.changes).map((change, i) => (
                                                    <tr key={i} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                                            {change.field}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="px-2 py-1 bg-red-50 text-red-700 rounded font-mono text-xs">
                                                                {formatValue(change.old)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-mono text-xs">
                                                                {formatValue(change.new)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Properties Section */}
                            {Object.keys(detailModal.properties || {}).length > 0 && (
                                <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Additional Properties
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                                            {JSON.stringify(detailModal.properties, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setDetailModal(null)}
                                className="px-6 py-2.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
