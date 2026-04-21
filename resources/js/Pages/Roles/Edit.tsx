import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Input, Textarea, Button } from '@/Components/Form';
import { FormEventHandler, useMemo, useState } from 'react';

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
    const [permissionSearch, setPermissionSearch] = useState('');

    const allPermissionIds = useMemo(
        () => Object.values(permissions).flat().map((p) => p.id),
        [permissions]
    );

    const filteredPermissions = useMemo(() => {
        if (!permissionSearch.trim()) return permissions;
        const needle = permissionSearch.toLowerCase();
        const result: Record<string, Permission[]> = {};
        Object.entries(permissions).forEach(([group, perms]) => {
            const matched = perms.filter(
                (p) =>
                    p.name.toLowerCase().includes(needle) ||
                    p.slug.toLowerCase().includes(needle) ||
                    (p.description || '').toLowerCase().includes(needle) ||
                    group.toLowerCase().includes(needle)
            );
            if (matched.length) result[group] = matched;
        });
        return result;
    }, [permissions, permissionSearch]);

    const toggleGroup = (group: string) => {
        setExpandedGroups((prev) =>
            prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
        );
    };

    const togglePermission = (permissionId: number) => {
        setData(
            'permissions',
            data.permissions.includes(permissionId)
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
                if (!newPermissions.includes(id)) newPermissions.push(id);
            });
            setData('permissions', newPermissions);
        }
    };

    const selectAll = () => setData('permissions', allPermissionIds);
    const clearAll = () => setData('permissions', []);

    const expandAll = () => setExpandedGroups(Object.keys(permissions));
    const collapseAll = () => setExpandedGroups([]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('roles.update', role.id));
    };

    return (
        <AuthenticatedLayout header="Edit Role">
            <Head title={`Edit Role - ${role.name}`} />

            <form onSubmit={submit} className="space-y-6">
                {/* Back link */}
                <div>
                    <Link
                        href={route('roles.index')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Roles
                    </Link>
                </div>

                {role.is_system && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-semibold text-amber-900">System Role</h3>
                                <p className="mt-1 text-sm text-amber-800">
                                    This is a system role. Only the description and permissions can be modified.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role Information */}
                <Card>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">Role Information</h3>
                        <p className="text-sm text-slate-500 mt-1">Identify and position this role within your hierarchy.</p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Input
                                label="Role Name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                disabled={role.is_system}
                                required
                                error={errors.name}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Textarea
                                label="Description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                error={errors.description}
                            />
                        </div>

                        <Input
                            label="Level"
                            type="number"
                            min={1}
                            max={99}
                            value={data.level}
                            onChange={(e) => setData('level', parseInt(e.target.value) || 1)}
                            disabled={role.is_system}
                            required
                            hint="1–99. Higher levels carry more authority. Super Admin is 100."
                            error={errors.level}
                        />

                        <Input
                            label="Slug"
                            value={role.slug}
                            disabled
                            hint="Auto-generated from the role name."
                        />
                    </div>
                </Card>

                {/* Permissions */}
                <Card>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Permissions</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {data.permissions.length} of {allPermissionIds.length} selected
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" size="sm" onClick={expandAll}>
                                Expand All
                            </Button>
                            <Button type="button" variant="secondary" size="sm" onClick={collapseAll}>
                                Collapse All
                            </Button>
                            <Button type="button" variant="secondary" size="sm" onClick={selectAll}>
                                Select All
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Permission search */}
                    <div className="relative mb-5">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={permissionSearch}
                            onChange={(e) => setPermissionSearch(e.target.value)}
                            placeholder="Filter permissions..."
                            className={`w-full h-11 pl-10 pr-4 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                permissionSearch ? 'border-violet-300' : 'border-transparent bg-slate-100 hover:border-slate-300 focus:bg-white'
                            }`}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        {Object.entries(filteredPermissions).map(([group, groupPermissions]) => {
                            const groupIds = groupPermissions.map((p) => p.id);
                            const selectedCount = groupIds.filter((id) => data.permissions.includes(id)).length;
                            const allSelected = selectedCount === groupIds.length;
                            const someSelected = selectedCount > 0 && !allSelected;
                            const isExpanded = expandedGroups.includes(group);

                            return (
                                <div key={group} className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                                    <div
                                        className="flex cursor-pointer items-center justify-between bg-slate-50/80 px-4 py-3 border-b border-slate-200 hover:bg-slate-100 transition-colors"
                                        onClick={() => toggleGroup(group)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={allSelected}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = someSelected;
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => toggleGroupPermissions(groupPermissions)}
                                                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20"
                                            />
                                            <span className="font-semibold text-slate-900 capitalize">{group}</span>
                                            <span className="text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                                                {selectedCount}/{groupIds.length}
                                            </span>
                                        </div>
                                        <svg
                                            className={`h-5 w-5 transform text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>

                                    {isExpanded && (
                                        <div className="divide-y divide-slate-100">
                                            {groupPermissions.map((permission) => {
                                                const checked = data.permissions.includes(permission.id);
                                                return (
                                                    <label
                                                        key={permission.id}
                                                        className={`flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors ${
                                                            checked ? 'bg-violet-50/50' : 'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={() => togglePermission(permission.id)}
                                                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/20"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-slate-900">
                                                                {permission.name}
                                                            </div>
                                                            {permission.description && (
                                                                <div className="text-xs text-slate-500 mt-0.5">
                                                                    {permission.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {Object.keys(filteredPermissions).length === 0 && (
                        <div className="py-10 text-center text-sm text-slate-500">
                            No permissions match your search.
                        </div>
                    )}

                    {errors.permissions && (
                        <p className="mt-3 text-sm text-red-600">{errors.permissions}</p>
                    )}
                </Card>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                    <Link href={route('roles.index')}>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </Link>
                    <Button type="submit" loading={processing}>
                        {processing ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
