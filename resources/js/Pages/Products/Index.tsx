import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, Input, Select, EmptyState } from '@/Components/Form';
import MultiSelect from '@/Components/MultiSelect';
import { useState } from 'react';

interface Product {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    category: string;
    price: number;
    cost_price: number | null;
    stock_quantity: number;
    unit: string;
    status: 'active' | 'inactive' | 'discontinued';
    image_url: string | null;
    created_at: string;
}

interface PaginatedProducts {
    data: Product[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    products: PaginatedProducts;
    categories: string[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
        price_min?: string;
        price_max?: string;
        sort?: string;
        direction?: string;
    };
}

export default function Index({ products, categories, filters }: Props) {
    const { auth, flash } = usePage().props as any;
    const [showFilters, setShowFilters] = useState(false);
    const [deleteModal, setDeleteModal] = useState<Product | null>(null);
    const [filterValues, setFilterValues] = useState({
        search: filters.search || '',
        category: filters.category ? filters.category.split(',') : [] as string[],
        status: filters.status ? filters.status.split(',') : [] as string[],
        price_min: filters.price_min || '',
        price_max: filters.price_max || '',
    });

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const params: Record<string, string> = {};
        Object.entries(filterValues).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                if (value.length > 0) params[key] = value.join(',');
            } else if (value) {
                params[key] = value;
            }
        });
        router.get(route('products.index'), params, { preserveState: true });
    };

    const handleSort = (field: string) => {
        const direction = filters.sort === field && filters.direction === 'asc' ? 'desc' : 'asc';
        router.get(route('products.index'), { ...filters, sort: field, direction }, { preserveState: true });
    };

    const handleDelete = () => {
        if (deleteModal) {
            router.delete(route('products.destroy', deleteModal.id), {
                onSuccess: () => setDeleteModal(null),
            });
        }
    };

    const clearFilters = () => {
        setFilterValues({
            search: '',
            category: [],
            status: [],
            price_min: '',
            price_max: '',
        });
        router.get(route('products.index'));
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

    const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'default' => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'warning';
            case 'discontinued': return 'danger';
            default: return 'default';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: 'SAR',
        }).format(value);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Products" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                        <p className="text-slate-500 mt-1">Manage your product catalog and inventory</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                showFilters || hasActiveFilters
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {hasActiveFilters && (
                                <span className="ml-1 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
                                    Active
                                </span>
                            )}
                        </button>
                        {hasPermission('products.export') && (
                            <a
                                href={route('products.export', filters)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </a>
                        )}
                        {hasPermission('products.create') && (
                            <Link
                                href={route('products.create')}
                                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all inline-flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Product
                            </Link>
                        )}
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <Card>
                        <form onSubmit={handleFilter}>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                                <Input
                                    label="Search"
                                    value={filterValues.search}
                                    onChange={(e) => setFilterValues({ ...filterValues, search: e.target.value })}
                                    placeholder="Name, SKU..."
                                />
                                <MultiSelect
                                    label="Category"
                                    options={categories.map(c => ({ value: c, label: c }))}
                                    value={filterValues.category}
                                    onChange={(val) => setFilterValues({ ...filterValues, category: val })}
                                    placeholder="All Categories"
                                    searchPlaceholder="Search categories..."
                                />
                                <MultiSelect
                                    label="Status"
                                    options={[
                                        { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
                                        { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-700' },
                                        { value: 'discontinued', label: 'Discontinued', color: 'bg-slate-100 text-slate-500' },
                                    ]}
                                    value={filterValues.status}
                                    onChange={(val) => setFilterValues({ ...filterValues, status: val })}
                                    placeholder="All Statuses"
                                    searchable={false}
                                />
                                <Input
                                    label="Min Price"
                                    type="number"
                                    value={filterValues.price_min}
                                    onChange={(e) => setFilterValues({ ...filterValues, price_min: e.target.value })}
                                    placeholder="0"
                                    min="0"
                                />
                                <Input
                                    label="Max Price"
                                    type="number"
                                    value={filterValues.price_max}
                                    onChange={(e) => setFilterValues({ ...filterValues, price_max: e.target.value })}
                                    placeholder="Any"
                                    min="0"
                                />
                            </div>
                            <div className="mt-4 flex justify-end gap-3">
                                <Button type="button" variant="secondary" onClick={clearFilters}>
                                    Clear
                                </Button>
                                <Button type="submit" variant="primary">
                                    Apply Filters
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Products Table */}
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Product
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700"
                                        onClick={() => handleSort('sku')}
                                    >
                                        <div className="flex items-center gap-1">
                                            SKU {getSortIcon('sku')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Category {getSortIcon('category')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700"
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Price {getSortIcon('price')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700"
                                        onClick={() => handleSort('stock_quantity')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Stock {getSortIcon('stock_quantity')}
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
                                {products.data.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 flex-shrink-0">
                                                    {product.image_url ? (
                                                        <img
                                                            className="h-12 w-12 rounded-xl object-cover border border-slate-200"
                                                            src={product.image_url}
                                                            alt={product.name}
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
                                                            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{product.name}</div>
                                                    {product.unit && (
                                                        <div className="text-xs text-slate-500">per {product.unit}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 font-mono">
                                            {product.sku}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                                            {product.category}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                                            <span className={`font-medium ${product.stock_quantity <= 5 ? 'text-red-600' : 'text-slate-600'}`}>
                                                {product.stock_quantity}
                                            </span>
                                            {product.stock_quantity <= 5 && (
                                                <span className="ml-2 text-xs text-red-500">Low</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <Badge variant={getStatusVariant(product.status)}>
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={route('products.show', product.id)}
                                                    className="w-8 h-8 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </Link>
                                                {hasPermission('products.edit') && (
                                                    <Link
                                                        href={route('products.edit', product.id)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </Link>
                                                )}
                                                {hasPermission('products.delete') && (
                                                    <button
                                                        onClick={() => setDeleteModal(product)}
                                                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center justify-center"
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

                        {products.data.length === 0 && (
                            <div className="py-12">
                                <EmptyState
                                    icon={
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    }
                                    title="No products found"
                                    description="Get started by creating your first product."
                                    action={
                                        hasPermission('products.create') && (
                                            <Link href={route('products.create')}>
                                                <Button variant="primary">Add Product</Button>
                                            </Link>
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                Showing {(products.current_page - 1) * products.per_page + 1} to{' '}
                                {Math.min(products.current_page * products.per_page, products.total)} of{' '}
                                {products.total} results
                            </div>
                            <div className="flex gap-1">
                                {products.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">Delete Product</h3>
                                <p className="text-sm text-slate-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="mb-6 text-sm text-slate-600">
                            Are you sure you want to delete <span className="font-medium">"{deleteModal.name}"</span>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setDeleteModal(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>
                                Delete Product
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
