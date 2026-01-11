import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useState } from 'react';

interface Client {
    id: number;
    display_name: string;
    email: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface QuotationItem {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    quantity: number;
    unit: string;
    unit_price: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    discount_amount: number;
    vat_rate: number;
    vat_amount: number;
    subtotal: number;
    total_amount: number;
    is_custom: boolean;
}

interface StatusHistory {
    id: number;
    from_status: string | null;
    to_status: string;
    action: string;
    notes: string | null;
    user: User | null;
    created_at: string;
}

interface Quotation {
    id: number;
    quotation_number: string;
    client_id: number;
    client: Client | null;
    user: User | null;
    status: string;
    version: number;
    parent_id: number | null;
    reference_number: string | null;
    currency: string;
    quotation_date: string;
    valid_until: string | null;
    subtotal: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    discount_amount: number;
    vat_rate: number;
    vat_amount: number;
    transport_charges: number;
    transport_free: boolean;
    grand_total: number;
    notes: string | null;
    terms_and_conditions: string | null;
    client_snapshot: Record<string, any>;
    pdf_path: string | null;
    pdf_generated_at: string | null;
    sent_at: string | null;
    sent_to_email: string | null;
    items: QuotationItem[];
    status_history: StatusHistory[];
    created_at: string;
    updated_at: string;
}

interface Props {
    quotation: Quotation;
}

const statusColors: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    sent: 'bg-blue-100 text-blue-700 border-blue-200',
    accepted: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
    expired: 'bg-gray-100 text-gray-500 border-gray-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending_review: 'Pending Review',
    approved: 'Approved',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
};

