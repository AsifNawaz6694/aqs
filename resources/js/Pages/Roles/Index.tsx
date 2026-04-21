import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, Input } from '@/Components/Form';
import MultiSelect from '@/Components/MultiSelect';
import { useState, useRef, useCallback } from 'react';

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    is_system: boolean;
    users_count: number;
    permissions_count: number;
    created_at: string;
}

interface PaginatedRoles {
    data: Role[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    roles: PaginatedRoles;
    availableLevels: number[];
    filters: {
        search?: string;
        type?: string;
        level?: string;
        level_min?: string;
        level_max?: string;
        usage?: string;
        permissions_state?: string;
        sort?: string;
        direction?: string;
    };
}

type FilterState = {
    type: string[];
    level: string[];
    level_min: string;
    level_max: string;
    usage: string[];
    permissions_state: string[];
};

export default function Index({ roles, availableLevels = [], filters }: Props) {
    const { auth, flash } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [deleteModal, setDeleteModal] = useState<Role | null>(null);
    const [search, setSearch] = useState(filters.search || '');
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [filterValues, setFilterValues] = useState<FilterState>({
        type: filters.type ? filters.type.split(',') : [],
        level: filters.level ? filters.level.split(',') : [],
        level_min: filters.level_min || '',
        level_max: filters.level_max || '',
        usage: filters.usage ? filters.usage.split(',') : [],
        permissions_state: filters.permissions_state ? filters.permissions_state.split(',') : [],
    });

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const buildParams = (overrides: Partial<{ search: string } & FilterState> = {}) => {
        const merged: { search: string } & FilterState = {
            search: overrides.search ?? search,
            type: overrides.type ?? filterValues.type,
            level: overrides.level ?? filterValues.level,
            level_min: overrides.level_min ?? filterValues.level_min,
            level_max: overrides.level_max ?? filterValues.level_max,
            usage: overrides.usage ?? filterValues.usage,
            permissions_state: overrides.permissions_state ?? filterValues.permissions_state,
        };
        const params: Record<string, string> = {};
        if (merged.search) params.search = merged.search;
        if (merged.type.length) params.type = merged.type.join(',');
        if (merged.level.length) params.level = merged.level.join(',');
        if (merged.level_min) params.level_min = merged.level_min;
        if (merged.level_max) params.level_max = merged.level_max;
        if (merged.usage.length) params.usage = merged.usage.join(',');
        if (merged.permissions_state.length) params.permissions_state = merged.permissions_state.join(',');
        return params;
    };

    const applyFilters = useCallback((params: Record<string, string>) => {
        router.get(route('roles.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['roles', 'filters'],
            onFinish: () => setIsSearching(false),
        });
    }, []);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setIsSearching(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            applyFilters(buildParams({ search: value }));
        }, 300);
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters(buildParams());
    };

    const clearFilters = () => {
        setSearch('');
        setFilterValues({
            type: [],
            level: [],
            level_min: '',
            level_max: '',
            usage: [],
            permissions_state: [],
        });
        router.get(route('roles.index'));
    };

    const hasActiveFilters =
        filterValues.type.length > 0 ||
        filterValues.level.length > 0 ||
        !!filterValues.level_min ||
        !!filterValues.level_max ||
        filterValues.usage.length > 0 ||
        filterValues.permissions_state.length > 0;

    const activeFilterCount =
        (filterValues.type.length > 0 ? 1 : 0) +
        (filterValues.level.length > 0 ? 1 : 0) +
        (filterValues.level_min || filterValues.level_max ? 1 : 0) +
        (filterValues.usage.length > 0 ? 1 : 0) +
        (filterValues.permissions_state.length > 0 ? 1 : 0);

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('roles.index'), { ...filters, sort: field, direction }, { preserveState: true });
    };

    const handleDelete = () => {
        if (deleteModal) {
            router.delete(route('roles.destroy', deleteModal.id), {
                onSuccess: () => setDeleteModal(null),
            });
        }
    };

    const getSortIcon = (field: string) => {
        if (filters.sort !== field) {
            return (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }
        return filters.direction === 'asc' ? (
            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    return (
        <AuthenticatedLayout header="Roles">
            <Head title="Roles" />

            <div className="space-y-6">
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
                        </div>
                    </div>
                )}

                <Card>
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Role Directory</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Manage roles and their permissions
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {hasPermission('roles.create') && (
                                <Link href={route('roles.create')}>
                                    <button
                                        type="button"
                                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all inline-flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Role
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Search + Filter toggle */}
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Search all columns..."
                                className={`w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:bg-white ${
                                    search ? 'border-violet-300 bg-white' : 'border-transparent bg-slate-100 hover:border-slate-300'
                                }`}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <Button
                            variant={showFilters || hasActiveFilters ? 'primary' : 'secondary'}
                            onClick={() => setShowFilters(!showFilters)}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            }
                        >
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-md">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <form onSubmit={handleFilter} className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <MultiSelect
                                    label="Type"
                                    options={[
                                        { value: 'system', label: 'System', color: 'bg-purple-100 text-purple-700' },
                                        { value: 'custom', label: 'Custom', color: 'bg-slate-100 text-slate-700' },
                                    ]}
                                    value={filterValues.type}
                                    onChange={(val) => setFilterValues({ ...filterValues, type: val })}
                                    placeholder="All Types"
                                    searchable={false}
                                />
                                <MultiSelect
                                    label="Level"
                                    options={availableLevels.map((l) => ({ value: String(l), label: `Level ${l}` }))}
                                    value={filterValues.level}
                                    onChange={(val) => setFilterValues({ ...filterValues, level: val })}
                                    placeholder="Any Level"
                                />
                                <MultiSelect
                                    label="Usage"
                                    options={[
                                        { value: 'with_users', label: 'Assigned to users', color: 'bg-emerald-100 text-emerald-700' },
                                        { value: 'no_users', label: 'No users', color: 'bg-slate-100 text-slate-700' },
                                    ]}
                                    value={filterValues.usage}
                                    onChange={(val) => setFilterValues({ ...filterValues, usage: val })}
                                    placeholder="Any Usage"
                                    searchable={false}
                                />
                                <MultiSelect
                                    label="Permissions"
                                    options={[
                                        { value: 'with_permissions', label: 'Has permissions', color: 'bg-blue-100 text-blue-700' },
                                        { value: 'no_permissions', label: 'No permissions', color: 'bg-slate-100 text-slate-700' },
                                    ]}
                                    value={filterValues.permissions_state}
                                    onChange={(val) => setFilterValues({ ...filterValues, permissions_state: val })}
                                    placeholder="Any"
                                    searchable={false}
                                />
                                <Input
                                    label="Min Level"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={filterValues.level_min}
                                    onChange={(e) => setFilterValues({ ...filterValues, level_min: e.target.value })}
                                    placeholder="1"
                                />
                                <Input
                                    label="Max Level"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={filterValues.level_max}
                                    onChange={(e) => setFilterValues({ ...filterValues, level_max: e.target.value })}
                                    placeholder="100"
                                />
                            </div>
                            <div className="mt-4 flex justify-end gap-2">
                                <Button type="button" variant="secondary" onClick={clearFilters}>
                                    Clear
                                </Button>
                                <Button type="submit">
                                    Apply Filters
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th
                                        className="cursor-pointer px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Name
                                            {getSortIcon('name')}
                                        </div>
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Description
                                    </th>
                                    <th
                                        className="cursor-pointer px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                        onClick={() => handleSort('level')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Level
                                            {getSortIcon('level')}
                                        </div>
                                    </th>
                                    <th
                                        className="cursor-pointer px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                        onClick={() => handleSort('users_count')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Users
                                            {getSortIcon('users_count')}
                                        </div>
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Permissions
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Type
                                    </th>
                                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {roles.data.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-slate-900">{role.name}</div>
                                            <div className="text-xs text-slate-500">{role.slug}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="max-w-xs truncate text-sm text-slate-500">
                                                {role.description || '-'}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <Badge variant="info">Level {role.level}</Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {role.users_count}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {role.slug === 'super-admin' ? 'All' : role.permissions_count}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <Badge variant={role.is_system ? 'info' : 'default'}>
                                                {role.is_system ? 'System' : 'Custom'}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                {hasPermission('roles.edit') && role.slug !== 'super-admin' && (
                                                    <Link
                                                        href={route('roles.edit', role.id)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                )}
                                                {hasPermission('roles.delete') && !role.is_system && (
                                                    <button
                                                        onClick={() => setDeleteModal(role)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
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
                                {roles.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            No roles found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {roles.last_page > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-slate-500">
                                Showing {(roles.current_page - 1) * roles.per_page + 1} to{' '}
                                {Math.min(roles.current_page * roles.per_page, roles.total)} of{' '}
                                {roles.total} results
                            </div>
                            <div className="flex gap-1">
                                {roles.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-violet-600 text-white'
                                                : link.url
                                                ? 'text-slate-600 hover:bg-slate-200'
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                        preserveState
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Delete Role</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="mb-6 text-sm text-slate-600">
                            Are you sure you want to delete <strong>"{deleteModal.name}"</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setDeleteModal(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Delete Role
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
