import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FormEventHandler, useRef, useState } from 'react';

interface Profile {
    id: number;
    avatar_path: string | null;
    avatar_url: string | null;
    signature_path: string | null;
    signature_url: string | null;
    company_name: string | null;
    job_title: string | null;
    department: string | null;
    phone: string | null;
    mobile: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postal_code: string | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    profile: Profile | null;
}

interface Props {
    user: User;
    mustVerifyEmail: boolean;
    status?: string;
}

export default function Edit({ user, mustVerifyEmail, status }: Props) {
    const [activeTab, setActiveTab] = useState('profile');
    const avatarInput = useRef<HTMLInputElement>(null);
    const signatureInput = useRef<HTMLInputElement>(null);

    const { data, setData, patch, errors, processing } = useForm({
        name: user.name,
        email: user.email,
        company_name: user.profile?.company_name || '',
        job_title: user.profile?.job_title || '',
        department: user.profile?.department || '',
        phone: user.profile?.phone || '',
        mobile: user.profile?.mobile || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        state: user.profile?.state || '',
        country: user.profile?.country || '',
        postal_code: user.profile?.postal_code || '',
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitProfile: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    const submitPassword: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.patch(route('profile.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const formData = new FormData();
            formData.append('avatar', e.target.files[0]);
            router.post(route('profile.avatar.update'), formData, {
                forceFormData: true,
            });
        }
    };

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const formData = new FormData();
            formData.append('signature', e.target.files[0]);
            router.post(route('profile.signature.update'), formData, {
                forceFormData: true,
            });
        }
    };

    const deleteAvatar = () => {
        if (confirm('Are you sure you want to remove your avatar?')) {
            router.delete(route('profile.avatar.delete'));
        }
    };

    const deleteSignature = () => {
        if (confirm('Are you sure you want to remove your signature?')) {
            router.delete(route('profile.signature.delete'));
        }
    };

    const tabs = [
        { id: 'profile', name: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
        { id: 'signature', name: 'Signature', icon: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z' },
        { id: 'security', name: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    ];

    return (
        <AuthenticatedLayout header="Profile Settings">
            <Head title="Profile Settings" />

            <div className="max-w-5xl mx-auto">
                {status && (
                    <div className="mb-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-4 text-white shadow-lg">
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="font-medium">{status}</p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header with Avatar */}
                    <div className="relative h-32 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600">
                        <div className="absolute -bottom-12 left-4 sm:left-8">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-xl">
                                    {user.profile?.avatar_url ? (
                                        <img
                                            src={user.profile.avatar_url}
                                            alt={user.name}
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => avatarInput.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-600 hover:text-violet-600 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                                <input
                                    ref={avatarInput}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-32 sm:left-36">
                            <h2 className="text-lg sm:text-xl font-bold text-white">{user.name}</h2>
                            <p className="text-violet-200 text-sm sm:text-base">{user.email}</p>
                        </div>
                        {user.profile?.avatar_url && (
                            <button
                                onClick={deleteAvatar}
                                className="absolute top-4 right-4 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors hidden sm:block"
                            >
                                Remove Avatar
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="pt-16 px-4 sm:px-8">
                        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                        activeTab === tab.id
                                            ? 'border-violet-600 text-violet-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                    </svg>
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-8">
                        {activeTab === 'profile' && (
                            <form onSubmit={submitProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                            placeholder="Enter your full name"
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                            placeholder="Enter your email"
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                                            <input
                                                type="text"
                                                value={data.company_name}
                                                onChange={(e) => setData('company_name', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                placeholder="Company name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                                            <input
                                                type="text"
                                                value={data.job_title}
                                                onChange={(e) => setData('job_title', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                placeholder="Your job title"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                                            <input
                                                type="text"
                                                value={data.department}
                                                onChange={(e) => setData('department', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                placeholder="Department"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                            <input
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                                            <input
                                                type="tel"
                                                value={data.mobile}
                                                onChange={(e) => setData('mobile', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                                            <input
                                                type="text"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                placeholder="123 Main Street"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                                <input
                                                    type="text"
                                                    value={data.city}
                                                    onChange={(e) => setData('city', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                    placeholder="City"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                                <input
                                                    type="text"
                                                    value={data.state}
                                                    onChange={(e) => setData('state', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                    placeholder="State"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                                                <input
                                                    type="text"
                                                    value={data.postal_code}
                                                    onChange={(e) => setData('postal_code', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                    placeholder="12345"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                                <input
                                                    type="text"
                                                    value={data.country}
                                                    onChange={(e) => setData('country', e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                                    placeholder="Country"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 focus:ring-4 focus:ring-violet-200 transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {activeTab === 'signature' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Signature</h3>
                                    <p className="text-gray-500 mb-6">Upload your signature image. This will be used in quotations and documents.</p>
                                </div>

                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                                    {user.profile?.signature_url ? (
                                        <div className="space-y-4">
                                            <div className="inline-block p-4 bg-gray-50 rounded-xl">
                                                <img
                                                    src={user.profile.signature_url}
                                                    alt="Your signature"
                                                    className="max-h-24 w-auto"
                                                />
                                            </div>
                                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                                <button
                                                    onClick={() => signatureInput.current?.click()}
                                                    className="px-4 py-2 bg-violet-100 text-violet-700 font-medium rounded-xl hover:bg-violet-200 transition-colors"
                                                >
                                                    Change Signature
                                                </button>
                                                <button
                                                    onClick={deleteSignature}
                                                    className="px-4 py-2 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center">
                                                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-medium">No signature uploaded</p>
                                                <p className="text-gray-500 text-sm">Upload a PNG or JPG file (max 1MB)</p>
                                            </div>
                                            <button
                                                onClick={() => signatureInput.current?.click()}
                                                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all"
                                            >
                                                Upload Signature
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        ref={signatureInput}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleSignatureChange}
                                    />
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                    <div className="flex gap-3">
                                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-amber-800">Tips for a good signature</p>
                                            <ul className="mt-1 text-sm text-amber-700 space-y-1">
                                                <li>Use a white or transparent background</li>
                                                <li>Sign with dark ink for better visibility</li>
                                                <li>Ensure the image is clear and not blurry</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h3>
                                    <p className="text-gray-500">Ensure your account is using a long, random password to stay secure.</p>
                                </div>

                                <form onSubmit={submitPassword} className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.data.current_password}
                                            onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                            placeholder="Enter current password"
                                        />
                                        {passwordForm.errors.current_password && (
                                            <p className="mt-1 text-sm text-red-500">{passwordForm.errors.current_password}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.data.password}
                                            onChange={(e) => passwordForm.setData('password', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                            placeholder="Enter new password"
                                        />
                                        {passwordForm.errors.password && (
                                            <p className="mt-1 text-sm text-red-500">{passwordForm.errors.password}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={passwordForm.data.password_confirmation}
                                            onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={passwordForm.processing}
                                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 focus:ring-4 focus:ring-violet-200 transition-all disabled:opacity-50"
                                    >
                                        {passwordForm.processing ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
