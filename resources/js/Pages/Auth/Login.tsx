import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
}: {
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
                {/* Logo */}
                <div className="mb-8">
                    <img
                        src="https://cdn.ekuep.com/v4ekuep/ekuep-ksa-v4/imgs/ekuep-logo-en.svg"
                        alt="Logo"
                        className="h-16 w-auto"
                    />
                </div>

                {/* Login Card */}
                <div className="w-full max-w-md overflow-hidden rounded-lg bg-white px-8 py-8 shadow-md">
                    {/* Welcome Text */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-light italic text-gray-700">Welcome to</h1>
                        <h2 className="mt-1 text-xl font-normal text-gray-600">Ekuep Quotation System</h2>
                    </div>

                    {status && (
                        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

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
                                placeholder="admin@example.com"
                                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div className="mb-4">
                            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                placeholder="••••••••"
                                className="block w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="mb-6 flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-2 text-sm text-gray-600">Remember me</span>
                            </label>
                            <a
                                href={route('password.request')}
                                className="text-sm text-indigo-500 hover:text-indigo-600"
                            >
                                Forgot password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-md bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {processing ? 'Logging in...' : 'Log in'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
