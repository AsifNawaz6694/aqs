import { Head, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RichTextEditor from '@/Components/RichTextEditor';
import { Input, Button, Card } from '@/Components/Form';
import { useState } from 'react';

interface Settings {
    quotation: {
        quotation_prefix?: string;
        quotation_validity_days?: number;
        default_vat_rate?: number;
        default_currency?: string;
        default_terms_and_conditions?: string;
        default_payment_terms?: string;
        default_delivery_terms?: string;
        default_warranty_terms?: string;
    };
    company: {
        company_name?: string;
        company_address?: string;
        company_phone?: string;
        company_email?: string;
        company_vat_number?: string;
    };
    email: {
        email_signature?: string;
    };
}

interface Props {
    settings: Settings;
}

export default function Index({ settings }: Props) {
    const { flash } = usePage().props as any;
    const [activeTab, setActiveTab] = useState<'quotation' | 'company' | 'email'>('quotation');

    const { data, setData, post, processing, errors } = useForm({
        quotation_prefix: settings.quotation?.quotation_prefix || 'QT',
        quotation_validity_days: settings.quotation?.quotation_validity_days || 30,
        default_vat_rate: settings.quotation?.default_vat_rate || 15,
        default_currency: settings.quotation?.default_currency || 'SAR',
        default_terms_and_conditions: settings.quotation?.default_terms_and_conditions || '',
        default_payment_terms: settings.quotation?.default_payment_terms || '',
        default_delivery_terms: settings.quotation?.default_delivery_terms || '',
        default_warranty_terms: settings.quotation?.default_warranty_terms || '',
        company_name: settings.company?.company_name || '',
        company_address: settings.company?.company_address || '',
        company_phone: settings.company?.company_phone || '',
        company_email: settings.company?.company_email || '',
        company_vat_number: settings.company?.company_vat_number || '',
        email_signature: settings.email?.email_signature || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    const tabs = [
        { id: 'quotation', label: 'Quotation Defaults', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )},
        { id: 'company', label: 'Company Info', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        )},
        { id: 'email', label: 'Email Signature', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        )},
    ];

    return (
        <AuthenticatedLayout header="Settings">
            <Head title="Settings" />

            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                            <nav className="space-y-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                                            activeTab === tab.id
                                                ? 'bg-violet-100 text-violet-700'
                                                : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit}>
                            {/* Quotation Settings */}
                            {activeTab === 'quotation' && (
                                <div className="space-y-6">
                                    <Card>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Quotation Number Settings</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Quotation Prefix"
                                                value={data.quotation_prefix}
                                                onChange={(e) => setData('quotation_prefix', e.target.value)}
                                                placeholder="QT"
                                                hint="Prefix for quotation numbers (e.g., QT-202501-0001)"
                                                error={errors.quotation_prefix}
                                            />
                                            <Input
                                                label="Default Validity (Days)"
                                                type="number"
                                                value={data.quotation_validity_days}
                                                onChange={(e) => setData('quotation_validity_days', parseInt(e.target.value) || 30)}
                                                min={1}
                                                max={365}
                                                error={errors.quotation_validity_days}
                                            />
                                            <Input
                                                label="Default VAT Rate (%)"
                                                type="number"
                                                value={data.default_vat_rate}
                                                onChange={(e) => setData('default_vat_rate', parseFloat(e.target.value) || 15)}
                                                min={0}
                                                max={100}
                                                step={0.01}
                                                error={errors.default_vat_rate}
                                            />
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                                    Default Currency
                                                </label>
                                                <select
                                                    value={data.default_currency}
                                                    onChange={(e) => setData('default_currency', e.target.value)}
                                                    className="block w-full px-4 py-3 text-slate-900 text-sm bg-white border border-slate-300 rounded-xl transition-all duration-200 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                >
                                                    <option value="SAR">SAR - Saudi Riyal</option>
                                                    <option value="USD">USD - US Dollar</option>
                                                    <option value="EUR">EUR - Euro</option>
                                                    <option value="AED">AED - UAE Dirham</option>
                                                </select>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Default Terms & Conditions</h3>
                                        <RichTextEditor
                                            content={data.default_terms_and_conditions}
                                            onChange={(html) => setData('default_terms_and_conditions', html)}
                                            placeholder="Enter default terms and conditions..."
                                            minHeight="200px"
                                        />
                                    </Card>

                                    <Card>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Default Payment Terms</h3>
                                        <RichTextEditor
                                            content={data.default_payment_terms}
                                            onChange={(html) => setData('default_payment_terms', html)}
                                            placeholder="Enter default payment terms..."
                                            minHeight="150px"
                                        />
                                    </Card>

                                    <Card>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Default Delivery Terms</h3>
                                        <RichTextEditor
                                            content={data.default_delivery_terms}
                                            onChange={(html) => setData('default_delivery_terms', html)}
                                            placeholder="Enter default delivery terms..."
                                            minHeight="150px"
                                        />
                                    </Card>

                                    <Card>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-6">Default Warranty Terms</h3>
                                        <RichTextEditor
                                            content={data.default_warranty_terms}
                                            onChange={(html) => setData('default_warranty_terms', html)}
                                            placeholder="Enter default warranty terms..."
                                            minHeight="150px"
                                        />
                                    </Card>
                                </div>
                            )}

                            {/* Company Settings */}
                            {activeTab === 'company' && (
                                <Card>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-6">Company Information</h3>
                                    <div className="space-y-4">
                                        <Input
                                            label="Company Name"
                                            value={data.company_name}
                                            onChange={(e) => setData('company_name', e.target.value)}
                                            placeholder="Your company name"
                                            error={errors.company_name}
                                        />
                                        <Input
                                            label="Company Address"
                                            value={data.company_address}
                                            onChange={(e) => setData('company_address', e.target.value)}
                                            placeholder="Full company address"
                                            error={errors.company_address}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Phone Number"
                                                value={data.company_phone}
                                                onChange={(e) => setData('company_phone', e.target.value)}
                                                placeholder="+966 XX XXX XXXX"
                                                error={errors.company_phone}
                                            />
                                            <Input
                                                label="Email Address"
                                                type="email"
                                                value={data.company_email}
                                                onChange={(e) => setData('company_email', e.target.value)}
                                                placeholder="info@company.com"
                                                error={errors.company_email}
                                            />
                                        </div>
                                        <Input
                                            label="VAT Registration Number"
                                            value={data.company_vat_number}
                                            onChange={(e) => setData('company_vat_number', e.target.value)}
                                            placeholder="VAT number"
                                            error={errors.company_vat_number}
                                        />
                                    </div>
                                </Card>
                            )}

                            {/* Email Signature Settings */}
                            {activeTab === 'email' && (
                                <div className="space-y-6">
                                    <Card>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                                                <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-900">Email Signature</h3>
                                                <p className="text-sm text-slate-500">Create a signature to be included in quotation emails</p>
                                            </div>
                                        </div>

                                        <RichTextEditor
                                            content={data.email_signature}
                                            onChange={(html) => setData('email_signature', html)}
                                            placeholder="Create your email signature..."
                                            minHeight="200px"
                                        />

                                        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <p className="text-sm font-medium text-slate-700 mb-2">Signature Preview</p>
                                            <div
                                                className="prose prose-sm max-w-none text-slate-600"
                                                dangerouslySetInnerHTML={{ __html: data.email_signature || '<p class="text-slate-400 italic">No signature set</p>' }}
                                            />
                                        </div>
                                    </Card>

                                    <Card className="bg-blue-50 border-blue-200">
                                        <div className="flex gap-3">
                                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <div>
                                                <h4 className="text-sm font-medium text-blue-900">Gmail-style Signature</h4>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    This signature will be automatically appended to all quotation emails sent to clients.
                                                    You can include your name, title, contact information, and company logo.
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-6 flex justify-end">
                                <Button
                                    type="submit"
                                    loading={processing}
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    }
                                >
                                    Save Settings
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
