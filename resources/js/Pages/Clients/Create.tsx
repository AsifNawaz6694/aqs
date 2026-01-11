import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler } from 'react';

const COUNTRY_CODES = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+974', country: 'Qatar' },
    { code: '+973', country: 'Bahrain' },
    { code: '+965', country: 'Kuwait' },
    { code: '+968', country: 'Oman' },
    { code: '+91', country: 'India' },
    { code: '+92', country: 'Pakistan' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' },
    { code: '+61', country: 'Australia' },
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        type: 'company' as 'individual' | 'company',
        company_name: '',
        contact_first_name: '',
        contact_last_name: '',
        email: '',
        phone: '',
        phone_country_code: '+971',
        address_line_1: '',
        address_line_2: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        tax_id: '',
        notes: '',
        status: 'active',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('clients.store'));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Add Client</h2>}
        >
            <Head title="Add Client" />

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
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                            Phone
                                        </label>
                                        <div className="mt-1 flex">
                                            <select
                                                value={data.phone_country_code}
                                                onChange={(e) => setData('phone_country_code', e.target.value)}
                                                className="rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                {COUNTRY_CODES.map((cc) => (
                                                    <option key={cc.code} value={cc.code}>
                                                        {cc.code} ({cc.country})
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="tel"
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="block w-full rounded-r-md border-l-0 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="50 123 4567"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.address_line_2 && <p className="mt-1 text-sm text-red-600">{errors.address_line_2}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            id="country"
                                            value={data.country}
                                            onChange={(e) => setData('country', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
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
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                    {processing ? 'Creating...' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
