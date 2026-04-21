import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, Button, Badge, Input, EmptyState } from '@/Components/Form';
import MultiSelect from '@/Components/MultiSelect';
import { useState, useRef, useCallback } from 'react';

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
    const [search, setSearch] = useState(filters.search || '');
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [filterValues, setFilterValues] = useState({
        category: filters.category ? filters.category.split(',') : [] as string[],
        status: filters.status ? filters.status.split(',') : [] as string[],
        price_min: filters.price_min || '',
        price_max: filters.price_max || '',
    });

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const buildParams = (overrides: Partial<{ search: string; category: string[]; status: string[]; price_min: string; price_max: string }> = {}) => {
        const merged = {
            search: overrides.search ?? search,
            category: overrides.category ?? filterValues.category,
            status: overrides.status ?? filterValues.status,
            price_min: overrides.price_min ?? filterValues.price_min,
            price_max: overrides.price_max ?? filterValues.price_max,
        };
        const params: Record<string, string> = {};
        if (merged.search) params.search = merged.search;
        if (merged.category.length) params.category = merged.category.join(',');
        if (merged.status.length) params.status = merged.status.join(',');
        if (merged.price_min) params.price_min = merged.price_min;
        if (merged.price_max) params.price_max = merged.price_max;
        return params;
    };

    const applyFilters = useCallback((params: Record<string, string>) => {
        router.get(route('products.index'), params, {
            preserveState: true,
            preserveScroll: true,
            only: ['products', 'filters'],
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
        setSearch('');
        setFilterValues({
            category: [],
            status: [],
            price_min: '',
            price_max: '',
        });
        router.get(route('products.index'));
    };

    const hasActiveFilters =
        filterValues.category.length > 0 ||
        filterValues.status.length > 0 ||
        !!filterValues.price_min ||
        !!filterValues.price_max;

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
        <AuthenticatedLayout header="Products">
            <Head title="Products" />

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
                            <h3 className="text-lg font-semibold text-slate-900">Product Catalog</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Manage your product catalog and inventory
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {hasPermission('products.export') && (
                                <a href={route('products.export', filters)}>
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
                            {hasPermission('products.create') && (
                                <Link href={route('products.create')}>
                                    <button
                                        type="button"
                                        className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all inline-flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Product
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
                                className={`w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-colors focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${
                                    search ? 'border-violet-300 bg-white' : 'border-transparent bg-slate-100 hover:border-slate-300 focus:bg-white'
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
                            {hasActiveFilters && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-md">
                                    Active
                                </span>
                            )}
                        </Button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <form onSubmit={handleFilter} className="mb-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                    <th className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Product
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-900"
                                        onClick={() => handleSort('sku')}
                                    >
                                        <div className="flex items-center gap-2">
                                            SKU {getSortIcon('sku')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-900"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Category {getSortIcon('category')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-900"
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Price {getSortIcon('price')}
                                        </div>
                                    </th>
                                    <th
                                        className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-900"
                                        onClick={() => handleSort('stock_quantity')}
                                    >
                                        <div className="flex items-center gap-2">
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
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 flex-shrink-0">
                                                    {product.image_url ? (
                                                        <img
                                                            className="h-10 w-10 rounded-lg object-cover border border-slate-200"
                                                            src={product.image_url}
                                                            alt={product.name}
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 border border-slate-200">
                                                            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 font-mono">
                                            {product.sku}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                            {product.category}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-900">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm">
                                            <span className={`font-medium ${product.stock_quantity <= 5 ? 'text-red-600' : 'text-slate-600'}`}>
                                                {product.stock_quantity}
                                            </span>
                                            {product.stock_quantity <= 5 && (
                                                <span className="ml-2 text-xs text-red-500">Low</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <Badge variant={getStatusVariant(product.status)}>
                                                {product.status}
                                            </Badge>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={route('products.show', product.id)}
                                                    className="w-8 h-8 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 transition-colors inline-flex items-center justify-center"
                                                    title="View"
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
                                                        title="Edit"
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

                        {products.data.length === 0 && (
                            <div className="p-8">
                                <EmptyState
                                    icon={
                                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    }
                                    title="No products found"
                                    description="Get started by creating your first product"
                                    action={
                                        hasPermission('products.create') && (
                                            <Link href={route('products.create')}>
                                                <Button>Add Product</Button>
                                            </Link>
                                        )
                                    }
                                />
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                                <h3 className="text-lg font-semibold text-slate-900">Delete Product</h3>
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
                                Delete Product
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
