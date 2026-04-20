import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Reset Password" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
                {/* Logo */}
                <div className="mb-8">
                    <img
                        src="https://cdn.ekuep.com/v4ekuep/ekuep-ksa-v4/imgs/ekuep-logo-en.svg"
                        alt="Logo"
                        className="h-16 w-auto"
                    />
                </div>

                {/* Card */}
                <div className="w-full max-w-md overflow-hidden rounded-lg bg-white px-8 py-8 shadow-md">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-light text-gray-700">Reset Password</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={submit}>
                        {/* Email */}
                        <div className="mb-4">
                            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="block w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoComplete="username"
                                readOnly
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoComplete="new-password"
                                autoFocus
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-6">
                            <label htmlFor="password_confirmation" className="mb-1 block text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                            <InputError message={errors.password_confirmation} className="mt-2" />
                        </div>

                        {/* Submit */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
