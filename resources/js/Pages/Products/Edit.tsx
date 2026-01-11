import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Input, Select, Textarea, Button, Card } from '@/Components/Form';
import { FormEventHandler, useState } from 'react';

interface Product {
    id: number;
    name: string;
    sku: string;
    description: string | null;
    category: string;
    price: number;
    cost_price: number | null;
    stock_quantity: number;
    min_stock_quantity: number;
    unit: string;
    status: string;
    image_url: string | null;
    image_path: string | null;
    specifications: Record<string, string> | null;
}

interface Props {
    product: Product;
    categories: string[];
}

export default function Edit({ product, categories }: Props) {
    const { data, setData, processing, errors } = useForm({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category: product.category,
        price: product.price.toString(),
        cost_price: product.cost_price?.toString() || '',
        stock_quantity: product.stock_quantity.toString(),
        min_stock_quantity: product.min_stock_quantity?.toString() || '0',
        unit: product.unit || 'piece',
        status: product.status,
        image: null as File | null,
        specifications: product.specifications || {},
    });

    const [newCategory, setNewCategory] = useState('');
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(product.image_url);
    const [specKey, setSpecKey] = useState('');
    const [specValue, setSpecValue] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const addSpecification = () => {
        if (specKey.trim() && specValue.trim()) {
            setData('specifications', {
                ...data.specifications,
                [specKey.trim()]: specValue.trim(),
            });
            setSpecKey('');
            setSpecValue('');
        }
    };

    const removeSpecification = (key: string) => {
        const newSpecs = { ...data.specifications };
        delete newSpecs[key];
        setData('specifications', newSpecs);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('name', data.name);
        formData.append('sku', data.sku);
        formData.append('description', data.description);
        formData.append('category', showNewCategory ? newCategory : data.category);
        formData.append('price', data.price);
        if (data.cost_price) formData.append('cost_price', data.cost_price);
        formData.append('stock_quantity', data.stock_quantity);
        formData.append('min_stock_quantity', data.min_stock_quantity);
        formData.append('unit', data.unit);
        formData.append('status', data.status);
        if (data.image) formData.append('image', data.image);
        if (Object.keys(data.specifications).length > 0) {
            formData.append('specifications', JSON.stringify(data.specifications));
        }

        router.post(route('products.update', product.id), formData, {
            forceFormData: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit - ${product.name}`} />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link
                            href={route('products.index')}
                            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Products
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">Edit Product</h1>
                        <p className="text-slate-500 mt-1">Update product information</p>
                    </div>
                </div>

                <form onSubmit={submit}>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Basic Information */}
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Basic Information</h3>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <Input
                                            label="Product Name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter product name"
                                            error={errors.name}
                                            required
                                        />
                                    </div>

                                    <Input
                                        label="SKU"
                                        value={data.sku}
                                        onChange={(e) => setData('sku', e.target.value.toUpperCase())}
                                        placeholder="e.g., PROD-001"
                                        error={errors.sku}
                                        required
                                    />

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Category <span className="text-red-500">*</span>
                                        </label>
                                        {!showNewCategory ? (
                                            <div className="flex gap-2">
                                                <select
                                                    value={data.category}
                                                    onChange={(e) => setData('category', e.target.value)}
                                                    className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl appearance-none cursor-pointer transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    required={!showNewCategory}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map((cat) => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewCategory(true)}
                                                    className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                                                >
                                                    New
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newCategory}
                                                    onChange={(e) => setNewCategory(e.target.value)}
                                                    placeholder="New category name"
                                                    className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    required={showNewCategory}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowNewCategory(false);
                                                        setNewCategory('');
                                                    }}
                                                    className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                        {errors.category && (
                                            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.category}
                                            </p>
                                        )}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <Textarea
                                            label="Description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Enter product description"
                                            rows={4}
                                            error={errors.description}
                                        />
                                    </div>
                                </div>
                            </Card>

                            {/* Pricing */}
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Pricing</h3>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <Input
                                        label="Selling Price (SAR)"
                                        type="number"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        error={errors.price}
                                        required
                                    />

                                    <Input
                                        label="Cost Price (SAR)"
                                        type="number"
                                        value={data.cost_price}
                                        onChange={(e) => setData('cost_price', e.target.value)}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        error={errors.cost_price}
                                        hint="Optional - for profit calculation"
                                    />
                                </div>
                            </Card>

                            {/* Inventory */}
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Inventory</h3>
                                <div className="grid gap-5 sm:grid-cols-4">
                                    <Input
                                        label="Stock Quantity"
                                        type="number"
                                        value={data.stock_quantity}
                                        onChange={(e) => setData('stock_quantity', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        error={errors.stock_quantity}
                                        required
                                    />

                                    <Input
                                        label="Min Stock Alert"
                                        type="number"
                                        value={data.min_stock_quantity}
                                        onChange={(e) => setData('min_stock_quantity', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        error={errors.min_stock_quantity}
                                        hint="Low stock warning"
                                    />

                                    <Input
                                        label="Unit"
                                        value={data.unit}
                                        onChange={(e) => setData('unit', e.target.value)}
                                        placeholder="e.g., piece, kg, box"
                                        error={errors.unit}
                                    />

                                    <Select
                                        label="Status"
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        error={errors.status}
                                        required
                                        options={[
                                            { value: 'active', label: 'Active' },
                                            { value: 'inactive', label: 'Inactive' },
                                            { value: 'discontinued', label: 'Discontinued' },
                                        ]}
                                    />
                                </div>
                            </Card>

                            {/* Specifications */}
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Specifications</h3>
                                <div className="flex gap-3 mb-4">
                                    <input
                                        type="text"
                                        value={specKey}
                                        onChange={(e) => setSpecKey(e.target.value)}
                                        placeholder="Key (e.g., Weight)"
                                        className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    />
                                    <input
                                        type="text"
                                        value={specValue}
                                        onChange={(e) => setSpecValue(e.target.value)}
                                        placeholder="Value (e.g., 5kg)"
                                        className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSpecification}
                                        className="px-5 py-3 rounded-xl bg-violet-100 text-violet-700 text-sm font-medium hover:bg-violet-200 transition-colors whitespace-nowrap"
                                    >
                                        Add
                                    </button>
                                </div>
                                {Object.keys(data.specifications).length > 0 ? (
                                    <div className="rounded-xl border border-slate-200 divide-y divide-slate-200">
                                        {Object.entries(data.specifications).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between px-4 py-3">
                                                <div className="text-sm">
                                                    <span className="font-medium text-slate-900">{key}:</span>{' '}
                                                    <span className="text-slate-600">{value}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSpecification(key)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">No specifications added yet</p>
                                )}
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Product Image */}
                            <Card>
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Product Image</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="h-48 w-48 rounded-2xl object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300">
                                                <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            id="image"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-violet-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                                        />
                                        <p className="mt-2 text-xs text-slate-500 text-center">
                                            Leave empty to keep current image
                                        </p>
                                        {errors.image && (
                                            <p className="mt-1.5 text-xs text-red-600 text-center">{errors.image}</p>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <div className="space-y-3">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        loading={processing}
                                        className="w-full"
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        }
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Link
                                        href={route('products.index')}
                                        className="block w-full text-center px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