export default function Show({ quotation }: Props) {
    const { auth, flash } = usePage().props as any;
    const [showSendModal, setShowSendModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [sendEmail, setSendEmail] = useState(quotation.client?.email || '');
    const [sendSubject, setSendSubject] = useState('');
    const [sendMessage, setSendMessage] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const hasPermission = (permission: string) => {
        return auth.user?.permissions?.includes(permission);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SA', {
            style: 'currency',
            currency: quotation.currency,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleAction = (action: string, data?: Record<string, any>) => {
        setProcessing(true);
        router.post(route(`quotations.${action}`, quotation.id), data || {}, {
            onFinish: () => {
                setProcessing(false);
                setShowSendModal(false);
                setShowRejectModal(false);
            },
        });
    };

    const handleGeneratePdf = () => {
        setProcessing(true);
        router.post(route('quotations.generate-pdf', quotation.id), {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const canEdit = quotation.status === 'draft' && hasPermission('quotations.edit');
    const canSubmit = quotation.status === 'draft' && hasPermission('quotations.submit');
    const canApprove = quotation.status === 'pending_review' && hasPermission('quotations.approve');
    const canSend = ['approved', 'sent'].includes(quotation.status) && hasPermission('quotations.send');
    const canMarkResponse = quotation.status === 'sent' && hasPermission('quotations.edit');
    const canCreateVersion = ['sent', 'accepted', 'rejected'].includes(quotation.status) && hasPermission('quotations.create');

    return (
        <AuthenticatedLayout header="Quotation Details">
            <Head title={`Quotation ${quotation.quotation_number}`} />

            <div className="space-y-6">
                {/* Breadcrumb & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href={route('quotations.index')} className="text-slate-500 hover:text-violet-600">
                            Quotations
                        </Link>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-900 font-medium">{quotation.quotation_number}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {canEdit && (
                            <Link
                                href={route('quotations.edit', quotation.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                            </Link>
                        )}
                        <button
                            onClick={handleGeneratePdf}
                            disabled={processing}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generate PDF
                        </button>
                        {quotation.pdf_path && (
                            <a
                                href={route('quotations.download-pdf', quotation.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download PDF
                            </a>
                        )}
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                        <p className="text-sm font-medium text-emerald-800">{flash.success}</p>
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                        <p className="text-sm font-medium text-red-800">{flash.error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-slate-900">{quotation.quotation_number}</h2>
                                        {quotation.version > 1 && (
                                            <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg">
                                                v{quotation.version}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-slate-500">
                                        Created on {formatDateTime(quotation.created_at)}
                                    </p>
                                </div>
                                <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-xl border ${statusColors[quotation.status]}`}>
                                    {statusLabels[quotation.status]}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(quotation.quotation_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valid Until</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {quotation.valid_until ? formatDate(quotation.valid_until) : 'No expiry'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reference</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {quotation.reference_number || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created By</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {quotation.user?.name || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Client Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {quotation.client_snapshot?.name || quotation.client?.display_name || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email</p>
                                    <p className="mt-1 text-sm text-slate-900">
                                        {quotation.client_snapshot?.email || quotation.client?.email || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</p>
                                    <p className="mt-1 text-sm text-slate-900">
                                        {quotation.client_snapshot?.phone || '-'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Address</p>
                                    <p className="mt-1 text-sm text-slate-900">
                                        {quotation.client_snapshot?.address || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900">Items ({quotation.items.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Item</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">Qty</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Unit Price</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Discount</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">VAT</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {quotation.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-slate-900">{item.name}</div>
                                                    {item.sku && <div className="text-xs text-slate-500">SKU: {item.sku}</div>}
                                                    {item.description && <div className="text-xs text-slate-400 mt-1">{item.description}</div>}
                                                </td>
                                                <td className="px-4 py-4 text-center text-sm text-slate-600">
                                                    {item.quantity} {item.unit}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-slate-600">
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm">
                                                    {item.discount_amount > 0 ? (
                                                        <span className="text-emerald-600">
                                                            -{formatCurrency(item.discount_amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm text-slate-600">
                                                    {formatCurrency(item.vat_amount)}
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                                                    {formatCurrency(item.total_amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes & Terms */}
                        {(quotation.notes || quotation.terms_and_conditions) && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                {quotation.notes && (
                                    <div className="mb-6">
                                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Notes</h4>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{quotation.notes}</p>
                                    </div>
                                )}
                                {quotation.terms_and_conditions && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Terms & Conditions</h4>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Totals */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="text-slate-900">{formatCurrency(quotation.subtotal)}</span>
                                </div>
                                {quotation.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Discount</span>
                                        <span className="text-emerald-600">-{formatCurrency(quotation.discount_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">VAT ({quotation.vat_rate}%)</span>
                                    <span className="text-slate-900">{formatCurrency(quotation.vat_amount)}</span>
                                </div>
                                {quotation.transport_charges > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">
                                            Transport
                                            {quotation.transport_free && <span className="text-emerald-600 ml-1">(Free)</span>}
                                        </span>
                                        <span className={quotation.transport_free ? 'text-slate-400 line-through' : 'text-slate-900'}>
                                            {formatCurrency(quotation.transport_charges)}
                                        </span>
                                    </div>
                                )}
                                <div className="pt-3 border-t-2 border-slate-900">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-semibold text-slate-900">Grand Total</span>
                                        <span className="text-xl font-bold text-violet-600">{formatCurrency(quotation.grand_total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                {canSubmit && (
                                    <button
                                        onClick={() => handleAction('submit-for-review')}
                                        disabled={processing}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                                    >
                                        Submit for Review
                                    </button>
                                )}
                                {canApprove && (
                                    <>
                                        <button
                                            onClick={() => handleAction('approve')}
                                            disabled={processing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => setShowRejectModal(true)}
                                            disabled={processing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {canSend && (
                                    <button
                                        onClick={() => setShowSendModal(true)}
                                        disabled={processing}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Send to Client
                                    </button>
                                )}
                                {canMarkResponse && (
                                    <>
                                        <button
                                            onClick={() => handleAction('mark-accepted')}
                                            disabled={processing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            Mark as Accepted
                                        </button>
                                        <button
                                            onClick={() => handleAction('mark-rejected')}
                                            disabled={processing}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                                        >
                                            Mark as Rejected
                                        </button>
                                    </>
                                )}
                                {canCreateVersion && (
                                    <button
                                        onClick={() => handleAction('create-version')}
                                        disabled={processing}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
                                    >
                                        Create New Version
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status History */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Status History</h3>
                            {quotation.status_history.length > 0 ? (
                                <div className="space-y-4">
                                    {quotation.status_history.map((history, index) => (
                                        <div key={history.id} className="relative pl-6">
                                            {index !== quotation.status_history.length - 1 && (
                                                <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-slate-200" />
                                            )}
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-violet-100 border-2 border-violet-500" />
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {statusLabels[history.to_status] || history.action}
                                                </p>
                                                {history.notes && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{history.notes}</p>
                                                )}
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {history.user?.name || 'System'} - {formatDateTime(history.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No status history available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Send Modal */}
            {showSendModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Send Quotation</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={sendEmail}
                                    onChange={(e) => setSendEmail(e.target.value)}
                                    className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject (optional)</label>
                                <input
                                    type="text"
                                    value={sendSubject}
                                    onChange={(e) => setSendSubject(e.target.value)}
                                    placeholder="Leave blank for default subject"
                                    className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message (optional)</label>
                                <textarea
                                    value={sendMessage}
                                    onChange={(e) => setSendMessage(e.target.value)}
                                    rows={4}
                                    placeholder="Add a personal message..."
                                    className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSendModal(false)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction('send', { email: sendEmail, subject: sendSubject, message: sendMessage })}
                                disabled={processing || !sendEmail}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Send Quotation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Reject Quotation</h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for rejection</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                placeholder="Please provide a reason..."
                                className="block w-full rounded-xl border-slate-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction('reject', { reason: rejectReason })}
                                disabled={processing}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                Reject Quotation
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
