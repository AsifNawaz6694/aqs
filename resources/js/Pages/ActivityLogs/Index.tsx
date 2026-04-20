import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MultiSelect from '@/Components/MultiSelect';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/* ─── Types ─── */

interface User { id: number; name: string; email: string; }
interface SubjectType { value: string; label: string; }

interface ActivityLog {
    id: number; log_name: string; event: string; description: string | null;
    subject_type: string | null; subject_type_full: string | null; subject_id: number | null;
    causer_id: number | null; causer_name: string; causer_email: string | null; causer_role: string | null;
    module: string | null; properties: Record<string, any>; changes: { old?: Record<string, any>; new?: Record<string, any> };
    has_changes: boolean; ip_address: string | null; user_agent: string | null; url: string | null; method: string | null;
    created_at: string; created_at_human: string;
}

interface PaginatedLogs {
    data: ActivityLog[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number; last_page: number; per_page: number; total: number;
}

interface PendingJob {
    id: number; queue: string; job_class: string; job_class_full: string;
    attempts: number; is_reserved: boolean; created_at: string; available_at: string; reserved_at: string | null;
}

interface FailedJob {
    id: number; uuid: string; queue: string; job_class: string; job_class_full: string;
    exception_summary: string; exception_full: string; failed_at: string;
}

interface JobStats {
    pending_count: number; reserved_count: number; failed_count: number;
    pending_jobs: PendingJob[]; failed_jobs: FailedJob[];
}

interface Props {
    logs: PaginatedLogs; users: User[]; events: string[]; subjectTypes: SubjectType[]; modules: string[];
    filters: { user_id?: string; event?: string; subject_type?: string; module?: string; date_from?: string; date_to?: string; search?: string };
    jobStats: JobStats;
}

/* ─── Helpers ─── */

const getTodayDate = () => new Date().toISOString().split('T')[0];

const eventStyles: Record<string, { bg: string; text: string; icon: string }> = {
    created:  { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: 'M12 4v16m8-8H4' },
    updated:  { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    deleted:  { bg: 'bg-red-100', text: 'text-red-700', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
    login:    { bg: 'bg-violet-100', text: 'text-violet-700', icon: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1' },
    logout:   { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' },
    exported: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
    sent:     { bg: 'bg-cyan-100', text: 'text-cyan-700', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
};

const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700', POST: 'bg-green-100 text-green-700',
    PUT: 'bg-amber-100 text-amber-700', PATCH: 'bg-orange-100 text-orange-700', DELETE: 'bg-red-100 text-red-700',
};

function EventBadge({ event }: { event: string }) {
    const s = eventStyles[event] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${s.bg} ${s.text}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
            {event.charAt(0).toUpperCase() + event.slice(1)}
        </span>
    );
}

/* ─── Toast ─── */
interface Toast { id: number; type: 'success' | 'error'; message: string }
let toastId = 0;

/* ─── Component ─── */

export default function Index({ logs, users, events, subjectTypes, modules, filters, jobStats }: Props) {
    const { auth } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [detailModal, setDetailModal] = useState<ActivityLog | null>(null);
    const [exceptionModal, setExceptionModal] = useState<FailedJob | null>(null);
    const [activeTab, setActiveTab] = useState<'logs' | 'pending' | 'failed'>('logs');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const showToast = useCallback((type: Toast['type'], message: string) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const [datesModified, setDatesModified] = useState({ date_from: !!filters.date_from, date_to: !!filters.date_to });
    const [filterValues, setFilterValues] = useState({
        user_id: filters.user_id ? filters.user_id.split(',') : [] as string[],
        event: filters.event ? filters.event.split(',') : [] as string[],
        subject_type: filters.subject_type ? filters.subject_type.split(',') : [] as string[],
        module: filters.module ? filters.module.split(',') : [] as string[],
        date_from: filters.date_from || '', date_to: filters.date_to || '', search: filters.search || '',
    });

    const hasPermission = (p: string) => auth.user?.permissions?.includes(p);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        Object.entries(filterValues).forEach(([key, value]) => {
            if (key === 'date_from' || key === 'date_to') {
                if (value && datesModified[key as 'date_from' | 'date_to']) params[key] = value as string;
            } else if (Array.isArray(value) && value.length > 0) {
                params[key] = value.join(',');
            } else if (value && !Array.isArray(value)) {
                params[key] = value;
            }
        });
        router.get(route('activity-logs.index'), params, { preserveState: true });
    };

    const clearFilters = () => {
        setFilterValues({ user_id: [], event: [], subject_type: [], module: [], date_from: '', date_to: '', search: '' });
        setDatesModified({ date_from: false, date_to: false });
        router.get(route('activity-logs.index'));
    };

    const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
        setFilterValues({ ...filterValues, [field]: value });
        setDatesModified({ ...datesModified, [field]: true });
    };

    const hasActiveFilters = Object.values(filters).some(v => v);
    const activeFilterCount = Object.values(filters).filter(v => v).length;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') { setDetailModal(null); setExceptionModal(null); } };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    /* Job actions */
    const retryJob = async (id: number) => {
        setActionLoading(id);
        try {
            await axios.post(route('jobs.retry', id));
            showToast('success', 'Job pushed back to queue.');
            router.reload({ only: ['jobStats'] });
        } catch (e: any) { showToast('error', e.response?.data?.message || 'Failed to retry.'); }
        finally { setActionLoading(null); }
    };

    const deleteFailedJob = async (id: number) => {
        setActionLoading(id);
        try {
            await axios.delete(route('jobs.delete-failed', id));
            showToast('success', 'Failed job deleted.');
            router.reload({ only: ['jobStats'] });
        } catch (e: any) { showToast('error', e.response?.data?.message || 'Failed to delete.'); }
        finally { setActionLoading(null); }
    };

    const retryAllFailed = async () => {
        try {
            await axios.post(route('jobs.retry-all'));
            showToast('success', 'All failed jobs pushed back to queue.');
            router.reload({ only: ['jobStats'] });
        } catch (e: any) { showToast('error', e.response?.data?.message || 'Failed.'); }
    };

    const flushFailed = async () => {
        if (!confirm('Delete all failed jobs? This cannot be undone.')) return;
        try {
            await axios.post(route('jobs.flush-failed'));
            showToast('success', 'All failed jobs cleared.');
            router.reload({ only: ['jobStats'] });
        } catch (e: any) { showToast('error', e.response?.data?.message || 'Failed.'); }
    };

    const formatChanges = (changes: { old?: Record<string, any>; new?: Record<string, any> }) => {
        if (!changes?.new) return [];
        return Object.keys(changes.new).filter(k => k !== 'updated_at' && k !== 'created_at').map(key => ({
            field: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            old: changes.old?.[key] ?? '-', new: changes.new![key] ?? '-',
        }));
    };

    const formatValue = (v: any): string => {
        if (v === null || v === undefined) return '-';
        if (typeof v === 'boolean') return v ? 'Yes' : 'No';
        if (typeof v === 'object') return JSON.stringify(v, null, 2);
        return String(v);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Activity Logs & Jobs" />

            <div className="space-y-6">

                {/* ═══ HEADER ═══ */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8 text-white">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+PC9zdmc+')] opacity-60" />
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Activity Logs & Job Monitor</h1>
                            <p className="text-violet-200 mt-1">Complete audit trail and background job monitoring</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${showFilters || hasActiveFilters ? 'bg-white text-violet-700 shadow-lg' : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/20'}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                Filters {activeFilterCount > 0 && <span className="bg-white text-violet-700 rounded-full px-2 py-0.5 text-xs font-bold">{activeFilterCount}</span>}
                            </button>
                            {hasPermission('activity-logs.export') && (
                                <a href={route('activity-logs.export', filters)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Export CSV
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ FILTERS ═══ */}
                {showFilters && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-in">
                        <form onSubmit={handleFilter}>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Search</label>
                                    <input type="text" value={filterValues.search} onChange={(e) => setFilterValues({ ...filterValues, search: e.target.value })} placeholder="Search in description..." className="w-full h-11 px-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm" />
                                </div>
                                <MultiSelect label="User" options={users.map(u => ({ value: u.id.toString(), label: u.name }))} value={filterValues.user_id} onChange={val => setFilterValues({ ...filterValues, user_id: val })} placeholder="All Users" searchPlaceholder="Search users..." />
                                <MultiSelect label="Event" options={events.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1), color: eventStyles[e] ? `${eventStyles[e].bg} ${eventStyles[e].text}` : undefined }))} value={filterValues.event} onChange={val => setFilterValues({ ...filterValues, event: val })} placeholder="All Events" />
                                <MultiSelect label="Module" options={modules.map(m => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))} value={filterValues.module} onChange={val => setFilterValues({ ...filterValues, module: val })} placeholder="All Modules" />
                                <MultiSelect label="Subject Type" options={subjectTypes.map(st => ({ value: st.value, label: st.label }))} value={filterValues.subject_type} onChange={val => setFilterValues({ ...filterValues, subject_type: val })} placeholder="All Types" />
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date From</label>
                                    <input type="date" value={filterValues.date_from || getTodayDate()} onChange={(e) => handleDateChange('date_from', e.target.value)} className={`w-full h-11 px-4 border rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${datesModified.date_from ? 'border-violet-400 bg-violet-50' : 'border-slate-300'}`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date To</label>
                                    <input type="date" value={filterValues.date_to || getTodayDate()} onChange={(e) => handleDateChange('date_to', e.target.value)} className={`w-full h-11 px-4 border rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${datesModified.date_to ? 'border-violet-400 bg-violet-50' : 'border-slate-300'}`} />
                                </div>
                            </div>
                            <div className="mt-5 flex items-center justify-between">
                                {hasActiveFilters && <button type="button" onClick={clearFilters} className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors">Clear All Filters</button>}
                                <div className="flex gap-3 ml-auto">
                                    <button type="button" onClick={() => setShowFilters(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
                                    <button type="submit" className="px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25">Apply Filters</button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* ═══ STATS CARDS ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Logs', value: logs.total, icon: '📊', color: 'from-violet-500 to-purple-600' },
                        { label: 'Queue Jobs', value: jobStats.pending_count, icon: '⏳', color: 'from-blue-500 to-indigo-600' },
                        { label: 'Running', value: jobStats.reserved_count, icon: '⚡', color: 'from-emerald-500 to-teal-600' },
                        { label: 'Failed Jobs', value: jobStats.failed_count, icon: '❌', color: jobStats.failed_count > 0 ? 'from-red-500 to-rose-600' : 'from-slate-400 to-slate-500' },
                        { label: 'This Page', value: logs.data.length, icon: '📄', color: 'from-amber-500 to-orange-600' },
                    ].map((stat, i) => (
                        <div key={i} className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 group hover:shadow-lg transition-all duration-300">
                            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full -mr-4 -mt-4 opacity-10 group-hover:opacity-20 group-hover:scale-150 transition-all duration-500`} />
                            <div className="relative">
                                <span className="text-2xl">{stat.icon}</span>
                                <p className="text-2xl font-extrabold text-slate-900 mt-1">{stat.value.toLocaleString()}</p>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ═══ TAB NAVIGATION ═══ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="border-b border-slate-200 px-6">
                        <nav className="flex gap-1 -mb-px">
                            {[
                                { key: 'logs' as const, label: 'Activity Logs', count: logs.total, icon: '📋' },
                                { key: 'pending' as const, label: 'Queue Jobs', count: jobStats.pending_count, icon: '⏳' },
                                { key: 'failed' as const, label: 'Failed Jobs', count: jobStats.failed_count, icon: '❌' },
                            ].map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.key ? 'border-violet-500 text-violet-700 bg-violet-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === tab.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* ═══ TAB: ACTIVITY LOGS ═══ */}
                    {activeTab === 'logs' && (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50/80">
                                        <tr>
                                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">When</th>
                                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event</th>
                                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Module</th>
                                            <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
                                            <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {logs.data.map(log => (
                                            <tr key={log.id} className="hover:bg-violet-50/30 transition-colors group">
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-slate-900">{new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()} &middot; {log.created_at_human}</p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{log.causer_name.charAt(0).toUpperCase()}</div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{log.causer_name}</p>
                                                            {log.causer_role && <p className="text-[10px] text-violet-500 font-medium">{log.causer_role}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap"><EventBadge event={log.event} /></td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <p className="text-sm font-medium text-slate-700">{log.module ? log.module.charAt(0).toUpperCase() + log.module.slice(1) : '-'}</p>
                                                    {log.subject_type && <p className="text-[10px] text-slate-400">{log.subject_type}{log.subject_id ? ` #${log.subject_id}` : ''}</p>}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="max-w-xs truncate text-sm text-slate-600">{log.description || '-'}</p>
                                                    {log.ip_address && <p className="text-[10px] text-slate-400 mt-0.5 font-mono">IP: {log.ip_address}</p>}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <button onClick={() => setDetailModal(log)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center justify-center" title="View Details">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.data.length === 0 && (
                                            <tr><td colSpan={6} className="px-6 py-16 text-center">
                                                <span className="text-4xl block mb-3">📭</span>
                                                <p className="text-slate-500 font-semibold">No activity logs found</p>
                                                <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {logs.last_page > 1 && (
                                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <p className="text-sm text-slate-500">
                                        Showing <span className="font-semibold text-slate-700">{(logs.current_page - 1) * logs.per_page + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(logs.current_page * logs.per_page, logs.total)}</span> of <span className="font-semibold text-slate-700">{logs.total}</span>
                                    </p>
                                    <div className="flex gap-1">
                                        {logs.links.map((link, idx) => (
                                            <Link key={idx} href={link.url || '#'} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${link.active ? 'bg-violet-600 text-white shadow-sm' : link.url ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 cursor-not-allowed'}`} preserveState dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: PENDING JOBS ═══ */}
                    {activeTab === 'pending' && (
                        <div>
                            {jobStats.pending_jobs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50/80">
                                            <tr>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Job</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Queue</th>
                                                <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attempts</th>
                                                <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {jobStats.pending_jobs.map(job => (
                                                <tr key={job.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="px-5 py-3.5 text-sm font-mono text-slate-500">#{job.id}</td>
                                                    <td className="px-5 py-3.5">
                                                        <p className="text-sm font-semibold text-slate-800">{job.job_class}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{job.job_class_full}</p>
                                                    </td>
                                                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold">{job.queue}</span></td>
                                                    <td className="px-5 py-3.5 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${job.attempts > 1 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{job.attempts}</span></td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        {job.is_reserved ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                                                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
                                                                Running
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">Waiting</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm text-slate-500">{job.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-20 text-center">
                                    <span className="text-5xl block mb-4">✅</span>
                                    <p className="text-lg font-semibold text-slate-700">Queue is empty</p>
                                    <p className="text-slate-400 mt-1">All background jobs have been processed</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══ TAB: FAILED JOBS ═══ */}
                    {activeTab === 'failed' && (
                        <div>
                            {jobStats.failed_jobs.length > 0 && (
                                <div className="px-6 py-3 bg-red-50/50 border-b border-red-100 flex items-center justify-between">
                                    <p className="text-sm text-red-700 font-medium">{jobStats.failed_count} failed job{jobStats.failed_count !== 1 ? 's' : ''}</p>
                                    <div className="flex gap-2">
                                        <button onClick={retryAllFailed} className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">Retry All</button>
                                        <button onClick={flushFailed} className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">Clear All</button>
                                    </div>
                                </div>
                            )}
                            {jobStats.failed_jobs.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50/80">
                                            <tr>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Job</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Queue</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Error</th>
                                                <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Failed At</th>
                                                <th className="px-5 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {jobStats.failed_jobs.map(job => (
                                                <tr key={job.id} className="hover:bg-red-50/30 transition-colors group">
                                                    <td className="px-5 py-3.5 text-sm font-mono text-slate-500">#{job.id}</td>
                                                    <td className="px-5 py-3.5">
                                                        <p className="text-sm font-semibold text-slate-800">{job.job_class}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{job.uuid.substring(0, 8)}...</p>
                                                    </td>
                                                    <td className="px-5 py-3.5"><span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold">{job.queue}</span></td>
                                                    <td className="px-5 py-3.5">
                                                        <p className="max-w-sm truncate text-sm text-red-600 font-mono cursor-pointer hover:text-red-800" onClick={() => setExceptionModal(job)} title="Click to view full error">{job.exception_summary}</p>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{job.failed_at}</td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex justify-end gap-1">
                                                            <button onClick={() => retryJob(job.id)} disabled={actionLoading === job.id} className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center disabled:opacity-50" title="Retry">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                            </button>
                                                            <button onClick={() => setExceptionModal(job)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center justify-center" title="View Error">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </button>
                                                            <button onClick={() => deleteFailedJob(job.id)} disabled={actionLoading === job.id} className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center disabled:opacity-50" title="Delete">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-20 text-center">
                                    <span className="text-5xl block mb-4">🎉</span>
                                    <p className="text-lg font-semibold text-slate-700">No failed jobs</p>
                                    <p className="text-slate-400 mt-1">All jobs completed successfully</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ ACTIVITY DETAIL MODAL ═══ */}
            {detailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                <div><h3 className="text-lg font-bold text-white">Activity Detail</h3><p className="text-sm text-white/70">Log #{detailModal.id}</p></div>
                            </div>
                            <button onClick={() => setDetailModal(null)} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-5">
                            {/* Who / What / When */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Performed By</p>
                                    <p className="font-bold text-slate-900">{detailModal.causer_name}</p>
                                    <p className="text-sm text-slate-500">{detailModal.causer_email || 'System'}</p>
                                    {detailModal.causer_role && <p className="text-xs text-violet-600 font-medium mt-1">{detailModal.causer_role}</p>}
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Action</p>
                                    <EventBadge event={detailModal.event} />
                                    <p className="text-sm text-slate-500 mt-2">{detailModal.module ? detailModal.module.charAt(0).toUpperCase() + detailModal.module.slice(1) : 'N/A'} {detailModal.subject_type && `/ ${detailModal.subject_type}`}{detailModal.subject_id && ` #${detailModal.subject_id}`}</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">When</p>
                                    <p className="font-bold text-slate-900">{new Date(detailModal.created_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-slate-500">{new Date(detailModal.created_at).toLocaleTimeString()}</p>
                                    <p className="text-xs text-slate-400 mt-1">{detailModal.created_at_human}</p>
                                </div>
                            </div>

                            {detailModal.description && (
                                <div className="bg-slate-50 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                                    <p className="text-slate-700">{detailModal.description}</p>
                                </div>
                            )}

                            {/* Technical */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Technical Details</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div><p className="text-slate-400 text-xs">IP</p><p className="font-mono text-slate-800">{detailModal.ip_address || '-'}</p></div>
                                    <div><p className="text-slate-400 text-xs">Method</p>{detailModal.method ? <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${methodColors[detailModal.method] || 'bg-slate-100 text-slate-600'}`}>{detailModal.method}</span> : <span className="text-slate-400">-</span>}</div>
                                    <div className="col-span-2"><p className="text-slate-400 text-xs">URL</p><p className="font-mono text-xs text-slate-700 truncate">{detailModal.url || '-'}</p></div>
                                </div>
                                {detailModal.user_agent && <div className="mt-3 pt-3 border-t border-slate-200"><p className="text-slate-400 text-xs mb-1">User Agent</p><p className="font-mono text-xs text-slate-500 break-all">{detailModal.user_agent}</p></div>}
                            </div>

                            {/* Changes */}
                            {detailModal.has_changes && formatChanges(detailModal.changes).length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        Field Changes
                                    </div>
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50"><tr>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase">Field</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-red-500 uppercase">Previous</th>
                                            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-emerald-500 uppercase">New</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {formatChanges(detailModal.changes).map((c, i) => (
                                                <tr key={i} className="hover:bg-slate-50"><td className="px-4 py-2.5 text-sm font-semibold text-slate-800">{c.field}</td><td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-red-50 text-red-700 rounded font-mono text-xs">{formatValue(c.old)}</span></td><td className="px-4 py-2.5"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-mono text-xs">{formatValue(c.new)}</span></td></tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Properties */}
                            {Object.keys(detailModal.properties || {}).length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-slate-700 font-semibold text-sm">
                                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                        Properties
                                    </div>
                                    <pre className="p-4 text-xs font-mono bg-slate-900 text-emerald-300 overflow-x-auto">{JSON.stringify(detailModal.properties, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ EXCEPTION MODAL ═══ */}
            {exceptionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setExceptionModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-red-200 bg-gradient-to-r from-red-600 to-rose-600 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><span className="text-xl">❌</span></div>
                                <div><h3 className="text-lg font-bold text-white">Failed Job Exception</h3><p className="text-sm text-white/70">{exceptionModal.job_class} &middot; {exceptionModal.failed_at}</p></div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { retryJob(exceptionModal.id); setExceptionModal(null); }} className="px-3 py-1.5 text-xs font-bold text-white bg-white/20 rounded-lg hover:bg-white/30 transition-colors">Retry</button>
                                <button onClick={() => setExceptionModal(null)} className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <div className="bg-red-50 rounded-xl p-4 mb-4 border border-red-200">
                                <p className="text-sm font-bold text-red-800 mb-1">Error Summary</p>
                                <p className="text-sm text-red-700 font-mono">{exceptionModal.exception_summary}</p>
                            </div>
                            <pre className="p-4 text-xs font-mono bg-slate-900 text-red-300 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed">{exceptionModal.exception_full}</pre>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TOASTS ═══ */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`pointer-events-auto rounded-xl shadow-xl border p-3 flex items-center gap-2 text-sm font-medium animate-in ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                        <span>{t.type === 'success' ? '✅' : '❌'}</span>
                        {t.message}
                    </div>
                ))}
            </div>

            <style>{`
                .animate-in { animation: slide-in 0.3s ease-out; }
                @keyframes slide-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </AuthenticatedLayout>
    );
}
