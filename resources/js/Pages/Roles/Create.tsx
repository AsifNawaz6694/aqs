import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useState } from 'react';

interface Permission {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

interface Props {
    permissions: Record<string, Permission[]>;
}

export default function Create({ permissions }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        level: 50,
        permissions: [] as number[],
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
        post(route('roles.store'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Create Role</h2>}
        >
            <Head title="Create Role" />

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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Higher levels have more authority. Super Admin is 100.
                                        </p>
                                        {errors.level && (
                                            <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                                        )}
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
                                    {processing ? 'Creating...' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
