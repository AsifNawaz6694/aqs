import { FormEventHandler } from 'react';
import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
    token: string | null;
    email: string | null;
    error?: string;
}

export default function PasswordSetup({ token, email, error }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/password/setup');
    };

    if (error) {
        return (
            <GuestLayout>
                <Head title="Password Setup" />
                <div className="text-center">
                    <div className="mb-4 text-red-600">
                        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Link Expired
                    </h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <a
                        href="/login"
                        className="text-indigo-600 hover:text-indigo-500"
                    >
                        Return to login
                    </a>
                </div>
            </GuestLayout>
        );
    }

    return (
        <GuestLayout>
            <Head title="Set Up Your Password" />

            <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Set Up Your Password
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Welcome! Please create a secure password for your account.
                </p>
                <p className="text-sm font-medium text-indigo-600">{email}</p>
            </div>

            <form onSubmit={handleSubmit}>
                <input type="hidden" name="token" value={data.token} />

                <div>
                    <InputLabel htmlFor="password" value="New Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        isFocused={true}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700">Password requirements:</p>
                    <ul className="list-disc list-inside mt-2 text-sm text-gray-600 space-y-1">
                        <li>Minimum 8 characters</li>
                    </ul>
                </div>

                <div className="mt-6">
                    <PrimaryButton className="w-full justify-center py-3" disabled={processing}>
                        {processing ? 'Setting Password...' : 'Set Password'}
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
