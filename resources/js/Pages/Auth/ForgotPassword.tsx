import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password" />

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
                        <h1 className="text-2xl font-light text-gray-700">Forgot Password</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                placeholder="you@example.com"
                                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="flex items-center justify-between">
                            <a
                                href={route('login')}
                                className="text-sm text-indigo-500 hover:text-indigo-600"
                            >
                                Back to login
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
