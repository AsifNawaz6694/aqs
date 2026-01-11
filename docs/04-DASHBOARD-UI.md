# DASHBOARD & UI COMPONENTS

## Dashboard Overview

The dashboard provides a beautiful, animated overview of key metrics with interactive charts and quick actions.

## Dashboard Features

- Animated stat cards with number counters
- Interactive charts (Area, Bar, Pie)
- Recent activity feed
- Quick action buttons
- Role-based dashboard views
- Real-time updates support

---

## DashboardController.php

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Product;
use App\Models\Client;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Get stats based on role
        $stats = $this->getStats($user);

        // Get chart data
        $charts = $this->getChartData($user);

        // Get recent activity
        $recentActivity = ActivityLog::with('causer')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'event' => $log->event,
                    'description' => $log->description,
                    'user' => $log->causer?->name ?? 'System',
                    'time' => $log->created_at->diffForHumans(),
                    'module' => $log->module,
                ];
            });

        return Inertia::render('Dashboard/Index', [
            'stats' => $stats,
            'charts' => $charts,
            'recentActivity' => $recentActivity,
        ]);
    }

    protected function getStats($user): array
    {
        $stats = [];

        // Total Users (admin only)
        if ($user->hasPermission('users.view')) {
            $stats['users'] = [
                'label' => 'Total Users',
                'value' => User::count(),
                'change' => $this->calculateChange(User::class, 'created_at'),
                'icon' => 'users',
                'color' => 'blue',
            ];
        }

        // Total Products
        if ($user->hasPermission('products.view')) {
            $stats['products'] = [
                'label' => 'Total Products',
                'value' => Product::count(),
                'change' => $this->calculateChange(Product::class, 'created_at'),
                'icon' => 'cube',
                'color' => 'indigo',
            ];

            // Low Stock Products
            $stats['low_stock'] = [
                'label' => 'Low Stock Items',
                'value' => Product::lowStock()->count(),
                'change' => null,
                'icon' => 'exclamation-triangle',
                'color' => 'orange',
            ];
        }

        // Total Clients
        if ($user->hasPermission('clients.view')) {
            $stats['clients'] = [
                'label' => 'Total Clients',
                'value' => Client::count(),
                'change' => $this->calculateChange(Client::class, 'created_at'),
                'icon' => 'building-office',
                'color' => 'green',
            ];
        }

        return $stats;
    }

    protected function getChartData($user): array
    {
        $charts = [];

        // Products by Category
        if ($user->hasPermission('products.view')) {
            $charts['productsByCategory'] = Product::select('category', DB::raw('count(*) as count'))
                ->whereNotNull('category')
                ->groupBy('category')
                ->orderByDesc('count')
                ->limit(6)
                ->get()
                ->map(fn($item) => [
                    'name' => $item->category,
                    'value' => $item->count,
                ]);

            // Products trend (last 7 days)
            $charts['productsTrend'] = $this->getTrend(Product::class, 7);
        }

        // Clients by Classification
        if ($user->hasPermission('clients.view')) {
            $charts['clientsByClassification'] = Client::select('classification', DB::raw('count(*) as count'))
                ->groupBy('classification')
                ->get()
                ->map(fn($item) => [
                    'name' => ucfirst($item->classification ?? 'Unknown'),
                    'value' => $item->count,
                ]);

            // Clients trend (last 7 days)
            $charts['clientsTrend'] = $this->getTrend(Client::class, 7);
        }

        // Activity by module (last 30 days)
        $charts['activityByModule'] = ActivityLog::select('module', DB::raw('count(*) as count'))
            ->whereNotNull('module')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('module')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'name' => ucfirst($item->module),
                'value' => $item->count,
            ]);

        return $charts;
    }

    protected function calculateChange(string $model, string $dateField): ?float
    {
        $currentMonth = $model::whereMonth($dateField, now()->month)
            ->whereYear($dateField, now()->year)
            ->count();

        $lastMonth = $model::whereMonth($dateField, now()->subMonth()->month)
            ->whereYear($dateField, now()->subMonth()->year)
            ->count();

        if ($lastMonth === 0) {
            return $currentMonth > 0 ? 100 : 0;
        }

        return round((($currentMonth - $lastMonth) / $lastMonth) * 100, 1);
    }

    protected function getTrend(string $model, int $days): array
    {
        $data = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $data[] = [
                'date' => $date->format('M d'),
                'count' => $model::whereDate('created_at', $date)->count(),
            ];
        }
        return $data;
    }
}
```

---

## Dashboard/Index.tsx

```tsx
import React, { useEffect, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    UsersIcon,
    CubeIcon,
    BuildingOfficeIcon,
    ExclamationTriangleIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import AppLayout from '@/Layouts/AppLayout';

// Animated counter hook
function useAnimatedCounter(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * end));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return count;
}

// Icon mapping
const iconMap = {
    users: UsersIcon,
    cube: CubeIcon,
    'building-office': BuildingOfficeIcon,
    'exclamation-triangle': ExclamationTriangleIcon,
};

// Color mapping
const colorMap = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', light: 'bg-indigo-100', text: 'text-indigo-600' },
    green: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-600' },
};

// Chart colors
const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

