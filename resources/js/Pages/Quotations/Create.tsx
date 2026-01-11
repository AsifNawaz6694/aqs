import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RichTextEditor from '@/Components/RichTextEditor';
import { useState, useEffect, useCallback } from 'react';

interface Client {
    id: number;
    display_name: string;
    email: string;
    phone: string | null;
    company_name: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
}

interface Product {
    id: number;
    sku: string;
    name: string;
    price: number;
}

interface QuotationItem {
    id?: number;
    product_id: number | null;
    sku: string;
    name: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    vat_rate: number;
    is_custom: boolean;
}

interface Props {
    clients: Client[];
    defaultTerms: string;
    vatRate: number;
    currencies: string[];
}

export default function Create({ clients = [], defaultTerms = '', vatRate = 15, currencies = ['SAR'] }: Props) {
    const { flash } = usePage().props as any;
    const [items, setItems] = useState<QuotationItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        quotation_date: new Date().toISOString().split('T')[0],
        valid_until: '',
        reference_number: '',
        currency: 'SAR',
        discount_type: 'percentage' as 'percentage' | 'fixed',
        discount_value: 0,
        transport_charges: 0,
        transport_free: false,
        notes: '',
        terms_and_conditions: defaultTerms,
        items: [] as QuotationItem[],
    });

    // Calculate totals
    const calculateItemTotal = (item: QuotationItem) => {
        const subtotal = item.quantity * item.unit_price;
        let discountAmount = 0;
        if (item.discount_type === 'percentage') {
            discountAmount = subtotal * (item.discount_value / 100);
        } else {
            discountAmount = item.discount_value;
        }
        const afterDiscount = subtotal - discountAmount;
        const vatAmount = afterDiscount * (item.vat_rate / 100);
        return {
            subtotal,
            discountAmount,
            afterDiscount,
            vatAmount,
            total: afterDiscount + vatAmount,
        };
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalItemDiscount = 0;
        let totalVat = 0;

        items.forEach((item) => {
            const calc = calculateItemTotal(item);
            subtotal += calc.subtotal;
            totalItemDiscount += calc.discountAmount;
            totalVat += calc.vatAmount;
        });

        const afterItemDiscounts = subtotal - totalItemDiscount;

        let quotationDiscount = 0;
        if (data.discount_type === 'percentage') {
            quotationDiscount = afterItemDiscounts * (data.discount_value / 100);
        } else {
            quotationDiscount = data.discount_value;
        }

        const transportCharges = data.transport_free ? 0 : data.transport_charges;
        const grandTotal = afterItemDiscounts - quotationDiscount + totalVat + transportCharges;

        return {
            subtotal,
            totalItemDiscount,
            afterItemDiscounts,
            quotationDiscount,
            totalDiscount: totalItemDiscount + quotationDiscount,
            totalVat,
            transportCharges,
            grandTotal,
        };
    };

    const totals = calculateTotals();

    // Product search with debounce
    const searchProducts = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(`${route('quotations.search-products')}?search=${encodeURIComponent(query)}`);
            const data = await response.json();
            setSearchResults(data.products || []);
        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
        }
        setIsSearching(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) {
                searchProducts(searchQuery);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, searchProducts]);

    // Sync items state with form data
    useEffect(() => {
        setData('items', items as any);
    }, [items]);

    const addItem = () => {
        const newItem: QuotationItem = {
            product_id: null,
            sku: '',
            name: '',
            description: '',
            quantity: 1,
            unit: 'pc',
            unit_price: 0,
            discount_type: 'percentage',
            discount_value: 0,
            vat_rate: vatRate,
            is_custom: false,
        };
        setItems([...items, newItem]);
    };

    const addCustomItem = () => {
        const newItem: QuotationItem = {
            product_id: null,
            sku: '',
            name: '',
            description: '',
            quantity: 1,
            unit: 'pc',
            unit_price: 0,
            discount_type: 'percentage',
            discount_value: 0,
            vat_rate: vatRate,
            is_custom: true,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuotationItem, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const selectProduct = (product: Product, index: number) => {
        const updated = [...items];
        updated[index] = {
            ...updated[index],
            product_id: product.id,
            sku: product.sku,
            name: product.name,
            unit_price: product.price,
            is_custom: false,
        };
        setItems(updated);
        setShowProductSearch(false);
        setSearchQuery('');
        setSearchResults([]);
        setActiveItemIndex(null);
    };

    const handleSubmit = (e: React.FormEvent, saveAsDraft = true) => {
        e.preventDefault();

        if (items.length === 0) {
            alert('Please add at least one item to the quotation.');
            return;
        }

        post(route('quotations.store'), {
            preserveScroll: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AuthenticatedLayout header="Create Quotation">
            <Head title="Create Quotation" />

            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href={route('quotations.index')} className="text-slate-500 hover:text-violet-600">
                        Quotations
                    </Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-900 font-medium">Create New</span>
                </div>

                <form onSubmit={(e) => handleSubmit(e, true)}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Client & Basic Info */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quotation Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Client <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.client_id}
                                            onChange={(e) => setData('client_id', e.target.value)}
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        >
                                            <option value="">Select a client</option>
                                            {clients.map((client) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.display_name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.client_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Quotation Date <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={data.quotation_date}
                                            onChange={(e) => setData('quotation_date', e.target.value)}
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                        {errors.quotation_date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.quotation_date}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Valid Until
                                        </label>
                                        <input
                                            type="date"
                                            value={data.valid_until}
                                            onChange={(e) => setData('valid_until', e.target.value)}
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Reference Number
                                        </label>
                                        <input
                                            type="text"
                                            value={data.reference_number}
                                            onChange={(e) => setData('reference_number', e.target.value)}
                                            placeholder="e.g., PO-12345"
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Currency
                                        </label>
                                        <select
                                            value={data.currency}
                                            onChange={(e) => setData('currency', e.target.value)}
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        >
                                            {currencies.map((currency) => (
                                                <option key={currency} value={currency}>{currency}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Add Product
                                        </button>
                                        <button
                                            type="button"
                                            onClick={addCustomItem}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Custom Item
                                        </button>
                                    </div>
                                </div>

                                {items.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                                        <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <p className="mt-4 text-slate-500 font-medium">No items added</p>
                                        <p className="text-slate-400 text-sm">Click "Add Product" or "Custom Item" to start</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item, index) => (
                                            <div key={index} className="p-4 border border-slate-200 rounded-xl bg-slate-50">
                                                <div className="flex items-start justify-between mb-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-700">
                                                        Item #{index + 1} {item.is_custom && '(Custom)'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-12 gap-3">
                                                    {/* Product Selection / Name */}
                                                    <div className="col-span-12 md:col-span-5">
                                                        {item.is_custom ? (
                                                            <input
                                                                type="text"
                                                                value={item.name}
                                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                                placeholder="Item name"
                                                                className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                            />
                                                        ) : (
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={item.name || searchQuery}
                                                                    onChange={(e) => {
                                                                        setSearchQuery(e.target.value);
                                                                        setActiveItemIndex(index);
                                                                        setShowProductSearch(true);
                                                                        if (!e.target.value) {
                                                                            updateItem(index, 'name', '');
                                                                            updateItem(index, 'product_id', null);
                                                                        }
                                                                    }}
                                                                    onFocus={() => {
                                                                        setActiveItemIndex(index);
                                                                        if (searchQuery) setShowProductSearch(true);
                                                                    }}
                                                                    placeholder="Search products..."
                                                                    className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                                />
                                                                {showProductSearch && activeItemIndex === index && searchResults.length > 0 && (
                                                                    <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-auto">
                                                                        {searchResults.map((product) => (
                                                                            <button
                                                                                key={product.id}
                                                                                type="button"
                                                                                onClick={() => selectProduct(product, index)}
                                                                                className="w-full px-4 py-2 text-left hover:bg-violet-50 text-sm"
                                                                            >
                                                                                <div className="font-medium text-slate-900">{product.name}</div>
                                                                                <div className="text-slate-500 text-xs">SKU: {product.sku} | Price: {formatCurrency(product.price)}</div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* SKU */}
                                                    <div className="col-span-4 md:col-span-2">
                                                        <input
                                                            type="text"
                                                            value={item.sku}
                                                            onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                                            placeholder="SKU"
                                                            className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                            readOnly={!item.is_custom && !!item.product_id}
                                                        />
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="col-span-4 md:col-span-1">
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            min="0.01"
                                                            step="0.01"
                                                            placeholder="Qty"
                                                            className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                        />
                                                    </div>

                                                    {/* Unit Price */}
                                                    <div className="col-span-4 md:col-span-2">
                                                        <input
                                                            type="number"
                                                            value={item.unit_price}
                                                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="Unit Price"
                                                            className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                        />
                                                    </div>

                                                    {/* Line Total */}
                                                    <div className="col-span-12 md:col-span-2 flex items-center justify-end">
                                                        <span className="font-semibold text-slate-900">
                                                            {data.currency} {formatCurrency(calculateItemTotal(item).total)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Description & Discount Row */}
                                                <div className="grid grid-cols-12 gap-3 mt-3">
                                                    <div className="col-span-12 md:col-span-6">
                                                        <input
                                                            type="text"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                            placeholder="Item description (optional)"
                                                            className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2">
                                                        <select
                                                            value={item.discount_type}
                                                            onChange={(e) => updateItem(index, 'discount_type', e.target.value)}
                                                            className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                        >
                                                            <option value="percentage">% Discount</option>
                                                            <option value="fixed">Fixed Discount</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2">
                                                        <input
                                                            type="number"
                                                            value={item.discount_value}
                                                            onChange={(e) => updateItem(index, 'discount_value', parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="Discount"
                                                            className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-4 md:col-span-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm text-slate-500">VAT:</span>
                                                            <input
                                                                type="number"
                                                                value={item.vat_rate}
                                                                onChange={(e) => updateItem(index, 'vat_rate', parseFloat(e.target.value) || 0)}
                                                                min="0"
                                                                max="100"
                                                                step="0.01"
                                                                className="block w-full px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                            />
                                                            <span className="text-sm text-slate-500">%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes & Terms */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Notes & Terms</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Internal Notes
                                        </label>
                                        <textarea
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={3}
                                            placeholder="Notes visible to client on the quotation..."
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <RichTextEditor
                                            label="Terms & Conditions"
                                            content={data.terms_and_conditions}
                                            onChange={(html) => setData('terms_and_conditions', html)}
                                            placeholder="Enter terms and conditions..."
                                            minHeight="180px"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                {/* Totals Card */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="text-slate-900">{data.currency} {formatCurrency(totals.subtotal)}</span>
                                        </div>

                                        {totals.totalItemDiscount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Item Discounts</span>
                                                <span className="text-emerald-600">-{formatCurrency(totals.totalItemDiscount)}</span>
                                            </div>
                                        )}

                                        {/* Quotation Discount */}
                                        <div className="pt-3 border-t border-slate-200">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Additional Discount
                                            </label>
                                            <div className="flex gap-2">
                                                <select
                                                    value={data.discount_type}
                                                    onChange={(e) => setData('discount_type', e.target.value as 'percentage' | 'fixed')}
                                                    className="px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                >
                                                    <option value="percentage">%</option>
                                                    <option value="fixed">{data.currency}</option>
                                                </select>
                                                <input
                                                    type="number"
                                                    value={data.discount_value}
                                                    onChange={(e) => setData('discount_value', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    step="0.01"
                                                    className="flex-1 px-3 py-2.5 text-slate-900 text-sm bg-white border border-slate-300 rounded-lg transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                />
                                            </div>
                                        </div>

                                        {totals.quotationDiscount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Discount</span>
                                                <span className="text-emerald-600">-{formatCurrency(totals.quotationDiscount)}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">VAT ({vatRate}%)</span>
                                            <span className="text-slate-900">{formatCurrency(totals.totalVat)}</span>
                                        </div>

                                        {/* Transport */}
                                        <div className="pt-3 border-t border-slate-200">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                                Transport/Delivery
                                            </label>
                                            <div className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    id="transport_free"
                                                    checked={data.transport_free}
                                                    onChange={(e) => setData('transport_free', e.target.checked)}
                                                    className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                                                />
                                                <label htmlFor="transport_free" className="text-sm text-slate-600">
                                                    Free delivery
                                                </label>
                                            </div>
                                            <input
                                                type="number"
                                                value={data.transport_charges}
                                                onChange={(e) => setData('transport_charges', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                                disabled={data.transport_free}
                                                className={`w-full px-3 py-2.5 text-slate-900 text-sm border border-slate-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${data.transport_free ? 'bg-slate-100 cursor-not-allowed' : 'bg-white hover:border-slate-400'}`}
                                            />
                                        </div>

                                        {totals.transportCharges > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500">Transport</span>
                                                <span className="text-slate-900">{formatCurrency(totals.transportCharges)}</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t-2 border-slate-900">
                                            <div className="flex justify-between">
                                                <span className="text-lg font-semibold text-slate-900">Grand Total</span>
                                                <span className="text-lg font-bold text-violet-600">
                                                    {data.currency} {formatCurrency(totals.grandTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <div className="space-y-3">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save as Draft
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => handleSubmit(e, false)}
                                            disabled={processing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-all disabled:opacity-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Save & Submit for Review
                                        </button>
                                        <Link
                                            href={route('quotations.index')}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
