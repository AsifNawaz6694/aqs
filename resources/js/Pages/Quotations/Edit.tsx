import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RichTextEditor from '@/Components/RichTextEditor';
import SearchableSelect from '@/Components/SearchableSelect';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

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

interface ProductSpecifications {
    voltage?: string;
    power?: string;
    frequency?: string;
    dimensions?: { length?: number; width?: number; height?: number };
    weight?: number;
    weight_unit?: string;
}

interface Product {
    id: number;
    sku: string;
    external_reference: string | null;
    name: string;
    price: number;
    image_url: string | null;
    category: string | null;
    brand: string | null;
    voltage: string | null;
    power: string | null;
    frequency: string | null;
    dimensions: { length?: number; width?: number; height?: number } | null;
    weight: number | null;
    weight_unit: string | null;
    amperage: number | null;
    specifications: ProductSpecifications | null;
}

interface QuotationItemData {
    id?: number;
    product_id: number | null;
    sku: string;
    external_reference: string;
    name: string;
    original_name: string;
    description: string;
    quantity: number;
    requested_quantity: number;
    unit: string;
    unit_price: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    vat_rate: number;
    is_custom: boolean;
    is_free: boolean;
    image_url: string | null;
    product_specifications: ProductSpecifications | null;
}

interface Quotation {
    id: number;
    quotation_number: string;
    client_id: number;
    quotation_date: string;
    valid_until: string | null;
    expected_delivery_date: string | null;
    reference: string | null;
    customer_reference: string | null;
    currency: string;
    country: string | null;
    phone_code?: string;
    phone_number?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    transport_charges: number;
    transport_free: boolean;
    transport_notes: string | null;
    internal_notes: string | null;
    terms_and_conditions: string | null;
    total_amperes: number | null;
    items: QuotationItemData[];
    created_at: string;
    updated_at: string;
}

interface Props {
    quotation: Quotation;
    clients: Client[];
    defaultTerms: string;
    vatRate: number;
    currencies: string[];
    countries?: string[];
}

// GCC Countries with flags, phone codes, and validation rules
const GCC_COUNTRIES = [
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phoneCode: '+966', phoneRegex: /^5\d{8}$/, phoneLength: 9, phoneHint: 'Must start with 5, 9 digits (e.g., 5XXXXXXXX)' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phoneCode: '+971', phoneRegex: /^5\d{8}$/, phoneLength: 9, phoneHint: 'Must start with 5, 9 digits (e.g., 5XXXXXXXX)' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', phoneCode: '+974', phoneRegex: /^[3567]\d{7}$/, phoneLength: 8, phoneHint: '8 digits (e.g., 3XXXXXXX)' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', phoneCode: '+965', phoneRegex: /^[569]\d{7}$/, phoneLength: 8, phoneHint: 'Must start with 5, 6, or 9, 8 digits' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', phoneCode: '+973', phoneRegex: /^[36]\d{7}$/, phoneLength: 8, phoneHint: 'Must start with 3 or 6, 8 digits' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', phoneCode: '+968', phoneRegex: /^[79]\d{7}$/, phoneLength: 8, phoneHint: 'Must start with 7 or 9, 8 digits' },
];

// GCC Cities by country
const GCC_CITIES: Record<string, string[]> = {
    'Saudi Arabia': [
        'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran',
        'Jubail', 'Yanbu', 'Tabuk', 'Abha', 'Khamis Mushait', 'Najran', 'Jazan',
        'Hofuf', 'Buraidah', 'Taif', 'Hail', 'Arar', 'Sakaka',
    ],
    'United Arab Emirates': [
        'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
        'Fujairah', 'Umm Al Quwain', 'Al Ain',
    ],
    'Qatar': [
        'Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan', 'Umm Salal', 'Mesaieed',
    ],
    'Kuwait': [
        'Kuwait City', 'Hawalli', 'Salmiya', 'Farwaniya', 'Jahra', 'Ahmadi', 'Mangaf',
    ],
    'Bahrain': [
        'Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'Isa Town', 'Sitra',
    ],
    'Oman': [
        'Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Ibri', 'Seeb', 'Barka',
    ],
};

