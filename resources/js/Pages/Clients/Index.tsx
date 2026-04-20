import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input, Button, Badge, Card, EmptyState } from '@/Components/Form';
import MultiSelect from '@/Components/MultiSelect';
import { useState } from 'react';

interface Client {
    id: number;
    type: 'individual' | 'company';
    company_name: string | null;
    contact_first_name: string;
    contact_last_name: string;
    email: string;
    phone: string | null;
    phone_country_code: string | null;
    city: string | null;
    country: string | null;
    status: 'active' | 'inactive';
    display_name: string;
    created_at: string;
}

interface PaginatedClients {
    data: Client[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    clients: PaginatedClients;
    cities: string[];
    countries: string[];
    filters: {
        search?: string;
        type?: string;
        status?: string;
        city?: string;
        country?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ clients, cities, countries, filters }: Props) {
    const { auth, flash } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [deleteModal, setDeleteModal] = useState<Client | null>(null);
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        type: filters.type ? filters.type.split(',') : [] as string[],
        status: filters.status ? filters.status.split(',') : [] as string[],
        city: filters.city ? filters.city.split(',') : [] as string[],
        country: filters.country ? filters.country.split(',') : [] as string[],
    });

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        Object.entries(filterValues).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                params[key] = value.join(',');
            } else if (typeof value === 'string' && value) {
                params[key] = value;
            }
        });
        router.get(route('clients.index'), params, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('clients.index'), { ...filters, sort: field, direction }, { preserveState: true });
    };

    const handleDelete = () => {
        if (deleteModal) {
            router.delete(route('clients.destroy', deleteModal.id), {
                onSuccess: () => setDeleteModal(null),
            });
        }
    };

    const clearFilters = () => {
        setFilterValues({
            search: '',
            type: [],
            status: [],
            city: [],
            country: [],
        });
        router.get(route('clients.index'));
    };

    const hasActiveFilters = Object.values(filters).some((v) => v && v !== 'created_at' && v !== 'desc');

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
        <AuthenticatedLayout header="Clients">
            <Head title="Clients" />

            <div className="space-y-6">
                {/* Flash Messages */}
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

                {/* Main Card */}
                <Card>
                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Client Directory</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Manage your clients and their contact information
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                                {hasActiveFilters && (
                                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-md">
                                        Active
                                    </span>
                                )}
                            </Button>
                            {hasPermission('clients.export') && (
                                <a href={route('clients.export', filters)}>
                                    <Button
                                        variant="secondary"
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        }
                                    >
                                        Export
                                    </Button>
                                </a>
                            )}
                            {hasPermission('clients.create') && (
                                <Link href={route('clients.create')}>
                                    <button
                                        type="button"
                                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all inline-flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Client
                                    </button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <form onSubmit={handleFilter} className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <Input
                                    label="Search"
                                    type="text"
                                    value={filterValues.search}
                                    onChange={(e) => setFilterValues({ ...filterValues, search: e.target.value })}
                                    placeholder="Name, email, phone..."
                                />
                                <MultiSelect
                                    label="Type"
                                    options={[
                                        { value: 'individual', label: 'Individual' },
                                        { value: 'company', label: 'Company' },
                                    ]}
                                    value={filterValues.type}
                                    onChange={(val) => setFilterValues({ ...filterValues, type: val })}
                                    placeholder="All Types"
                                    searchable={false}
                                />
                                <MultiSelect
                                    label="Status"
                                    options={[
                                        { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
                                        { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700' },
                                    ]}
                                    value={filterValues.status}
                                    onChange={(val) => setFilterValues({ ...filterValues, status: val })}
                                    placeholder="All Statuses"
                                    searchable={false}
                                />
                                <MultiSelect
                                    label="City"
                                    options={cities.map(c => ({ value: c, label: c }))}
                                    value={filterValues.city}
                                    onChange={(val) => setFilterValues({ ...filterValues, city: val })}
                                    placeholder="All Cities"
                                    searchPlaceholder="Search cities..."
                                />
                                <MultiSelect
                                    label="Country"
                                    options={countries.map(c => ({ value: c, label: c }))}
                                    value={filterValues.country}
                                    onChange={(val) => setFilterValues({ ...filterValues, country: val })}
                                    placeholder="All Countries"
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
                                        onClick={() => handleSort('contact_first_name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Name
                                            {getSortIcon('contact_first_name')}
                                        </div>
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Type
                                    </th>
                                    <th
                                        className="cursor-pointer px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Email
                                            {getSortIcon('email')}
                                        </div>
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Phone
                                    </th>
                                    <th
                                        className="cursor-pointer px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900"
                                        onClick={() => handleSort('city')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Location
                                            {getSortIcon('city')}
                                        </div>
                                    </th>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>
                                    <th className="px-5 py-3.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                                {clients.data.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-white">
                                                        {client.display_name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {client.display_name}
                                                    </div>
                                                    {client.type === 'company' && (
                                                        <div className="text-xs text-slate-500">
                                                            {client.contact_first_name} {client.contact_last_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant={client.type === 'company' ? 'info' : 'default'}>
                                                {client.type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <a href={`mailto:${client.email}`} className="text-violet-600 hover:text-violet-800 hover:underline">
                                                {client.email}
                                            </a>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600">
                                            {client.phone ? (
                                                <a href={`tel:${client.phone_country_code || ''}${client.phone}`} className="text-violet-600 hover:text-violet-800 hover:underline">
                                                    {client.phone_country_code} {client.phone}
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-slate-600">
                                            {client.city || client.country ? (
                                                <>{client.city}{client.city && client.country && ', '}{client.country}</>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant={client.status === 'active' ? 'success' : 'default'}>
                                                {client.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={route('clients.show', client.id)}
                                                    className="w-8 h-8 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center justify-center"
                                                    title="View"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                {hasPermission('clients.edit') && (
                                                    <Link
                                                        href={route('clients.edit', client.id)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                )}
                                                {hasPermission('clients.delete') && (
                                                    <button
                                                        onClick={() => setDeleteModal(client)}
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
                            </tbody>
                        </table>

                        {clients.data.length === 0 && (
                            <div className="p-8">
                                <EmptyState
                                    icon={
                                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    }
                                    title="No clients found"
                                    description="Get started by creating your first client"
                                    action={
                                        hasPermission('clients.create') && (
                                            <Link href={route('clients.create')}>
                                                <Button>Add Client</Button>
                                            </Link>
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {clients.last_page > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-slate-500">
                                Showing {(clients.current_page - 1) * clients.per_page + 1} to{' '}
                                {Math.min(clients.current_page * clients.per_page, clients.total)} of{' '}
                                {clients.total} results
                            </div>
                            <div className="flex gap-1">
                                {clients.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-violet-600 text-white rounded-lg'
                                                : link.url
                                                ? 'text-slate-600 hover:bg-slate-200 rounded-lg'
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
                                <h3 className="text-lg font-semibold text-slate-900">Delete Client</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="mb-6 text-sm text-slate-600">
                            Are you sure you want to delete <strong>"{deleteModal.display_name}"</strong>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setDeleteModal(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Delete Client
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
