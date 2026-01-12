import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';
import axios from 'axios';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface Client {
    id: number;
    display_name: string;
}

interface User {
    id: number;
    name: string;
}

interface Quotation {
    id: number;
    quotation_number: string;
    client_id: number;
    client: Client | null;
    user: User | null;
    status: string;
    currency: string;
    subtotal: number;
    grand_total: number;
    quotation_date: string;
    valid_until: string | null;
    version: number;
    sent_at: string | null;
    created_at: string;
}

interface PaginatedQuotations {
    data: Quotation[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    quotations: PaginatedQuotations;
    clients: Client[];
    users: User[];
    statuses: Record<string, string>;
    filters: {
        search?: string;
        status?: string;
        client_id?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
        sort?: string;
        direction?: string;
    };
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    pending_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    sent: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
};

export default function Index({ quotations, clients = [], users = [], statuses = {}, filters = {} }: Props) {
    const { auth, flash } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [deleteModal, setDeleteModal] = useState<Quotation | null>(null);
    const [statusModal, setStatusModal] = useState<Quotation | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const [statusNotes, setStatusNotes] = useState('');
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        status: filters.status || '',
        client_id: filters.client_id || '',
        user_id: filters.user_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    // Track if date filters have been explicitly set by user
    const [datesModified, setDatesModified] = useState({
        date_from: !!filters.date_from,
        date_to: !!filters.date_to,
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
        router.get(route('quotations.index'), params, { preserveState: true });
    };

    const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
        setFilterValues({ ...filterValues, [field]: value });
        setDatesModified({ ...datesModified, [field]: true });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('quotations.index'), { ...filters, sort: field, direction }, { preserveState: true });
    };

    const handleDelete = () => {
        if (deleteModal) {
            router.delete(route('quotations.destroy', deleteModal.id), {
                onSuccess: () => setDeleteModal(null),
            });
        }
    };

    const openStatusModal = (quotation: Quotation) => {
        setStatusModal(quotation);
        setNewStatus('');
        setStatusNotes('');
    };

    const handleStatusChange = async () => {
        if (!statusModal || !newStatus) return;

        setIsChangingStatus(true);
        try {
            await axios.post(route('quotations.change-status', statusModal.id), {
                status: newStatus,
                notes: statusNotes,
            });
            setStatusModal(null);
            setNewStatus('');
            setStatusNotes('');
            router.reload({ only: ['quotations'] });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to change status');
        } finally {
            setIsChangingStatus(false);
        }
    };

    const getAvailableStatuses = (currentStatus: string) => {
        // Define which statuses can transition to which
        const transitions: Record<string, string[]> = {
            draft: ['pending_review', 'cancelled'],
            pending_review: ['approved', 'draft', 'cancelled'],
            approved: ['sent', 'draft', 'cancelled'],
            sent: ['accepted', 'rejected', 'expired', 'cancelled'],
            accepted: [],
            rejected: [],
            expired: [],
            cancelled: ['draft'],
        };
        return transitions[currentStatus] || [];
    };

    const clearFilters = () => {
        setFilterValues({
            search: '',
            status: '',
            client_id: '',
            user_id: '',
            date_from: '',
            date_to: '',
        });
        setDatesModified({ date_from: false, date_to: false });
        router.get(route('quotations.index'));
    };