export default function Edit({
    quotation,
    clients: initialClients,
    defaultTerms,
    vatRate,
}: Props) {
    const { flash } = usePage().props as any;
    const [clients, setClients] = useState<Client[]>(initialClients);
    const [items, setItems] = useState<QuotationItemData[]>(
        quotation.items.map(item => ({
            ...item,
            external_reference: item.external_reference || '',
            original_name: item.original_name || '',
            requested_quantity: item.requested_quantity || item.quantity,
            is_free: item.is_free || false,
            image_url: item.image_url || null,
            product_specifications: item.product_specifications || null,
        }))
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // New client modal state
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientErrors, setNewClientErrors] = useState<Record<string, string>>({});
    const [newClient, setNewClient] = useState({
        name: '',
        company_name: '',
        email: '',
        phone_code: '+966',
        phone: '',
        address: '',
        city: '',
        country: 'Saudi Arabia',
        contact_person: '',
    });

    // Sync phone code with country selection for new client
    const handleNewClientCountryChange = (countryName: string) => {
        const country = GCC_COUNTRIES.find(c => c.name === countryName);
        if (country) {
            setNewClient(prev => ({
                ...prev,
                country: country.name,
                phone_code: country.phoneCode,
                city: '', // Reset city when country changes
            }));
        }
    };

    // Find initial country based on quotation data
    const findInitialCountry = () => {
        const found = GCC_COUNTRIES.find(c => c.name === quotation.country);
        return found || GCC_COUNTRIES[0];
    };

    const initialCountry = findInitialCountry();

    const { data, setData, put, processing, errors } = useForm({
        client_id: quotation.client_id.toString(),
        quotation_date: quotation.quotation_date.split('T')[0],
        valid_until: quotation.valid_until ? quotation.valid_until.split('T')[0] : '',
        expected_delivery_date: quotation.expected_delivery_date ? quotation.expected_delivery_date.split('T')[0] : '',
        reference: quotation.reference || '',
        customer_reference: quotation.customer_reference || '',
        currency: 'SAR',
        country: initialCountry.name,
        phone_code: quotation.phone_code || initialCountry.phoneCode,
        phone_number: quotation.phone_number || '',
        discount_type: quotation.discount_type,
        discount_value: quotation.discount_value,
        transport_charges: quotation.transport_charges,
        transport_free: quotation.transport_free,
        transport_notes: quotation.transport_notes || '',
        internal_notes: quotation.internal_notes || '',
        terms_and_conditions: quotation.terms_and_conditions || defaultTerms,
        items: quotation.items,
    });

    // Calculate item totals (VAT-exclusive display)
    const calculateItemTotal = (item: QuotationItemData) => {
        if (item.is_free) {
            return {
                subtotal: 0,
                discountAmount: 0,
                afterDiscount: 0,
                vatAmount: 0,
                total: 0,
                unitPriceExclVat: item.unit_price,
                lineTotalExclVat: 0,
            };
        }

        const subtotal = item.quantity * item.unit_price;
        let discountAmount = 0;
        if (item.discount_type === 'percentage') {
            discountAmount = subtotal * (item.discount_value / 100);
        } else {
            discountAmount = item.discount_value * item.quantity;
        }
        const afterDiscount = subtotal - discountAmount;
        const vatAmount = afterDiscount * (item.vat_rate / 100);

        return {
            subtotal,
            discountAmount,
            afterDiscount,
            vatAmount,
            total: afterDiscount + vatAmount,
            unitPriceExclVat: item.unit_price,
            lineTotalExclVat: afterDiscount,
        };
    };

    // Calculate amperage for an item
    const calculateAmperage = (specs: ProductSpecifications | null): number | null => {
        if (!specs?.power || !specs?.voltage) return null;

        const extractNumeric = (value: string | number | null | undefined): number => {
            if (typeof value === 'number') return value;
            if (!value) return 0;
            const match = String(value).match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        };

        const power = extractNumeric(specs.power);
        const voltage = extractNumeric(specs.voltage);

        if (power > 0 && voltage > 0) {
            return Math.round((power / voltage) * 100) / 100;
        }
        return null;
    };

    // Calculate totals
    const calculateTotals = () => {
        let subtotal = 0;
        let totalItemDiscount = 0;
        let totalVat = 0;
        let totalAmperes = 0;

        items.forEach((item) => {
            if (!item.is_free) {
                const calc = calculateItemTotal(item);
                subtotal += calc.subtotal;
                totalItemDiscount += calc.discountAmount;
                totalVat += calc.vatAmount;
            }

            // Calculate amperage
            const amperage = calculateAmperage(item.product_specifications);
            if (amperage) {
                totalAmperes += amperage * item.quantity;
            }
        });

        const afterItemDiscounts = subtotal - totalItemDiscount;

        let quotationDiscount = 0;
        if (data.discount_type === 'percentage') {
            quotationDiscount = afterItemDiscounts * (data.discount_value / 100);
        } else {
            quotationDiscount = data.discount_value;
        }

        const transportCharges = data.transport_free ? 0 : data.transport_charges;
        const transportVat = transportCharges * (vatRate / 100);
        const totalBeforeVat = afterItemDiscounts - quotationDiscount + transportCharges;
        const grandTotal = totalBeforeVat + totalVat + transportVat;

        return {
            subtotal,
            totalItemDiscount,
            afterItemDiscounts,
            quotationDiscount,
            totalDiscount: totalItemDiscount + quotationDiscount,
            totalBeforeVat,
            totalVat: totalVat + transportVat,
            transportCharges,
            grandTotal,
            totalAmperes: Math.round(totalAmperes * 100) / 100,
        };
    };

    const totals = calculateTotals();

    // Product search with debounce - faster 200ms
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
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (searchQuery.length >= 2) {
            searchTimeoutRef.current = setTimeout(() => {
                searchProducts(searchQuery);
            }, 200);
        } else {
            setSearchResults([]);
            setShowSearchDropdown(false);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, searchProducts]);

    // Sync items state with form data
    useEffect(() => {
        setData('items', items as any);
    }, [items]);

    // Handle country change - sync phone code
    const handleCountryChange = (countryName: string) => {
        const country = GCC_COUNTRIES.find(c => c.name === countryName);
        if (country) {
            setData('country', country.name);
            setData('phone_code', country.phoneCode);
        }
    };

    // Add product from search directly to items
    const addProductFromSearch = (product: Product) => {
        const newItem: QuotationItemData = {
            product_id: product.id,
            sku: product.sku,
            external_reference: product.external_reference || '',
            name: product.name,
            original_name: '',
            description: '',
            quantity: 1,
            requested_quantity: 1,
            unit: 'pc',
            unit_price: product.price,
            discount_type: 'percentage',
            discount_value: 0,
            vat_rate: vatRate,
            is_custom: false,
            is_free: false,
            image_url: product.image_url,
            product_specifications: {
                voltage: product.voltage || undefined,
                power: product.power || undefined,
                frequency: product.frequency || undefined,
                dimensions: product.dimensions || undefined,
                weight: product.weight || undefined,
                weight_unit: product.weight_unit || undefined,
            },
        };
        setItems([...items, newItem]);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchDropdown(false);
        // Focus back on search input
        searchInputRef.current?.focus();
    };

    const addCustomItem = () => {
        const newItem: QuotationItemData = {
            product_id: null,
            sku: '',
            external_reference: '',
            name: '',
            original_name: '',
            description: '',
            quantity: 1,
            requested_quantity: 1,
            unit: 'pc',
            unit_price: 0,
            discount_type: 'percentage',
            discount_value: 0,
            vat_rate: vatRate,
            is_custom: true,
            is_free: false,
            image_url: null,
            product_specifications: null,
        };
        setItems([...items, newItem]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuotationItemData, value: any) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const toggleItemFree = (index: number) => {
        const updated = [...items];
        updated[index] = { ...updated[index], is_free: !updated[index].is_free };
        setItems(updated);
    };

    // Handle new client creation
    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setNewClientErrors({});

        // Client-side validation
        const errors: Record<string, string> = {};
        if (!newClient.company_name.trim()) {
            errors.company_name = 'Company name is required';
        }
        if (!newClient.name.trim()) {
            errors.name = 'Contact person name is required';
        }
        if (!newClient.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) {
            errors.email = 'Please enter a valid email address';
        }
        // Country-specific phone validation
        if (newClient.phone) {
            const country = GCC_COUNTRIES.find(c => c.name === newClient.country);
            const cleanPhone = newClient.phone.replace(/\s/g, '');
            if (country) {
                if (!country.phoneRegex.test(cleanPhone)) {
                    errors.phone = country.phoneHint;
                }
            }
        }
        if (!newClient.city) {
            errors.city = 'City is required';
        }

        if (Object.keys(errors).length > 0) {
            setNewClientErrors(errors);
            return;
        }

        setIsCreatingClient(true);

        try {
            // Combine phone code and phone number
            const fullPhone = newClient.phone ? `${newClient.phone_code} ${newClient.phone}` : '';

            const response = await axios.post(route('clients.store'), {
                name: newClient.name,
                company_name: newClient.company_name,
                email: newClient.email,
                phone: fullPhone,
                address: newClient.address,
                city: newClient.city,
                country: newClient.country,
                contact_person: newClient.name,
                status: 'active',
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            const result = response.data;

            // Add new client to the list and select it
            const createdClient: Client = {
                id: result.client.id,
                display_name: result.client.company_name || result.client.name,
                email: result.client.email,
                phone: result.client.phone,
                company_name: result.client.company_name,
                address: result.client.address,
                city: result.client.city,
                country: result.client.country,
            };

            setClients([...clients, createdClient]);
            setData('client_id', createdClient.id.toString());
            setShowNewClientModal(false);
            setNewClient({
                name: '',
                company_name: '',
                email: '',
                phone_code: '+966',
                phone: '',
                address: '',
                city: '',
                country: 'Saudi Arabia',
                contact_person: '',
            });
        } catch (error: any) {
            console.error('Error creating client:', error);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                // Laravel validation errors - flatten array values to strings
                const serverErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, value]) => {
                    serverErrors[key] = Array.isArray(value) ? value[0] : String(value);
                });
                setNewClientErrors(serverErrors);
            } else if (error.response?.data?.message) {
                setNewClientErrors({ general: error.response.data.message });
            } else {
                setNewClientErrors({ general: 'Failed to create client. Please try again.' });
            }
        } finally {
            setIsCreatingClient(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (items.length === 0) {
            alert('Please add at least one item to the quotation.');
            return;
        }

        if (!data.customer_reference.trim()) {
            alert('Customer Reference is required.');
            return;
        }

        // Transform items to backend format
        const transformedItems = items.map(item => ({
            id: item.id || null,
            product_id: item.product_id && item.product_id > 0 ? item.product_id : null,
            item_code: item.sku || item.external_reference || '',
            name: item.name,
            original_name: item.original_name || null,
            description: item.description || null,
            image_url: item.image_url || null,
            slug: null,
            product_specifications: item.product_specifications || null,
            unit: item.unit,
            unit_price: item.unit_price,
            quantity: item.quantity,
            requested_quantity: item.requested_quantity || null,
            discount_percentage: item.discount_type === 'percentage' ? item.discount_value : 0,
            vat_rate: item.vat_rate,
            is_custom_item: item.is_custom,
            is_transport_item: false,
            is_free: item.is_free,
            notes: null,
        }));

        const formData = {
            client_id: data.client_id,
            title: null,
            description: null,
            reference: data.reference || null,
            customer_reference: data.customer_reference,
            quotation_date: data.quotation_date,
            valid_until: data.valid_until,
            expected_delivery_date: data.expected_delivery_date || null,
            discount_percentage: data.discount_type === 'percentage' ? data.discount_value : 0,
            transport_charges: data.transport_charges || 0,
            transport_free: data.transport_free,
            transport_notes: data.transport_notes || null,
            default_vat_rate: vatRate,
            vat_inclusive: false,
            currency: 'SAR',
            country: data.country,
            phone_code: data.phone_code,
            phone_number: data.phone_number,
            terms_and_conditions: data.terms_and_conditions || null,
            payment_terms: null,
            delivery_terms: null,
            warranty_terms: null,
            internal_notes: data.internal_notes || null,
            items: transformedItems,
        };

        router.put(route('quotations.update', quotation.id), formData as any, {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Quotation update errors:', errors);
                // Show first error to user
                const firstError = Object.values(errors)[0];
                if (firstError) {
                    alert(typeof firstError === 'string' ? firstError : 'Validation failed. Please check your input.');
                }
            },
            onSuccess: () => {
                console.log('Quotation updated successfully');
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const selectedCountry = GCC_COUNTRIES.find(c => c.name === data.country) || GCC_COUNTRIES[0];

    return (
        <AuthenticatedLayout header="Edit Quotation">
            <Head title={`Edit ${quotation.quotation_number}`} />

            <div className="space-y-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href={route('quotations.index')} className="text-slate-500 hover:text-violet-600">
                        Quotations
                    </Link>
                    <span className="text-slate-400">/</span>
                    <Link href={route('quotations.show', quotation.id)} className="text-slate-500 hover:text-violet-600">
                        {quotation.quotation_number}
                    </Link>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-900 font-medium">Edit</span>
                </div>

                {/* Modified Date Banner */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">
                                Last Modified: {formatDate(quotation.updated_at)}
                            </p>
                            <p className="text-xs text-amber-600">
                                Created: {formatDate(quotation.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {flash?.error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <p className="text-sm font-medium text-red-800">{flash.error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Client & Basic Info */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quotation Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Client */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Client <span className="text-red-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={clients.map(client => ({
                                                value: client.id.toString(),
                                                label: client.display_name,
                                                subLabel: client.email,
                                            }))}
                                            value={data.client_id}
                                            onChange={(value) => setData('client_id', value)}
                                            placeholder="Search and select a client..."
                                            searchPlaceholder="Search by name or email..."
                                            error={errors.client_id}
                                            required
                                            onAddNew={() => setShowNewClientModal(true)}
                                            addNewLabel="Add New Client"
                                        />
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
                                            Expected Delivery Date
                                        </label>
                                        <input
                                            type="date"
                                            value={data.expected_delivery_date}
                                            onChange={(e) => setData('expected_delivery_date', e.target.value)}
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Country <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={data.country}
                                            onChange={(e) => handleCountryChange(e.target.value)}
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        >
                                            {GCC_COUNTRIES.map((country) => (
                                                <option key={country.code} value={country.name}>
                                                    {country.flag} {country.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Phone Number
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={data.phone_code}
                                                onChange={(e) => setData('phone_code', e.target.value)}
                                                className="w-32 px-3 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            >
                                                {GCC_COUNTRIES.map((country) => (
                                                    <option key={country.code} value={country.phoneCode}>
                                                        {country.flag} {country.phoneCode}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="tel"
                                                value={data.phone_number}
                                                onChange={(e) => setData('phone_number', e.target.value)}
                                                placeholder="Phone number"
                                                className="flex-1 px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Internal Reference
                                        </label>
                                        <input
                                            type="text"
                                            value={data.reference}
                                            onChange={(e) => setData('reference', e.target.value)}
                                            placeholder="e.g., PO-12345"
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Customer Reference <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={data.customer_reference}
                                            onChange={(e) => setData('customer_reference', e.target.value)}
                                            placeholder="Customer's reference number"
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            required
                                        />
                                        {errors.customer_reference && (
                                            <p className="mt-1 text-sm text-red-600">{errors.customer_reference}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Currency
                                        </label>
                                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
                                            <span className="text-lg">🇸🇦</span>
                                            <span className="text-sm font-medium text-slate-700">SAR - Saudi Riyal</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Line Items - Table Format */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-slate-900">Line Items</h3>
                                    <button
                                        type="button"
                                        onClick={addCustomItem}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Custom Item
                                    </button>
                                </div>

                                {/* Product Search Bar */}
                                <div className="relative mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => {
                                                    setSearchQuery(e.target.value);
                                                    setShowSearchDropdown(true);
                                                }}
                                                onFocus={() => {
                                                    if (searchQuery.length >= 2) {
                                                        setShowSearchDropdown(true);
                                                    }
                                                }}
                                                placeholder="Search products by name, SKU, or reference..."
                                                className="block w-full px-4 py-3 pl-10 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            />
                                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {isSearching && (
                                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {showSearchDropdown && searchResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-80 overflow-auto">
                                            {searchResults.map((product) => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => addProductFromSearch(product)}
                                                    className="w-full px-4 py-3 text-left hover:bg-violet-50 text-sm flex items-start gap-3 border-b border-slate-100 last:border-0"
                                                >
                                                    {product.image_url && (
                                                        <img
                                                            src={product.image_url}
                                                            alt=""
                                                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-slate-900 truncate">{product.name}</div>
                                                        <div className="text-slate-500 text-xs">SKU: {product.sku}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-violet-600 font-medium">SAR {formatCurrency(product.price)}</span>
                                                            {product.voltage && (
                                                                <span className="text-xs text-blue-600">{product.voltage}V</span>
                                                            )}
                                                            {product.power && (
                                                                <span className="text-xs text-amber-600">{product.power}W</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-700">
                                                            + Add
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {showSearchDropdown && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-center text-sm text-slate-500">
                                            No products found for "{searchQuery}"
                                        </div>
                                    )}
                                </div>

                                {/* Items Table */}
                                {items.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                                        <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <p className="mt-4 text-slate-500 font-medium">No items added</p>
                                        <p className="text-slate-400 text-sm">Search for products above or add a custom item</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                                                    <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-24">SKU</th>
                                                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-20">Qty</th>
                                                    <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Unit Price</th>
                                                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-36">Discount</th>
                                                    <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-28">Total</th>
                                                    <th className="px-3 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-20">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-slate-200">
                                                {items.map((item, index) => (
                                                    <tr key={index} className={item.is_free ? 'bg-emerald-50' : ''}>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center gap-2">
                                                                {item.image_url && (
                                                                    <img
                                                                        src={item.image_url}
                                                                        alt={item.name}
                                                                        className="w-10 h-10 object-cover rounded-lg"
                                                                    />
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    {item.is_custom ? (
                                                                        <input
                                                                            type="text"
                                                                            value={item.name}
                                                                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                                                                            placeholder="Item name"
                                                                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                                        />
                                                                    ) : (
                                                                        <div className="text-sm font-medium text-slate-900 truncate">{item.name}</div>
                                                                    )}
                                                                    {item.product_specifications?.voltage && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mr-1">
                                                                            {item.product_specifications.voltage}V
                                                                        </span>
                                                                    )}
                                                                    {item.product_specifications?.power && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                                                            {item.product_specifications.power}W
                                                                        </span>
                                                                    )}
                                                                    {item.is_free && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-200 text-emerald-800 ml-1">
                                                                            FREE
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="text"
                                                                value={item.sku}
                                                                onChange={(e) => updateItem(index, 'sku', e.target.value)}
                                                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                                readOnly={!item.is_custom && !!item.product_id}
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                                min="0.01"
                                                                step="0.01"
                                                                className="w-full px-2 py-1 text-sm text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <input
                                                                type="number"
                                                                value={item.unit_price}
                                                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                min="0"
                                                                step="0.01"
                                                                className="w-full px-2 py-1 text-sm text-right border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="number"
                                                                    value={item.discount_value}
                                                                    onChange={(e) => updateItem(index, 'discount_value', parseFloat(e.target.value) || 0)}
                                                                    min="0"
                                                                    step={item.discount_type === 'percentage' ? '1' : '0.01'}
                                                                    max={item.discount_type === 'percentage' ? '100' : undefined}
                                                                    className="w-16 px-2 py-1 text-sm text-center border border-r-0 border-slate-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-violet-500 focus:z-10"
                                                                />
                                                                <select
                                                                    value={item.discount_type}
                                                                    onChange={(e) => updateItem(index, 'discount_type', e.target.value as 'percentage' | 'fixed')}
                                                                    className="px-1 py-1 text-xs border border-slate-300 rounded-r-lg bg-slate-50 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                                                >
                                                                    <option value="percentage">%</option>
                                                                    <option value="fixed">SAR</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            <span className={`text-sm font-medium ${item.is_free ? 'text-emerald-600 line-through' : 'text-slate-900'}`}>
                                                                {formatCurrency(calculateItemTotal(item).lineTotalExclVat)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleItemFree(index)}
                                                                    className={`p-1.5 rounded-lg transition-colors ${item.is_free ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                                    title={item.is_free ? 'Remove free' : 'Mark as free'}
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(index)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Notes & Terms */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4">Notes & Terms</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Internal Notes (not visible to client)
                                        </label>
                                        <textarea
                                            value={data.internal_notes}
                                            onChange={(e) => setData('internal_notes', e.target.value)}
                                            rows={3}
                                            placeholder="Internal notes for your team..."
                                            className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Transport Notes
                                        </label>
                                        <textarea
                                            value={data.transport_notes}
                                            onChange={(e) => setData('transport_notes', e.target.value)}
                                            rows={2}
                                            placeholder="Delivery instructions or transport notes..."
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
                                            <span className="text-slate-500">Subtotal (excl. VAT)</span>
                                            <span className="text-slate-900">SAR {formatCurrency(totals.subtotal)}</span>
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
                                                    <option value="fixed">SAR</option>
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
                                            <span className="text-slate-500">Total Before VAT</span>
                                            <span className="text-slate-900">{formatCurrency(totals.totalBeforeVat)}</span>
                                        </div>

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
                                                    SAR {formatCurrency(totals.grandTotal)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">Including VAT</p>
                                        </div>

                                        {/* Total Amperes */}
                                        {totals.totalAmperes > 0 && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-900">Total Electrical Load</p>
                                                        <p className="text-lg font-bold text-blue-600">{totals.totalAmperes} A</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
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
                                            Save Changes
                                        </button>
                                        <Link
                                            href={route('quotations.show', quotation.id)}
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

                {/* New Client Modal */}
                {showNewClientModal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 py-6">
                            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setShowNewClientModal(false)} />
                            <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-semibold text-slate-900">Create New Client</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewClientModal(false)}
                                        className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {newClientErrors.general && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                        {newClientErrors.general}
                                    </div>
                                )}

                                <form onSubmit={handleCreateClient} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Company Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newClient.company_name}
                                                onChange={(e) => setNewClient({ ...newClient, company_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                required
                                            />
                                            {newClientErrors.company_name && (
                                                <p className="mt-1 text-xs text-red-600">{newClientErrors.company_name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Contact Person <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={newClient.name}
                                                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                required
                                            />
                                            {newClientErrors.name && (
                                                <p className="mt-1 text-xs text-red-600">{newClientErrors.name}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={newClient.email}
                                                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                required
                                            />
                                            {newClientErrors.email && (
                                                <p className="mt-1 text-xs text-red-600">{newClientErrors.email}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Country
                                            </label>
                                            <select
                                                value={newClient.country}
                                                onChange={(e) => handleNewClientCountryChange(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            >
                                                {GCC_COUNTRIES.map((country) => (
                                                    <option key={country.code} value={country.name}>
                                                        {country.flag} {country.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Phone Number
                                            </label>
                                            <div className="flex">
                                                <div className="flex items-center gap-1 px-2 py-2 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg shrink-0">
                                                    <span className="text-sm">
                                                        {GCC_COUNTRIES.find(c => c.name === newClient.country)?.flag || '🇸🇦'}
                                                    </span>
                                                    <span className="text-xs text-slate-700 font-medium">
                                                        {newClient.phone_code}
                                                    </span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={newClient.phone}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        const country = GCC_COUNTRIES.find(c => c.name === newClient.country);
                                                        const maxLen = country?.phoneLength || 9;
                                                        setNewClient({ ...newClient, phone: value.slice(0, maxLen) });
                                                    }}
                                                    placeholder={GCC_COUNTRIES.find(c => c.name === newClient.country)?.phoneLength === 9 ? '5XXXXXXXX' : 'XXXXXXXX'}
                                                    maxLength={GCC_COUNTRIES.find(c => c.name === newClient.country)?.phoneLength || 9}
                                                    className="w-full min-w-0 px-3 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {GCC_COUNTRIES.find(c => c.name === newClient.country)?.phoneHint}
                                            </p>
                                            {newClientErrors.phone && (
                                                <p className="mt-1 text-xs text-red-600">{newClientErrors.phone}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                City <span className="text-red-500">*</span>
                                            </label>
                                            <SearchableSelect
                                                options={(GCC_CITIES[newClient.country] || []).map(city => ({
                                                    value: city,
                                                    label: city,
                                                }))}
                                                value={newClient.city}
                                                onChange={(value) => setNewClient({ ...newClient, city: value })}
                                                placeholder="Select a city..."
                                                searchPlaceholder="Search cities..."
                                                error={newClientErrors.city}
                                                required
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                                Address
                                            </label>
                                            <textarea
                                                value={newClient.address}
                                                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            type="button"
                                            onClick={() => setShowNewClientModal(false)}
                                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isCreatingClient}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {isCreatingClient ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Create Client
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
