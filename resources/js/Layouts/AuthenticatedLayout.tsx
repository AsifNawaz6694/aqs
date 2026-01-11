import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useRef, useEffect } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role?: {
        slug: string;
        name: string;
    };
}

interface PageProps {
    auth: {
        user: User;
    };
    [key: string]: unknown;
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const isSuperAdmin = user.role?.slug === 'super-admin';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            current: route().current('dashboard'),
            show: true,
        },
        {
            name: 'Products',
            href: '/products',
            current: route().current('products.*'),
            show: true,
        },
        {
            name: 'Clients',
            href: '/clients',
            current: route().current('clients.*'),
            show: true,
        },
        {
            name: 'Quotations',
            href: '/quotations',
            current: route().current('quotations.*'),
            show: true,
        },
        {
            name: 'Users',
            href: '/users',
            current: route().current('users.*'),
            show: isSuperAdmin,
        },
        {
            name: 'Roles',
            href: '/roles',
            current: route().current('roles.*'),
            show: isSuperAdmin,
        },
        {
            name: 'Activity Logs',
            href: '/activity-logs',
            current: route().current('activity-logs.*'),
            show: isSuperAdmin,
        },
        {
            name: 'Settings',
            href: '/settings',
            current: route().current('settings.*'),
            show: isSuperAdmin,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Navigation */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo & Main Nav */}
                        <div className="flex items-center">
                            {/* Logo */}
                            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
                                <img
                                    src="https://cdn.ekuep.com/v4ekuep/ekuep-ksa-v4/imgs/ekuep-logo-en.svg"
                                    alt="Ekuep"
                                    className="h-10 w-auto"
                                />
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:ml-8 lg:flex lg:items-center lg:space-x-1">
                                {navigation
                                    .filter((item) => item.show)
                                    .map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                item.current
                                                    ? 'bg-violet-100 text-violet-700'
                                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                            }`}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3">
                            {/* User Menu */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                                        <span className="text-sm font-bold text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.role?.name || 'User'}</p>
                                    </div>
                                    <svg className="w-4 h-4 text-slate-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* User Dropdown */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                                        <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile Settings
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Sign out
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {mobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 bg-white">
                        <div className="px-4 py-3 space-y-1">
                            {navigation
                                .filter((item) => item.show)
                                .map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            item.current
                                                ? 'bg-violet-100 text-violet-700'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.name}
                                    </Link>
                                ))}
                        </div>
                    </div>
                )}
            </nav>

            {/* Page Header */}
            {header && (
                <header className="bg-white border-b border-slate-200">
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {header}
                        </h1>
                    </div>
                </header>
            )}

            {/* Page Content */}
            <main className="px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
