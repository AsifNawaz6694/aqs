import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Permission {
    id: number;
    name: string;
    slug: string;
}

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
    filters: {
        search?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ roles, filters }: Props) {
    const { auth, flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModal, setDeleteModal] = useState<Role | null>(null);

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('roles.index'), { search }, { preserveState: true });
    };

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
        if (filters.sort !== field) return '↕';
        return filters.direction === 'asc' ? '↑' : '↓';
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Role Management</h2>}
        >
            <Head title="Roles" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4">
                            <p className="text-sm font-medium text-green-800">{flash.success}</p>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
                        </div>
                    )}

                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Roles</h3>
                                    <p className="text-sm text-gray-600">
                                        Manage roles and their permissions
                                    </p>
                                </div>
                                {hasPermission('roles.create') && (
                                    <Link
                                        href={route('roles.create')}
                                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                    >
                                        Create Role
                                    </Link>
                                )}
                            </div>

                            {/* Search */}
                            <form onSubmit={handleSearch} className="mb-6">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Search roles..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                                    >
                                        Search
                                    </button>
                                    {filters.search && (
                                        <Link
                                            href={route('roles.index')}
                                            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                                        >
                                            Clear
                                        </Link>
                                    )}
                                </div>
                            </form>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                onClick={() => handleSort('name')}
                                            >
                                                Name {getSortIcon('name')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Description
                                            </th>
                                            <th
                                                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                onClick={() => handleSort('level')}
                                            >
                                                Level {getSortIcon('level')}
                                            </th>
                                            <th
                                                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                onClick={() => handleSort('users_count')}
                                            >
                                                Users {getSortIcon('users_count')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Permissions
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {roles.data.map((role) => (
                                            <tr key={role.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="font-medium text-gray-900">{role.name}</div>
                                                    <div className="text-sm text-gray-500">{role.slug}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs truncate text-sm text-gray-500">
                                                        {role.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                                        Level {role.level}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {role.users_count}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {role.slug === 'super-admin' ? 'All' : role.permissions_count}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {role.is_system ? (
                                                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                                                            System
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                            Custom
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        {hasPermission('roles.edit') && role.slug !== 'super-admin' && (
                                                            <Link
                                                                href={route('roles.edit', role.id)}
                                                                className="text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                Edit
                                                            </Link>
                                                        )}
                                                        {hasPermission('roles.delete') && !role.is_system && (
                                                            <button
                                                                onClick={() => setDeleteModal(role)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {roles.data.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                    No roles found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {roles.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing {(roles.current_page - 1) * roles.per_page + 1} to{' '}
                                        {Math.min(roles.current_page * roles.per_page, roles.total)} of{' '}
                                        {roles.total} results
                                    </div>
                                    <div className="flex gap-2">
                                        {roles.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`rounded-md px-3 py-2 text-sm ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white'
                                                        : link.url
                                                        ? 'bg-white text-gray-700 hover:bg-gray-50'
                                                        : 'cursor-not-allowed bg-gray-100 text-gray-400'
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
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">Delete Role</h3>
                        <p className="mb-6 text-sm text-gray-500">
                            Are you sure you want to delete the role "{deleteModal.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