// Stat Card Component
function StatCard({ stat, index }: { stat: any; index: number }) {
    const Icon = iconMap[stat.icon] || CubeIcon;
    const colors = colorMap[stat.color] || colorMap.indigo;
    const animatedValue = useAnimatedCounter(stat.value);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 cursor-pointer"
        >
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${colors.light}`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                {stat.change !== null && (
                    <div className={`flex items-center text-sm font-medium ${
                        stat.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {stat.change >= 0 ? (
                            <ArrowUpIcon className="w-4 h-4 mr-1" />
                        ) : (
                            <ArrowDownIcon className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(stat.change)}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <motion.h3
                    className="text-3xl font-bold text-gray-900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {animatedValue.toLocaleString()}
                </motion.h3>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
            </div>
        </motion.div>
    );
}

// Chart Card Component
function ChartCard({ title, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}

// Activity Item Component
function ActivityItem({ activity, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-4 py-3"
        >
            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-indigo-500" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span>{activity.user}</span>
                    <span>.</span>
                    <span className="flex items-center">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {activity.time}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export default function Dashboard({ stats, charts, recentActivity }) {
    const { auth } = usePage().props;
    const statsArray = Object.values(stats);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <div className="space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {auth.user.name.split(' ')[0]}!
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Here's what's happening with your business today.
                    </p>
                </motion.div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statsArray.map((stat, index) => (
                        <StatCard key={stat.label} stat={stat} index={index} />
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Area Chart - Trends */}
                    {charts.productsTrend && (
                        <ChartCard title="Products Trend (Last 7 Days)" delay={0.3}>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.productsTrend}>
                                        <defs>
                                            <linearGradient id="colorProducts" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorProducts)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    )}

                    {/* Bar Chart - Products by Category */}
                    {charts.productsByCategory?.length > 0 && (
                        <ChartCard title="Products by Category" delay={0.4}>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.productsByCategory} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#6366f1"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    )}
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Pie Chart - Clients by Classification */}
                    {charts.clientsByClassification?.length > 0 && (
                        <ChartCard title="Clients by Classification" delay={0.5}>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={charts.clientsByClassification}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {charts.clientsByClassification.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </ChartCard>
                    )}

                    {/* Recent Activity */}
                    <div className="lg:col-span-2">
                        <ChartCard title="Recent Activity" delay={0.6}>
                            <div className="max-h-64 overflow-y-auto">
                                {recentActivity.length > 0 ? (
                                    <div className="divide-y divide-gray-100">
                                        {recentActivity.map((activity, index) => (
                                            <ActivityItem
                                                key={activity.id}
                                                activity={activity}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">
                                        No recent activity
                                    </p>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Link
                                    href="/activity-logs"
                                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                                >
                                    View all activity →
                                </Link>
                            </div>
                        </ChartCard>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
```

---

## Base UI Components

### Button.tsx

```tsx
import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
};

const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={`
                inline-flex items-center justify-center font-medium rounded-lg
                transition-colors duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variants[variant]}
                ${sizes[size]}
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </motion.button>
    );
}
```

### Input.tsx

```tsx
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`
                            block w-full rounded-lg border transition-colors duration-200
                            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
                            ${error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                            }
                            focus:outline-none focus:ring-2 focus:ring-opacity-50
                            disabled:bg-gray-100 disabled:cursor-not-allowed
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-sm text-red-600"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
```

### Modal.tsx

```tsx
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children: React.ReactNode;
}

const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
};

export default function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
}: ModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel
                                className={`
                                    w-full ${sizes[size]} transform overflow-hidden rounded-2xl
                                    bg-white shadow-2xl transition-all
                                `}
                            >
                                {title && (
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                        <Dialog.Title className="text-lg font-semibold text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                                <div className="p-6">{children}</div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
```

### Toast.tsx

```tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
    onClose: () => void;
}

const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
};

const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconStyles = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
};

export default function Toast({
    message,
    type = 'success',
    isVisible,
    onClose,
}: ToastProps) {
    const Icon = icons[type];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    className="fixed top-4 right-4 z-50"
                >
                    <div
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                            ${styles[type]}
                        `}
                    >
                        <Icon className={`w-5 h-5 flex-shrink-0 ${iconStyles[type]}`} />
                        <span className="text-sm font-medium">{message}</span>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-black/10 rounded transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

### Badge.tsx

```tsx
import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    color?: 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange';
    size?: 'sm' | 'md';
}

const colors = {
    gray: 'bg-gray-100 text-gray-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    purple: 'bg-purple-100 text-purple-800',
    pink: 'bg-pink-100 text-pink-800',
    orange: 'bg-orange-100 text-orange-800',
};

const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
};

export default function Badge({
    children,
    color = 'gray',
    size = 'sm',
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center font-medium rounded-full
                ${colors[color]}
                ${sizes[size]}
            `}
        >
            {children}
        </span>
    );
}
```

---

## Animation Utilities

### animations.ts

```typescript
// Framer Motion animation variants

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
};

export const slideDown = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const slideLeft = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
};

export const slideRight = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
};

export const scale = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
};

export const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
};

// Page transition
export const pageTransition = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.3 },
};

// Card hover effect
export const cardHover = {
    whileHover: {
        y: -4,
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        transition: { duration: 0.2 },
    },
};

// Button press effect
export const buttonPress = {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
};
```

---

## Tailwind CSS Configuration

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                    950: '#1e1b4b',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'spin-slow': 'spin 3s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
};
```

---

## Required npm Packages

```json
{
    "dependencies": {
        "@headlessui/react": "^2.0.0",
        "@inertiajs/react": "^2.0.0",
        "framer-motion": "^11.0.0",
        "lucide-react": "^0.400.0",
        "react": "^19.0.0",
        "react-dom": "^19.0.0",
        "recharts": "^2.12.0"
    },
    "devDependencies": {
        "@tailwindcss/forms": "^0.5.0",
        "@tailwindcss/vite": "^4.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
        "@vitejs/plugin-react": "^4.0.0",
        "tailwindcss": "^4.0.0",
        "typescript": "^5.0.0",
        "vite": "^7.0.0"
    }
}
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-09
**Module:** Dashboard & UI Components
