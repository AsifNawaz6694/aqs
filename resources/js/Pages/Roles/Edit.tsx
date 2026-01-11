import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';

interface Permission {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    is_system: boolean;
}

interface Props {
    role: Role;
    permissions: Record<string, Permission[]>;
    rolePermissions: number[];
}

export default function Edit({ role, permissions, rolePermissions }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        description: role.description || '',
        level: role.level,
        permissions: rolePermissions,
    });

    const [expandedGroups, setExpandedGroups] = useState<string[]>(Object.keys(permissions));

    const toggleGroup = (group: string) => {
        setExpandedGroups((prev) =>
            prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
        );
    };

    const togglePermission = (permissionId: number) => {
        setData('permissions', data.permissions.includes(permissionId)
            ? data.permissions.filter((id) => id !== permissionId)
            : [...data.permissions, permissionId]
        );
    };

    const toggleGroupPermissions = (groupPermissions: Permission[]) => {
        const groupIds = groupPermissions.map((p) => p.id);
        const allSelected = groupIds.every((id) => data.permissions.includes(id));

        if (allSelected) {
            setData('permissions', data.permissions.filter((id) => !groupIds.includes(id)));
        } else {
            const newPermissions = [...data.permissions];
            groupIds.forEach((id) => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            setData('permissions', newPermissions);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Role</h2>}
        >
            <Head title={`Edit Role - ${role.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="mb-6">
                                <Link
                                    href={route('roles.index')}
                                    className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                    &larr; Back to Roles
                                </Link>
                            </div>

                            {role.is_system && (
                                <div className="mb-6 rounded-md bg-yellow-50 p-4">
                                    <div className="flex">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">System Role</h3>
                                            <p className="mt-1 text-sm text-yellow-700">
                                                This is a system role. Only description and permissions can be modified.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Role Information */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">Role Information</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                            Role Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                                            disabled={role.is_system}
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                                            Level (1-99) *
                                        </label>
                                        <input
                                            type="number"
                                            id="level"
                                            min={1}
                                            max={99}
                                            value={data.level}
                                            onChange={(e) => setData('level', parseInt(e.target.value) || 1)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
                                            disabled={role.is_system}
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Higher levels have more authority. Super Admin is 100.
                                        </p>
                                        {errors.level && (
                                            <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Slug</label>
                                        <input
                                            type="text"
                                            value={role.slug}
                                            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                                            disabled
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Auto-generated from the role name.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">Permissions</h3>
                                <p className="mb-4 text-sm text-gray-600">
                                    Select the permissions this role should have. Selected: {data.permissions.length}
                                </p>

                                <div className="space-y-4">
                                    {Object.entries(permissions).map(([group, groupPermissions]) => {
                                        const groupIds = groupPermissions.map((p) => p.id);
                                        const selectedCount = groupIds.filter((id) => data.permissions.includes(id)).length;
                                        const allSelected = selectedCount === groupIds.length;
                                        const someSelected = selectedCount > 0 && !allSelected;

                                        return (
                                            <div key={group} className="rounded-lg border border-gray-200">
                                                <div
                                                    className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-3"
                                                    onClick={() => toggleGroup(group)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={allSelected}
                                                            ref={(el) => {
                                                                if (el) el.indeterminate = someSelected;
                                                            }}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                toggleGroupPermissions(groupPermissions);
                                                            }}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="font-medium text-gray-900">{group}</span>
                                                        <span className="text-sm text-gray-500">
                                                            ({selectedCount}/{groupIds.length})
                                                        </span>
                                                    </div>
                                                    <svg
                                                        className={`h-5 w-5 transform text-gray-500 transition-transform ${
                                                            expandedGroups.includes(group) ? 'rotate-180' : ''
                                                        }`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>

                                                {expandedGroups.includes(group) && (
                                                    <div className="divide-y divide-gray-100 px-4 py-2">
                                                        {groupPermissions.map((permission) => (
                                                            <label
                                                                key={permission.id}
                                                                className="flex cursor-pointer items-center gap-3 py-2 hover:bg-gray-50"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={data.permissions.includes(permission.id)}
                                                                    onChange={() => togglePermission(permission.id)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {permission.name}
                                                                    </div>
                                                                    {permission.description && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {permission.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {errors.permissions && (
                                    <p className="mt-2 text-sm text-red-600">{errors.permissions}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 border-t pt-6">
                                <Link
                                    href={route('roles.index')}
                                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
