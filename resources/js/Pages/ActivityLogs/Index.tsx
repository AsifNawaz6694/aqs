import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ActivityLog {
    id: number;
    user_id: number | null;
    user: User | null;
    action: string;
    model_type: string | null;
    model_id: number | null;
    description: string | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
}

interface PaginatedLogs {
    data: ActivityLog[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    logs: PaginatedLogs;
    users: User[];
    actions: string[];
    modelTypes: string[];
    filters: {
        user_id?: string;
        action?: string;
        model_type?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

export default function Index({ logs, users, actions, modelTypes, filters }: Props) {
    const { auth } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [detailModal, setDetailModal] = useState<ActivityLog | null>(null);
    const [filterValues, setFilterValues] = useState({
        user_id: filters.user_id || '',
        action: filters.action || '',
        model_type: filters.model_type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        search: filters.search || '',
    });

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value) params[key] = value;
        });
        router.get(route('activity-logs.index'), params, { preserveState: true });
    };

    const clearFilters = () => {
        setFilterValues({
            user_id: '',
            action: '',
            model_type: '',
            date_from: '',
            date_to: '',
            search: '',
        });
        router.get(route('activity-logs.index'));
    };

    const hasActiveFilters = Object.values(filters).some((v) => v);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'created':
                return 'bg-green-100 text-green-800';
            case 'updated':
                return 'bg-blue-100 text-blue-800';
            case 'deleted':
                return 'bg-red-100 text-red-800';
            case 'login':
                return 'bg-purple-100 text-purple-800';
            case 'logout':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    const formatModelType = (type: string | null) => {
        if (!type) return '-';
        return type.split('\\').pop() || type;
    };

    const formatChanges = (oldValues: any, newValues: any) => {
        if (!oldValues && !newValues) return null;

        const changes: { field: string; old: any; new: any }[] = [];

        if (newValues) {
            Object.keys(newValues).forEach((key) => {
                if (key !== 'updated_at' && key !== 'created_at') {
                    changes.push({
                        field: key,
                        old: oldValues?.[key] ?? '-',
                        new: newValues[key] ?? '-',
                    });
                }
            });
        }

        return changes;
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Activity Logs</h2>}
        >
            <Head title="Activity Logs" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Header */}
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-medium">Activity History</h3>
                                    <p className="text-sm text-gray-600">
                                        View all system activity and audit logs
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                                            showFilters || hasActiveFilters
                                                ? 'bg-indigo-100 text-indigo-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                        </svg>
                                        Filters
                                        {hasActiveFilters && (
                                            <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                                                Active
                                            </span>
                                        )}
                                    </button>
                                    {hasPermission('activity-logs.export') && (
                                        <a
                                            href={route('activity-logs.export', filters)}
                                            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                        >
                                            Export CSV
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Filters */}
                            {showFilters && (
                                <form onSubmit={handleFilter} className="mb-6 rounded-lg bg-gray-50 p-4">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Search</label>
                                            <input
                                                type="text"
                                                value={filterValues.search}
                                                onChange={(e) => setFilterValues({ ...filterValues, search: e.target.value })}
                                                placeholder="Search in description..."
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">User</label>
                                            <select
                                                value={filterValues.user_id}
                                                onChange={(e) => setFilterValues({ ...filterValues, user_id: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">All Users</option>
                                                {users.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Action</label>
                                            <select
                                                value={filterValues.action}
                                                onChange={(e) => setFilterValues({ ...filterValues, action: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">All Actions</option>
                                                {actions.map((action) => (
                                                    <option key={action} value={action}>
                                                        {action.charAt(0).toUpperCase() + action.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Model Type</label>
                                            <select
                                                value={filterValues.model_type}
                                                onChange={(e) => setFilterValues({ ...filterValues, model_type: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">All Types</option>
                                                {modelTypes.map((type) => (
                                                    <option key={type} value={type}>
                                                        {formatModelType(type)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date From</label>
                                            <input
                                                type="date"
                                                value={filterValues.date_from}
                                                onChange={(e) => setFilterValues({ ...filterValues, date_from: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Date To</label>
                                            <input
                                                type="date"
                                                value={filterValues.date_to}
                                                onChange={(e) => setFilterValues({ ...filterValues, date_to: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="submit"
                                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                        >
                                            Apply Filters
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Date/Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Action
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Model
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                IP Address
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {logs.data.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {log.user?.name || 'System'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {log.user?.email || '-'}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    <div>{formatModelType(log.model_type)}</div>
                                                    {log.model_id && (
                                                        <div className="text-xs text-gray-400">ID: {log.model_id}</div>
                                                    )}
                                                </td>
                                                <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                                                    {log.description || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {log.ip_address || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    {(log.old_values || log.new_values) && (
                                                        <button
                                                            onClick={() => setDetailModal(log)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                        >
                                                            View
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {logs.data.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                    No activity logs found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {logs.last_page > 1 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Showing {(logs.current_page - 1) * logs.per_page + 1} to{' '}
                                        {Math.min(logs.current_page * logs.per_page, logs.total)} of{' '}
                                        {logs.total} results
                                    </div>
                                    <div className="flex gap-2">
                                        {logs.links.map((link, index) => (
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

            {/* Detail Modal */}
            {detailModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Activity Details</h3>
                            <button
                                onClick={() => setDetailModal(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-500">User:</span>
                                <p>{detailModal.user?.name || 'System'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Action:</span>
                                <p>
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(detailModal.action)}`}>
                                        {detailModal.action}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Model:</span>
                                <p>{formatModelType(detailModal.model_type)} (ID: {detailModal.model_id || '-'})</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Date/Time:</span>
                                <p>{new Date(detailModal.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">IP Address:</span>
                                <p>{detailModal.ip_address || '-'}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-500">Description:</span>
                                <p>{detailModal.description || '-'}</p>
                            </div>
                        </div>

                        {(detailModal.old_values || detailModal.new_values) && (
                            <div className="border-t pt-4">
                                <h4 className="mb-3 font-medium text-gray-900">Changes</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">Field</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">Old Value</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">New Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {formatChanges(detailModal.old_values, detailModal.new_values)?.map((change, i) => (
                                                <tr key={i}>
                                                    <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                                                        {change.field}
                                                    </td>
                                                    <td className="px-4 py-2 text-red-600">
                                                        {typeof change.old === 'object' ? JSON.stringify(change.old) : String(change.old)}
                                                    </td>
                                                    <td className="px-4 py-2 text-green-600">
                                                        {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {detailModal.user_agent && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="mb-2 font-medium text-gray-900">User Agent</h4>
                                <p className="break-all text-xs text-gray-500">{detailModal.user_agent}</p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setDetailModal(null)}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
