import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/SearchableSelect';
import { FormEventHandler } from 'react';

interface Client {
    id: number;
    type: 'individual' | 'company';
    company_name: string | null;
    contact_first_name: string;
    contact_last_name: string;
    email: string;
    phone: string | null;
    phone_country_code: string | null;
    address_line_1: string | null;
    address_line_2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    tax_id: string | null;
    notes: string | null;
    status: 'active' | 'inactive';
}

interface Props {
    client: Client;
}

// GCC Countries with flags and phone codes
const GCC_COUNTRIES = [
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phoneCode: '+966' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phoneCode: '+971' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦', phoneCode: '+974' },
    { code: 'KW', name: 'Kuwait', flag: '🇰🇼', phoneCode: '+965' },
    { code: 'BH', name: 'Bahrain', flag: '🇧🇭', phoneCode: '+973' },
    { code: 'OM', name: 'Oman', flag: '🇴🇲', phoneCode: '+968' },
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

export default function Edit({ client }: Props) {
    // Find matching GCC country or default to Saudi Arabia
    const initialCountry = GCC_COUNTRIES.find(c => c.name === client.country) || GCC_COUNTRIES[0];

    const { data, setData, put, processing, errors } = useForm({
        type: client.type,
        company_name: client.company_name || '',
        contact_first_name: client.contact_first_name,
        contact_last_name: client.contact_last_name,
        email: client.email,
        phone: client.phone || '',
        phone_country_code: client.phone_country_code || initialCountry.phoneCode,
        address_line_1: client.address_line_1 || '',
        address_line_2: client.address_line_2 || '',
        city: client.city || '',
        state: client.state || '',
        postal_code: client.postal_code || '',
        country: client.country || initialCountry.name,
        tax_id: client.tax_id || '',
        notes: client.notes || '',
        status: client.status,
    });

    // Handle country change - sync phone code and reset city
    const handleCountryChange = (countryName: string) => {
        const country = GCC_COUNTRIES.find(c => c.name === countryName);
        if (country) {
            setData(prev => ({
                ...prev,
                country: country.name,
                phone_country_code: country.phoneCode,
                city: '', // Reset city when country changes
            }));
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('clients.update', client.id));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Edit Client</h2>}
        >
            <Head title={`Edit Client - ${client.contact_first_name} ${client.contact_last_name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="mb-6">
                                <Link
                                    href={route('clients.index')}
                                    className="text-sm text-indigo-600 hover:text-indigo-900"
                                >
                                    &larr; Back to Clients
                                </Link>
                            </div>

                            {/* Client Type */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">Client Type</h3>
                                <div className="flex gap-4">
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="company"
                                            checked={data.type === 'company'}
                                            onChange={(e) => setData('type', e.target.value as 'company')}
                                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Company</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2">
                                        <input
                                            type="radio"
                                            name="type"
                                            value="individual"
                                            checked={data.type === 'individual'}
                                            onChange={(e) => setData('type', e.target.value as 'individual')}
                                            className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Individual</span>
                                    </label>
                                </div>
                            </div>

                            {/* Company Information */}
                            {data.type === 'company' && (
                                <div className="mb-8">
                                    <h3 className="mb-4 text-lg font-medium text-gray-900">Company Information</h3>
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                                                Company Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="company_name"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                required={data.type === 'company'}
                                            />
                                            {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
                                        </div>

                                        <div>
                                            <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
                                                Tax ID / VAT Number
                                            </label>
                                            <input
                                                type="text"
                                                id="tax_id"
                                                value={data.tax_id}
                                                onChange={(e) => setData('tax_id', e.target.value)}
                                                className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            />
                                            {errors.tax_id && <p className="mt-1 text-sm text-red-600">{errors.tax_id}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Information */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">
                                    {data.type === 'company' ? 'Contact Person' : 'Personal Information'}
                                </h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="contact_first_name" className="block text-sm font-medium text-gray-700">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="contact_first_name"
                                            value={data.contact_first_name}
                                            onChange={(e) => setData('contact_first_name', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            required
                                        />
                                        {errors.contact_first_name && <p className="mt-1 text-sm text-red-600">{errors.contact_first_name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="contact_last_name" className="block text-sm font-medium text-gray-700">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="contact_last_name"
                                            value={data.contact_last_name}
                                            onChange={(e) => setData('contact_last_name', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            required
                                        />
                                        {errors.contact_last_name && <p className="mt-1 text-sm text-red-600">{errors.contact_last_name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            required
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                            Phone
                                        </label>
                                        <div className="mt-1.5 flex">
                                            <div className="flex items-center gap-1.5 px-3 py-3 bg-slate-50 border border-r-0 border-slate-300 rounded-l-xl shrink-0">
                                                <span className="text-base">
                                                    {GCC_COUNTRIES.find(c => c.name === data.country)?.flag || '🇸🇦'}
                                                </span>
                                                <span className="text-sm text-slate-700 font-medium">
                                                    {data.phone_country_code}
                                                </span>
                                            </div>
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="block w-full min-w-0 px-4 py-3 text-sm rounded-r-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                placeholder="5XXXXXXXX"
                                            />
                                        </div>
                                        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">Address</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label htmlFor="address_line_1" className="block text-sm font-medium text-gray-700">
                                            Address Line 1
                                        </label>
                                        <input
                                            type="text"
                                            id="address_line_1"
                                            value={data.address_line_1}
                                            onChange={(e) => setData('address_line_1', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                        {errors.address_line_1 && <p className="mt-1 text-sm text-red-600">{errors.address_line_1}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="address_line_2" className="block text-sm font-medium text-gray-700">
                                            Address Line 2
                                        </label>
                                        <input
                                            type="text"
                                            id="address_line_2"
                                            value={data.address_line_2}
                                            onChange={(e) => setData('address_line_2', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                        {errors.address_line_2 && <p className="mt-1 text-sm text-red-600">{errors.address_line_2}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Country <span className="text-red-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={GCC_COUNTRIES.map(country => ({
                                                value: country.name,
                                                label: `${country.flag} ${country.name}`,
                                            }))}
                                            value={data.country}
                                            onChange={handleCountryChange}
                                            placeholder="Select a country..."
                                            searchPlaceholder="Search countries..."
                                            error={errors.country}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <SearchableSelect
                                            options={(GCC_CITIES[data.country] || []).map(city => ({
                                                value: city,
                                                label: city,
                                            }))}
                                            value={data.city}
                                            onChange={(value) => setData('city', value)}
                                            placeholder="Select a city..."
                                            searchPlaceholder="Search cities..."
                                            error={errors.city}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                            State / Province
                                        </label>
                                        <input
                                            type="text"
                                            id="state"
                                            value={data.state}
                                            onChange={(e) => setData('state', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                        {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            id="postal_code"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        />
                                        {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div className="mb-8">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">Additional Information</h3>
                                <div className="grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                            Status *
                                        </label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value as 'active' | 'inactive')}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            required
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                            Notes
                                        </label>
                                        <textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            rows={3}
                                            className="mt-1.5 block w-full px-4 py-3 text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                            placeholder="Any additional notes about this client..."
                                        />
                                        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="flex justify-end gap-3 border-t pt-6">
                                <Link
                                    href={route('clients.index')}
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
