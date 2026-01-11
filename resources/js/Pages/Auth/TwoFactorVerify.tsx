import { useState, useRef, useEffect, FormEventHandler, KeyboardEvent, ClipboardEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

interface Props {
    email: string;
    message?: string;
}

export default function TwoFactorVerify({ email, message }: Props) {
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    // Auto-focus first input on mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    // Sync codeDigits to form data
    useEffect(() => {
        const fullCode = codeDigits.join('');
        setData('code', fullCode);
    }, [codeDigits]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Handle individual digit input
    const handleCodeChange = (index: number, value: string) => {
        const digit = value.replace(/[^0-9]/g, '').slice(-1);
        const newDigits = [...codeDigits];
        newDigits[index] = digit;
        setCodeDigits(newDigits);

        // Auto-focus next input
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace navigation
    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!codeDigits[index] && index > 0) {
                const newDigits = [...codeDigits];
                newDigits[index - 1] = '';
                setCodeDigits(newDigits);
                inputRefs.current[index - 1]?.focus();
            } else {
                const newDigits = [...codeDigits];
                newDigits[index] = '';
                setCodeDigits(newDigits);
            }
        }
    };

    // Handle paste
    const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData
            .getData('text')
            .replace(/[^0-9]/g, '')
            .slice(0, 6);

        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < pastedData.length && i < 6; i++) {
            newDigits[i] = pastedData[i];
        }
        setCodeDigits(newDigits);

        const nextIndex = Math.min(pastedData.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    // Submit form
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        const fullCode = codeDigits.join('');
        if (fullCode.length === 6) {
            post('/2fa/verify');
        }
    };

    // Resend code
    const handleResend = async () => {
        if (isResending || countdown > 0) return;

        setIsResending(true);
        setResendMessage('');
        setResendError('');

        try {
            const response = await fetch('/2fa/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]'
                    )?.content || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                setResendMessage(result.message);
                setCountdown(60);
            } else {
                setResendError(result.message);
            }
        } catch {
            setResendError('Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <GuestLayout>
            <Head title="Verify Your Identity" />

            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    Verify Your Identity
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    We've sent a 6-digit verification code to
                </p>
                <p className="text-sm font-medium text-indigo-600">
                    {email}
                </p>
            </div>

            {message && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{message}</p>
                </div>
            )}

            {resendMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">{resendMessage}</p>
                </div>
            )}

            {resendError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{resendError}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* 6-digit code inputs */}
                <div className="flex justify-center gap-2 mb-6">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.code
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-300'
                            }`}
                            value={codeDigits[index] || ''}
                            onChange={(e) => handleCodeChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={processing}
                        />
                    ))}
                </div>

                <InputError message={errors.code} className="mb-4 text-center" />

                <PrimaryButton
                    className="w-full justify-center py-3"
                    disabled={processing || codeDigits.join('').length < 6}
                >
                    {processing ? 'Verifying...' : 'Verify Code'}
                </PrimaryButton>
            </form>

            {/* Resend code */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the code?
                </p>
                <button
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    {isResending
                        ? 'Sending...'
                        : countdown > 0
                        ? `Resend code in ${countdown}s`
                        : 'Resend Code'}
                </button>
            </div>

            {/* Back to login */}
            <div className="mt-6 text-center">
                <a
                    href="/login"
                    className="text-sm text-gray-500 hover:text-gray-700"
                >
                    Back to login
                </a>
            </div>

            {/* Security note */}
            <p className="mt-6 text-center text-xs text-gray-500">
                This code expires in 10 minutes. For security, never share
                your verification code with anyone.
            </p>
        </GuestLayout>
    );
}
