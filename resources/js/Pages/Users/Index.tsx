import { useState, useCallback, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MultiSelect from '@/Components/MultiSelect';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

interface User {
    id: number;
    name: string;
    email: string;
    password_set: boolean;
    status: string;
    created_at: string;
    role?: {
        id: number;
        name: string;
        slug: string;
    };
    profile?: {
        company_name?: string;
    };
}

interface Role {
    id: number;
    name: string;
    slug: string;
}

interface PaginatedUsers {
    data: User[];
    total: number;
    from: number;
    to: number;
    last_page: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    users: PaginatedUsers;
    roles: Role[];
    filters: {
        search?: string;
        role_id?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    success?: string;
    error?: string;
}

export default function UsersIndex({ users, roles, filters = {}, success, error }: Props) {
    const { auth } = usePage().props as any;

    const [search, setSearch] = useState(filters.search || '');
    const [roleId, setRoleId] = useState<string[]>(filters.role_id ? filters.role_id.split(',') : []);
    const [status, setStatus] = useState<string[]>(filters.status ? filters.status.split(',') : []);
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track if date filters have been explicitly set by user
    const [datesModified, setDatesModified] = useState({
        date_from: !!filters.date_from,
        date_to: !!filters.date_to,
    });

    const hasActiveFilters = roleId.length > 0 || status.length > 0 || (dateFrom && datesModified.date_from) || (dateTo && datesModified.date_to);

    const applyFilters = useCallback((params: Record<string, string>) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            setIsLoading(true);
            router.get('/users', params, {
                preserveState: true,
                preserveScroll: true,
                only: ['users', 'filters'],
                onFinish: () => setIsLoading(false),
            });
        }, 300);
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        const params: Record<string, string> = { search: value };
        if (roleId.length > 0) params.role_id = roleId.join(',');
        if (status.length > 0) params.status = status.join(',');
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        applyFilters(params);
    };

    const handleFilterChange = (filterName: string, value: string) => {
        // Track date modifications
        if (filterName === 'date_from') {
            setDatesModified(prev => ({ ...prev, date_from: true }));
        }
        if (filterName === 'date_to') {
            setDatesModified(prev => ({ ...prev, date_to: true }));
        }

        const newDatesModified = {
            date_from: filterName === 'date_from' ? true : datesModified.date_from,
            date_to: filterName === 'date_to' ? true : datesModified.date_to,
        };

        if (filterName === 'date_from') setDateFrom(value);
        if (filterName === 'date_to') setDateTo(value);

        const newDateFrom = filterName === 'date_from' ? value : dateFrom;
        const newDateTo = filterName === 'date_to' ? value : dateTo;

        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (roleId.length > 0) params.role_id = roleId.join(',');
        if (status.length > 0) params.status = status.join(',');
        if (newDateFrom && newDatesModified.date_from) params.date_from = newDateFrom;
        if (newDateTo && newDatesModified.date_to) params.date_to = newDateTo;

        setIsLoading(true);
        router.get('/users', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'filters'],
            onFinish: () => setIsLoading(false),
        });
    };

    const handleMultiFilterChange = (filterName: 'role_id' | 'status', values: string[]) => {
        if (filterName === 'role_id') setRoleId(values);
        if (filterName === 'status') setStatus(values);

        const newRoleId = filterName === 'role_id' ? values : roleId;
        const newStatus = filterName === 'status' ? values : status;

        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (newRoleId.length > 0) params.role_id = newRoleId.join(',');
        if (newStatus.length > 0) params.status = newStatus.join(',');
        if (dateFrom && datesModified.date_from) params.date_from = dateFrom;
        if (dateTo && datesModified.date_to) params.date_to = dateTo;

        setIsLoading(true);
        router.get('/users', params, {
            preserveState: true,
            preserveScroll: true,
            only: ['users', 'filters'],
            onFinish: () => setIsLoading(false),
        });
    };

    const clearFilters = () => {
        setSearch('');
        setRoleId([]);
        setStatus([]);
        setDateFrom('');
        setDateTo('');
        setDatesModified({ date_from: false, date_to: false });
        router.get('/users', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getExportUrl = () => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (roleId.length > 0) params.append('role_id', roleId.join(','));
        if (status.length > 0) params.append('status', status.join(','));
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        return `/users/export?${params.toString()}`;
    };

    const getUserStatus = (user: User) => {
        if (!user.password_set) {
            return { label: 'Pending Setup', color: 'bg-yellow-100 text-yellow-800' };
        }
        if (user.status === 'inactive') {
            return { label: 'Inactive', color: 'bg-slate-100 text-slate-800' };
        }
        if (user.status === 'suspended') {
            return { label: 'Suspended', color: 'bg-red-100 text-red-800' };
        }
        return { label: 'Active', color: 'bg-green-100 text-green-800' };
    };

    const handleResendEmail = (userId: number) => {
        if (confirm('Resend password setup email to this user?')) {
            router.post(`/users/${userId}/resend-setup-email`);
        }
    };

    const handleDelete = (userId: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/users/${userId}`);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-slate-800">
                    User Management
                </h2>
            }
        >
            <Head title="Users" />

            <div className="space-y-6">
                {success && (
                        <div className="mb-4 rounded-lg bg-green-50 p-4 border border-green-200">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 rounded-lg bg-red-50 p-4 border border-red-200">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-xl font-semibold text-slate-900">Users</h1>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {users.total} total users
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={getExportUrl()}
                                        className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export CSV
                                    </a>
                                    <Link
                                        href="/users/create"
                                        className="inline-flex items-center rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                        </svg>
                                        Add User
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Search and Filters */}
                        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search all columns..."
                                            value={search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-colors focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white ${
                                                search ? 'border-violet-300 bg-white' : 'border-transparent bg-slate-100 hover:border-slate-300'
                                            }`}
                                        />
                                        {isLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center px-4 py-2.5 border rounded-lg text-sm font-medium ${
                                        hasActiveFilters
                                            ? 'border-violet-300 bg-violet-50 text-violet-700'
                                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="ml-2 bg-violet-600 text-white text-xs rounded-full px-2 py-0.5">
                                            {[roleId.length > 0, status.length > 0, dateFrom, dateTo].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {showFilters && (
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <MultiSelect
                                                label="Role"
                                                options={roles.map(r => ({ value: r.id.toString(), label: r.name }))}
                                                value={roleId}
                                                onChange={(values) => handleMultiFilterChange('role_id', values)}
                                                placeholder="All Roles"
                                            />
                                        </div>
                                        <div>
                                            <MultiSelect
                                                label="Status"
                                                options={[
                                                    { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
                                                    { value: 'pending', label: 'Pending Setup', color: 'bg-amber-100 text-amber-700' },
                                                    { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700' },
                                                    { value: 'suspended', label: 'Suspended', color: 'bg-slate-100 text-slate-500' },
                                                ]}
                                                value={status}
                                                onChange={(values) => handleMultiFilterChange('status', values)}
                                                placeholder="All Statuses"
                                                searchable={false}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                                            <input
                                                type="date"
                                                value={dateFrom || getTodayDate()}
                                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                                className={`w-full rounded-lg focus:ring-violet-500/20 focus:border-violet-500 ${
                                                    datesModified.date_from ? 'border-violet-400 bg-violet-50' : 'border-slate-300'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                                            <input
                                                type="date"
                                                value={dateTo || getTodayDate()}
                                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                                className={`w-full rounded-lg focus:ring-violet-500/20 focus:border-violet-500 ${
                                                    datesModified.date_to ? 'border-violet-400 bg-violet-50' : 'border-slate-300'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    {hasActiveFilters && (
                                        <div className="mt-4">
                                            <button
                                                onClick={clearFilters}
                                                className="text-sm text-violet-600 hover:text-violet-500"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Users Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50/80">
                                    <tr>
                                        <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                                        <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Company</th>
                                        <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created</th>
                                        <th className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {users.data.map((user) => {
                                        const userStatus = getUserStatus(user);
                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900">{user.name}</div>
                                                        <div className="text-sm text-slate-500">{user.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded">
                                                        {user.role?.name || 'No Role'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {user.profile?.company_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${userStatus.color}`}>
                                                        {userStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-1">
                                                        {!user.password_set && (
                                                            <button
                                                                onClick={() => handleResendEmail(user.id)}
                                                                className="w-8 h-8 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors inline-flex items-center justify-center"
                                                                title="Resend setup email"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <Link href={`/users/${user.id}/edit`} className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </Link>
                                                        {user.id !== auth.user.id && (
                                                            <button onClick={() => handleDelete(user.id)} className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-600">
                                        Showing {users.from} to {users.to} of {users.total} results
                                    </p>
                                    <div className="flex gap-2">
                                        {users.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 text-sm rounded-lg ${
                                                    link.active
                                                        ? 'bg-violet-600 text-white'
                                                        : 'text-slate-600 hover:bg-slate-200'
                                                } ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}
