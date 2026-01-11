import { useState, useCallback, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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
    const [roleId, setRoleId] = useState(filters.role_id || '');
    const [status, setStatus] = useState(filters.status || '');
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

    const hasActiveFilters = roleId || status || (dateFrom && datesModified.date_from) || (dateTo && datesModified.date_to);

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
        applyFilters({
            search: value,
            role_id: roleId,
            status: status,
            date_from: dateFrom,
            date_to: dateTo,
        });
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

        const newFilters: Record<string, string> = {
            search,
            role_id: filterName === 'role_id' ? value : roleId,
            status: filterName === 'status' ? value : status,
            date_from: filterName === 'date_from' ? value : dateFrom,
            date_to: filterName === 'date_to' ? value : dateTo,
        };

        if (filterName === 'role_id') setRoleId(value);
        if (filterName === 'status') setStatus(value);
        if (filterName === 'date_from') setDateFrom(value);
        if (filterName === 'date_to') setDateTo(value);

        // Only include dates in params if they've been modified
        const params = Object.fromEntries(
            Object.entries(newFilters).filter(([key, v]) => {
                if (key === 'date_from') return v !== '' && newDatesModified.date_from;
                if (key === 'date_to') return v !== '' && newDatesModified.date_to;
                return v !== '' && v !== null;
            })
        );

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
        setRoleId('');
        setStatus('');
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
        if (roleId) params.append('role_id', roleId);
        if (status) params.append('status', status);
        if (dateFrom) params.append('date_from', dateFrom);
        if (dateTo) params.append('date_to', dateTo);
        return `/users/export?${params.toString()}`;
    };

    const getUserStatus = (user: User) => {
        if (!user.password_set) {
            return { label: 'Pending Setup', color: 'bg-yellow-100 text-yellow-800' };
        }
        if (user.status === 'inactive') {
            return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
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
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
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

                    <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-900">Users</h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {users.total} total users
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={getExportUrl()}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export CSV
                                    </a>
                                    <Link
                                        href="/users/create"
                                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
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
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search users by name, email, company..."
                                            value={search}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        {isLoading && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`inline-flex items-center px-4 py-2.5 border rounded-lg text-sm font-medium ${
                                        hasActiveFilters
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                    Filters
                                    {hasActiveFilters && (
                                        <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                                            {[roleId, status, dateFrom, dateTo].filter(Boolean).length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {showFilters && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                value={roleId}
                                                onChange={(e) => handleFilterChange('role_id', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">All Roles</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={status}
                                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                                className="w-full border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="active">Active</option>
                                                <option value="pending">Pending Setup</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="suspended">Suspended</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                                            <input
                                                type="date"
                                                value={dateFrom || getTodayDate()}
                                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                                className={`w-full rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                                    datesModified.date_from ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
                                                }`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                                            <input
                                                type="date"
                                                value={dateTo || getTodayDate()}
                                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                                className={`w-full rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${
                                                    datesModified.date_to ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300'
                                                }`}
                                            />
                                        </div>
                                    </div>
                                    {hasActiveFilters && (
                                        <div className="mt-4">
                                            <button
                                                onClick={clearFilters}
                                                className="text-sm text-indigo-600 hover:text-indigo-500"
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
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.data.map((user) => {
                                        const userStatus = getUserStatus(user);
                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                                        {user.role?.name || 'No Role'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {user.profile?.company_name || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${userStatus.color}`}>
                                                        {userStatus.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!user.password_set && (
                                                            <button
                                                                onClick={() => handleResendEmail(user.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                                title="Resend setup email"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        <Link href={`/users/${user.id}/edit`} className="text-indigo-600 hover:text-indigo-900">
                                                            Edit
                                                        </Link>
                                                        {user.id !== auth.user.id && (
                                                            <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900">
                                                                Delete
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
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-700">
                                        Showing {users.from} to {users.to} of {users.total} results
                                    </p>
                                    <div className="flex gap-2">
                                        {users.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 text-sm rounded ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