    const hasActiveFilters = Object.values(filters).some((v) => v && v !== 'created_at' && v !== 'desc');

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) return '↕';
        return filters.direction === 'asc' ? '↑' : '↓';
    };

    const formatCurrency = (amount: number, currency: string = 'SAR') => {
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <AuthenticatedLayout header="Quotations">
            <Head title="Quotations" />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Quotation Management</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Create and manage client quotations
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                                        showFilters || hasActiveFilters
                                            ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                                            Active
                                        </span>
                                    )}
                                </button>
                                {hasPermission('quotations.export') && (
                                    <a
                                        href={route('quotations.export', filters)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export
                                    </a>
                                )}
                                {hasPermission('quotations.create') && (
                                    <Link
                                        href={route('quotations.create')}
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        New Quotation
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Filters */}
                        {showFilters && (
                            <form onSubmit={handleFilter} className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-5">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                                        <input
                                            type="text"
                                            value={filterValues.search}
                                            onChange={(e) => setFilterValues({ ...filterValues, search: e.target.value })}
                                            placeholder="Quotation number..."
                                            className="block w-full h-11 px-4 rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                                        <select
                                            value={filterValues.status}
                                            onChange={(e) => setFilterValues({ ...filterValues, status: e.target.value })}
                                            className="block w-full h-11 px-4 rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="draft">Draft</option>
                                            <option value="pending_review">Pending Review</option>
                                            <option value="approved">Approved</option>
                                            <option value="sent">Sent</option>
                                            <option value="accepted">Accepted (Won)</option>
                                            <option value="rejected">Rejected (Lost)</option>
                                            <option value="expired">Expired</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
                                        <select
                                            value={filterValues.client_id}
                                            onChange={(e) => setFilterValues({ ...filterValues, client_id: e.target.value })}
                                            className="block w-full h-11 px-4 rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                                        >
                                            <option value="">All Clients</option>
                                            {clients.map((client) => (
                                                <option key={client.id} value={client.id}>{client.display_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Sales Rep</label>
                                        <select
                                            value={filterValues.user_id}
                                            onChange={(e) => setFilterValues({ ...filterValues, user_id: e.target.value })}
                                            className="block w-full h-11 px-4 rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                                        >
                                            <option value="">All Users</option>
                                            {users.map((user) => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Date From</label>
                                        <input
                                            type="date"
                                            value={filterValues.date_from || getTodayDate()}
                                            onChange={(e) => handleDateChange('date_from', e.target.value)}
                                            className={`block w-full h-11 px-4 rounded-xl shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm ${
                                                datesModified.date_from ? 'border-violet-400 bg-violet-50' : 'border-slate-300'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Date To</label>
                                        <input
                                            type="date"
                                            value={filterValues.date_to || getTodayDate()}
                                            onChange={(e) => handleDateChange('date_to', e.target.value)}
                                            className={`block w-full h-11 px-4 rounded-xl shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm ${
                                                datesModified.date_to ? 'border-violet-400 bg-violet-50' : 'border-slate-300'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                                            onClick={() => handleSort('quotation_number')}
                                        >
                                            Quotation # {getSortIcon('quotation_number')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                                            Client
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                                            onClick={() => handleSort('quotation_date')}
                                        >
                                            Date {getSortIcon('quotation_date')}
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                                            onClick={() => handleSort('valid_until')}
                                        >
                                            Valid Until {getSortIcon('valid_until')}
                                        </th>
                                        <th
                                            className="cursor-pointer px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900"
                                            onClick={() => handleSort('grand_total')}
                                        >
                                            Total {getSortIcon('grand_total')}
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white">
                                    {quotations.data.map((quotation) => (
                                        <tr key={quotation.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="whitespace-nowrap px-4 py-4">
                                                <Link
                                                    href={route('quotations.show', quotation.id)}
                                                    className="font-semibold text-violet-600 hover:text-violet-800"
                                                >
                                                    {quotation.quotation_number}
                                                </Link>
                                                {quotation.version > 1 && (
                                                    <span className="ml-2 text-xs text-slate-500">v{quotation.version}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-slate-900">
                                                    {quotation.client?.display_name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    by {quotation.user?.name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                                {formatDate(quotation.quotation_date)}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                                {quotation.valid_until ? formatDate(quotation.valid_until) : '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right">
                                                <span className="font-semibold text-slate-900">
                                                    {formatCurrency(quotation.grand_total, quotation.currency)}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-center">
                                                <button
                                                    onClick={() => openStatusModal(quotation)}
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusColors[quotation.status] || 'bg-slate-100 text-slate-600'}`}
                                                    title="Click to change status"
                                                >
                                                    {statusLabels[quotation.status] || quotation.status}
                                                    {getAvailableStatuses(quotation.status).length > 0 && (
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Link
                                                        href={route('quotations.show', quotation.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                                        title="View"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </Link>
                                                    <a
                                                        href={route('quotations.download-pdf', quotation.id)}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        title="Download PDF"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </a>
                                                    {hasPermission('quotations.edit') && quotation.status === 'draft' && (
                                                        <Link
                                                            href={route('quotations.edit', quotation.id)}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                    )}
                                                    {hasPermission('quotations.delete') && quotation.status === 'draft' && (
                                                        <button
                                                            onClick={() => setDeleteModal(quotation)}
                                                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {quotations.data.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-slate-500 font-medium">No quotations found</p>
                                                    <p className="text-slate-400 text-sm mt-1">Get started by creating a new quotation</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {quotations.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-slate-500">
                                    Showing {(quotations.current_page - 1) * quotations.per_page + 1} to{' '}
                                    {Math.min(quotations.current_page * quotations.per_page, quotations.total)} of{' '}
                                    {quotations.total} results
                                </div>
                                <div className="flex gap-1">
                                    {quotations.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                link.active
                                                    ? 'bg-violet-600 text-white'
                                                    : link.url
                                                    ? 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                    : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                            }`}
                                            preserveState
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Delete Quotation</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="mb-6 text-sm text-slate-600">
                            Are you sure you want to delete quotation <strong>{deleteModal.quotation_number}</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                            >
                                Delete Quotation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Change Modal */}
            {statusModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Change Status</h3>
                                <p className="text-sm text-slate-500">{statusModal.quotation_number}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm text-slate-600 mb-3">
                                Current Status: <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[statusModal.status]}`}>
                                    {statusLabels[statusModal.status]}
                                </span>
                            </div>

                            {getAvailableStatuses(statusModal.status).length > 0 ? (
                                <>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">New Status</label>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {getAvailableStatuses(statusModal.status).map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setNewStatus(status)}
                                                className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                                                    newStatus === status
                                                        ? 'ring-2 ring-violet-500 ring-offset-2'
                                                        : ''
                                                } ${statusColors[status]}`}
                                            >
                                                {statusLabels[status]}
                                            </button>
                                        ))}
                                    </div>

                                    <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                                    <textarea
                                        value={statusNotes}
                                        onChange={(e) => setStatusNotes(e.target.value)}
                                        rows={3}
                                        className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm"
                                        placeholder="Add any notes about this status change..."
                                    />
                                </>
                            ) : (
                                <div className="text-center py-4 text-slate-500">
                                    <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <p className="text-sm">This quotation is in a final status and cannot be changed.</p>
                                    {(statusModal.status === 'rejected' || statusModal.status === 'expired') && (
                                        <p className="text-xs mt-2">You can create a new version from the quotation view page.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setStatusModal(null);
                                    setNewStatus('');
                                    setStatusNotes('');
                                }}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            {getAvailableStatuses(statusModal.status).length > 0 && (
                                <button
                                    onClick={handleStatusChange}
                                    disabled={!newStatus || isChangingStatus}
                                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isChangingStatus ? 'Changing...' : 'Change Status'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
