import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

/* ─── Animation Primitives ─── */

function useInView(threshold = 0.08) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, visible };
}

function Reveal({ children, delay = 0, direction = 'up', className = '' }: {
    children: React.ReactNode; delay?: number; direction?: 'up' | 'down' | 'left' | 'right' | 'scale'; className?: string;
}) {
    const { ref, visible } = useInView();
    const transforms: Record<string, string> = {
        up: 'translate3d(0,60px,0)', down: 'translate3d(0,-60px,0)',
        left: 'translate3d(-60px,0,0)', right: 'translate3d(60px,0,0)',
        scale: 'scale(0.85)',
    };
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translate3d(0,0,0) scale(1)' : transforms[direction],
            transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
            willChange: 'opacity, transform',
        }}>
            {children}
        </div>
    );
}

/* Animated number with blur-to-sharp + scale pop */
function Counter({ value, prefix = '', suffix = '', duration = 1400, decimals = 0 }: {
    value: number; prefix?: string; suffix?: string; duration?: number; decimals?: number;
}) {
    const { ref, visible } = useInView();
    const [display, setDisplay] = useState(0);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!visible) return;
        let raf: number;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - t, 4);
            const v = ease * value;
            setDisplay(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v));
            if (t < 1) raf = requestAnimationFrame(tick); else setDone(true);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [visible, value, duration, decimals]);

    const formatted = decimals > 0
        ? display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : display.toLocaleString();

    return (
        <span ref={ref} className="inline-block tabular-nums" style={{
            filter: done ? 'blur(0)' : 'blur(2px)',
            transform: done ? 'scale(1)' : 'scale(1.05)',
            transition: 'filter 0.4s, transform 0.4s cubic-bezier(.34,1.56,.64,1)',
        }}>
            {prefix}{formatted}{suffix}
        </span>
    );
}

/* Animated progress ring (SVG) */
function ProgressRing({ value, max, size = 56, stroke = 5, color = '#8b5cf6', label }: {
    value: number; max: number; size?: number; stroke?: number; color?: string; label?: string;
}) {
    const { ref, visible } = useInView();
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = max > 0 ? Math.min(value / max, 1) : 0;

    return (
        <div ref={ref} className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-100" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={visible ? circumference * (1 - pct) : circumference}
                    style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1) 0.3s' }}
                />
            </svg>
            {label && (
                <span className="absolute text-[10px] font-bold text-slate-700">{label}</span>
            )}
        </div>
    );
}

/* Sparkline */
function Sparkline({ data, color = '#8b5cf6', h = 36 }: { data: number[]; color?: string; h?: number }) {
    if (data.length < 2) return null;
    const mx = Math.max(...data, 1), mn = Math.min(...data, 0), rng = mx - mn || 1;
    const w = 120;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h * 0.8 - h * 0.1}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`sp-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sp-${color.replace('#','')})`} className="spark-area" />
            <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spark-line" />
        </svg>
    );
}

/* ─── Interfaces ─── */

interface Stats {
    total_users: number; active_users: number; total_products: number; active_products: number;
    low_stock_products: number; total_clients: number; active_clients: number; new_clients_this_month: number;
    total_quotations: number; pending_quotations: number; approved_quotations: number; sent_quotations: number;
    accepted_quotations: number; rejected_quotations: number; quotations_value: number; pending_value: number;
    conversion_rate: number; avg_quotation_value: number;
}
interface ActivityItem { id: number; user_name: string; action: string; model_type: string | null; description: string | null; created_at: string; }
interface ChartData { date?: string; count: number; category?: string; type?: string; role?: string; action?: string; day?: string; }
interface QuotationStatusData { status: string; key: string; count: number; value: number; color: string; }
interface QuotationTrendData { date: string; created: number; accepted: number; value: number; }
interface TopClient { id: number; name: string; type: string; quotation_count: number; total_value: number; accepted_value: number; }
interface MonthlyData { month: string; short: string; created: number; accepted: number; value: number; }
interface MonthlyStats { new_users: number; new_clients: number; new_products: number; new_quotations: number; month_value: number; }
interface PerformanceMetrics { quotations_this_week: number; quotations_last_week: number; week_change: number; avg_items_per_quotation: number; }
interface UserOption { id: number; name: string; }
interface Filters { user_id: number | null; date_range: string; date_from: string | null; date_to: string | null; }

interface TopProduct { name: string; item_code: string; usage_count: number; total_quantity: number; total_value: number; }
interface TopQuotation { id: number; quotation_number: string; client_name: string; user_name: string; status: string; status_key: string; grand_total: number; created_at: string; }

interface Props {
    stats?: Stats; recentActivity?: ActivityItem[]; activityByDay?: ChartData[];
    productsByCategory?: ChartData[]; clientsByType?: ChartData[]; usersByRole?: ChartData[];
    activityByAction?: ChartData[]; quotationsByStatus?: QuotationStatusData[];
    quotationsTrend?: QuotationTrendData[]; topClients?: TopClient[];
    topProducts?: TopProduct[]; topQuotations?: TopQuotation[];
    quotationsByMonth?: MonthlyData[]; monthlyStats?: MonthlyStats;
    performanceMetrics?: PerformanceMetrics; users?: UserOption[]; filters?: Filters;
}

/* ─── Dashboard Component ─── */

export default function Dashboard({
    stats, recentActivity = [], activityByDay = [], productsByCategory = [], clientsByType = [],
    quotationsByStatus = [], quotationsTrend = [], topClients = [], topProducts = [], topQuotations = [],
    quotationsByMonth = [], monthlyStats, performanceMetrics, users = [], filters,
}: Props) {
    const { auth } = usePage().props as any;

    // Filters
    const [selectedUserId, setSelectedUserId] = useState<string>(filters?.user_id?.toString() || '');
    const [selectedDateRange, setSelectedDateRange] = useState<string>(filters?.date_range || '');
    const [customDateFrom, setCustomDateFrom] = useState<string>(filters?.date_from || '');
    const [customDateTo, setCustomDateTo] = useState<string>(filters?.date_to || '');

    const dateRangeOptions = [
        { value: '', label: 'All Time' }, { value: 'today', label: 'Today' }, { value: 'yesterday', label: 'Yesterday' },
        { value: 'last_7_days', label: 'Last 7 Days' }, { value: 'last_30_days', label: 'Last 30 Days' },
        { value: 'this_month', label: 'This Month' }, { value: 'last_month', label: 'Last Month' },
        { value: 'this_quarter', label: 'This Quarter' }, { value: 'this_year', label: 'This Year' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};
        if (selectedUserId) params.user_id = selectedUserId;
        if (selectedDateRange) params.date_range = selectedDateRange;
        if (selectedDateRange === 'custom') {
            if (customDateFrom) params.date_from = customDateFrom;
            if (customDateTo) params.date_to = customDateTo;
        }
        router.get(route('dashboard'), params, { preserveState: true, preserveScroll: true });
    }, [selectedUserId, selectedDateRange, customDateFrom, customDateTo]);

    const clearFilters = () => {
        setSelectedUserId(''); setSelectedDateRange(''); setCustomDateFrom(''); setCustomDateTo('');
        router.get(route('dashboard'), {}, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        if (selectedDateRange !== 'custom') applyFilters();
    }, [selectedUserId, selectedDateRange]);

    const hasPermission = (p: string) => auth.user?.permissions?.includes(p);
    const fmtCurrency = (n: number) => new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
    const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const actionColors: Record<string, string> = {
        created: 'bg-emerald-100 text-emerald-700', updated: 'bg-blue-100 text-blue-700',
        deleted: 'bg-red-100 text-red-700', login: 'bg-violet-100 text-violet-700', logout: 'bg-slate-100 text-slate-600',
    };

    const statusColors: Record<string, string> = {
        draft: 'bg-slate-100 text-slate-700', pending_review: 'bg-amber-100 text-amber-700',
        approved: 'bg-emerald-100 text-emerald-700', sent: 'bg-blue-100 text-blue-700',
        accepted: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
    };

    /* ─── Chart Data ─── */

    const activityChartData = {
        labels: activityByDay.map(d => d.day || d.date),
        datasets: [{
            label: 'Activities', data: activityByDay.map(d => d.count), fill: true,
            borderColor: '#8b5cf6', borderWidth: 2.5, tension: 0.4,
            backgroundColor: (ctx: any) => {
                const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
                g.addColorStop(0, 'rgba(139,92,246,0.25)'); g.addColorStop(1, 'rgba(139,92,246,0)');
                return g;
            },
            pointRadius: 3, pointHoverRadius: 7, pointBackgroundColor: '#8b5cf6',
            pointBorderColor: '#fff', pointBorderWidth: 2, pointHoverBorderWidth: 3,
        }],
    };

    const monthlyChartData = {
        labels: quotationsByMonth.map(d => d.short),
        datasets: [
            { label: 'Created', data: quotationsByMonth.map(d => d.created), backgroundColor: 'rgba(99,102,241,0.85)', borderRadius: 8, borderSkipped: false as const },
            { label: 'Won', data: quotationsByMonth.map(d => d.accepted), backgroundColor: 'rgba(34,197,94,0.85)', borderRadius: 8, borderSkipped: false as const },
        ],
    };

    const statusChartData = {
        labels: quotationsByStatus.map(d => d.status),
        datasets: [{ data: quotationsByStatus.map(d => d.count), backgroundColor: quotationsByStatus.map(d => d.color), borderWidth: 0, hoverOffset: 12 }],
    };

    const categoryChartData = {
        labels: productsByCategory.map(d => d.category || 'Other'),
        datasets: [{
            label: 'Products', data: productsByCategory.map(d => d.count),
            backgroundColor: ['rgba(139,92,246,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(6,182,212,0.8)'],
            borderRadius: 6, borderSkipped: false as const,
        }],
    };

    const baseOpts = {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 1400, easing: 'easeOutQuart' as const },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 14, cornerRadius: 10, borderColor: 'rgba(139,92,246,0.2)', borderWidth: 1 } },
        scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } }, y: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, beginAtZero: true } },
    };

    const barOpts = { ...baseOpts, animation: { ...baseOpts.animation, duration: 1600, easing: 'easeOutBounce' as const }, plugins: { ...baseOpts.plugins, legend: { display: true, position: 'top' as const, labels: { usePointStyle: true, padding: 20 } } } };
    const horizBarOpts = { ...baseOpts, indexAxis: 'y' as const, scales: { x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', font: { size: 11 } } }, y: { grid: { display: false }, ticks: { color: '#475569', font: { size: 12 } } } } };
    const doughnutOpts = { responsive: true, maintainAspectRatio: false, cutout: '72%', animation: { animateRotate: true, animateScale: true, duration: 1600, easing: 'easeOutQuart' as const }, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,23,42,0.95)', padding: 14, cornerRadius: 10 } } };

    /* ─── Typewriter for hero ─── */
    const firstName = auth.user?.name?.split(' ')[0] || 'User';
    const [typed, setTyped] = useState('');
    useEffect(() => {
        let i = 0;
        const iv = setInterval(() => {
            setTyped(firstName.slice(0, ++i));
            if (i >= firstName.length) clearInterval(iv);
        }, 80);
        return () => clearInterval(iv);
    }, [firstName]);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">

                {/* ═══════════ HERO ═══════════ */}
                <Reveal delay={0}>
                <div className="relative overflow-hidden rounded-3xl hero-gradient p-8 md:p-10 text-white shadow-2xl">
                    {/* Animated orbs */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 rounded-full bg-white/10 blur-3xl orb-float" />
                    <div className="absolute bottom-0 left-0 -mb-24 -ml-24 w-96 h-96 rounded-full bg-white/5 blur-3xl orb-float-reverse" />
                    <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-violet-400/10 blur-2xl orb-pulse" />

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDcpIi8+PC9zdmc+')] opacity-80" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                                </span>
                                <span className="text-violet-200 text-sm font-medium">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-200 to-white hero-text-shimmer">{typed}</span>
                                <span className="inline-block w-0.5 h-8 bg-white/70 ml-1 animate-blink align-middle" />
                            </h1>

                            <p className="text-violet-200 text-lg max-w-xl">
                                {stats?.pending_quotations ? (
                                    <>You have <span className="text-white font-bold px-2 py-0.5 bg-white/15 rounded-lg">{stats.pending_quotations}</span> pending quotations awaiting action.</>
                                ) : 'Your dashboard overview at a glance.'}
                            </p>

                            {/* Hero mini-stats with glass cards */}
                            <div className="flex flex-wrap gap-4 mt-8">
                                {[
                                    { label: 'This Month', value: monthlyStats?.new_quotations || 0, sub: 'New Quotations' },
                                    { label: 'Revenue', value: fmtCurrency(monthlyStats?.month_value || 0), sub: 'Accepted Value', raw: true },
                                    { label: 'Win Rate', value: stats?.conversion_rate || 0, sub: 'Conversion', suffix: '%' },
                                ].map((item, i) => (
                                    <Reveal key={i} delay={400 + i * 120} direction="up">
                                        <div className="glass-card rounded-2xl px-5 py-4 min-w-[140px] group hover:bg-white/20 transition-all duration-300">
                                            <p className="text-violet-300 text-[10px] uppercase tracking-widest font-semibold mb-1">{item.label}</p>
                                            <p className="text-2xl font-extrabold tracking-tight">
                                                {item.raw ? item.value : <Counter value={item.value as number} suffix={item.suffix} />}
                                            </p>
                                            <p className="text-violet-300 text-xs mt-0.5">{item.sub}</p>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {hasPermission('quotations.create') && (
                                <Link href={route('quotations.create')} className="group inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-violet-700 font-bold rounded-2xl hover:bg-violet-50 transition-all shadow-xl hover:shadow-2xl hero-btn">
                                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    New Quotation
                                </Link>
                            )}
                            {hasPermission('clients.create') && (
                                <Link href={route('clients.create')} className="inline-flex items-center justify-center gap-2 px-7 py-4 glass-card text-white font-bold rounded-2xl hover:bg-white/20 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                    Add Client
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                </Reveal>

                {/* ═══════════ FILTERS ═══════════ */}
                <Reveal delay={100}>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">Filters</span>
                        </div>

                        <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="h-10 px-4 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 min-w-[160px]">
                            <option value="">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id.toString()}>{u.name}</option>)}
                        </select>

                        <select value={selectedDateRange} onChange={(e) => setSelectedDateRange(e.target.value)} className="h-10 px-4 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 min-w-[160px]">
                            {dateRangeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>

                        {selectedDateRange === 'custom' && (
                            <div className="flex items-center gap-2 animate-in">
                                <input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
                                <span className="text-slate-400">to</span>
                                <input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="h-10 px-3 rounded-xl border border-slate-200 text-sm" />
                                <button onClick={applyFilters} className="h-10 px-5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">Apply</button>
                            </div>
                        )}

                        {(selectedUserId || selectedDateRange) && (
                            <button onClick={clearFilters} className="ml-auto h-10 px-4 text-sm font-medium text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                Clear
                            </button>
                        )}
                    </div>
                </div>
                </Reveal>

                {/* ═══════════ STAT CARDS ═══════════ */}
                {stats && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { title: 'Total Clients', value: stats.total_clients, sub: `${stats.active_clients} active`, badge: `+${stats.new_clients_this_month} this month`, badgeColor: 'text-emerald-600 bg-emerald-50', icon: '👥', gradient: 'from-violet-500/10 to-purple-500/10', borderHover: 'hover:border-violet-300', link: 'clients.index', perm: 'clients.view', ring: { value: stats.active_clients, max: stats.total_clients, color: '#8b5cf6' } },
                            { title: 'Products', value: stats.total_products, sub: `${stats.active_products} active`, badge: stats.low_stock_products > 0 ? `${stats.low_stock_products} low stock` : '', badgeColor: 'text-amber-600 bg-amber-50', icon: '📦', gradient: 'from-emerald-500/10 to-teal-500/10', borderHover: 'hover:border-emerald-300', link: 'products.index', perm: 'products.view', ring: { value: stats.active_products, max: stats.total_products, color: '#10b981' } },
                            { title: 'Quotations', value: stats.total_quotations, sub: `${stats.sent_quotations} sent`, badge: stats.pending_quotations > 0 ? `${stats.pending_quotations} pending` : '', badgeColor: 'text-blue-600 bg-blue-50', icon: '📋', gradient: 'from-blue-500/10 to-indigo-500/10', borderHover: 'hover:border-blue-300', link: 'quotations.index', perm: 'quotations.view', sparkData: quotationsByMonth.map(m => m.created), sparkColor: '#3b82f6', ring: { value: stats.accepted_quotations, max: stats.total_quotations, color: '#3b82f6' } },
                            { title: 'Revenue', value: stats.quotations_value, sub: `${fmtCurrency(stats.pending_value)} pending`, badge: `${stats.accepted_quotations} won`, badgeColor: 'text-white/80 bg-white/20', icon: '💰', isRevenue: true, sparkData: quotationsByMonth.map(m => m.value), sparkColor: '#fff' },
                        ].map((card, i) => (
                            <Reveal key={i} delay={200 + i * 100} direction={i % 2 === 0 ? 'left' : 'right'} className="h-full">
                            {card.isRevenue ? (
                                <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 rounded-2xl p-5 shadow-lg card-3d hover:shadow-2xl transition-all duration-500 h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-[2] transition-transform duration-700" />
                                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6 group-hover:scale-[3] transition-transform duration-700" />
                                    <div className="relative text-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-3xl card-icon">{card.icon}</span>
                                            {card.badge && <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${card.badgeColor}`}>{card.badge}</span>}
                                        </div>
                                        <p className="text-sm font-medium text-white/70 mb-1">{card.title}</p>
                                        <p className="text-3xl font-extrabold tracking-tight"><Counter value={card.value} prefix="SAR " /></p>
                                        <p className="text-sm text-white/60 mt-1">{card.sub}</p>
                                        {card.sparkData && card.sparkData.length > 1 && (
                                            <div className="mt-3 opacity-40 group-hover:opacity-70 transition-opacity duration-500"><Sparkline data={card.sparkData} color={card.sparkColor || '#fff'} /></div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link href={hasPermission(card.perm!) ? route(card.link!) : '#'}
                                    className={`block group relative overflow-hidden bg-white rounded-2xl p-5 shadow-sm border border-slate-200 ${card.borderHover} card-3d hover:shadow-xl transition-all duration-500 h-full`}>
                                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${card.gradient} rounded-full -mr-16 -mt-16 group-hover:scale-[2] transition-transform duration-700`} />
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-3xl card-icon">{card.icon}</span>
                                                {card.ring && <ProgressRing value={card.ring.value} max={card.ring.max} color={card.ring.color} size={44} stroke={4} label={`${card.ring.max > 0 ? Math.round(card.ring.value / card.ring.max * 100) : 0}%`} />}
                                            </div>
                                            {card.badge && <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${card.badgeColor}`}>{card.badge}</span>}
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
                                        <p className="text-3xl font-extrabold text-slate-900 tracking-tight"><Counter value={card.value} /></p>
                                        <p className="text-sm text-slate-500 mt-1">{card.sub}</p>
                                        {card.sparkData && card.sparkData.length > 1 && (
                                            <div className="mt-3 opacity-40 group-hover:opacity-100 transition-opacity duration-500"><Sparkline data={card.sparkData} color={card.sparkColor} /></div>
                                        )}
                                    </div>
                                </Link>
                            )}
                            </Reveal>
                        ))}
                    </div>
                )}

                {/* ═══════════ PERFORMANCE ROW ═══════════ */}
                <div className="grid gap-4 lg:grid-cols-4">
                    <Reveal delay={400} direction="left" className="h-full">
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-xl card-3d h-full">
                        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-white/10 blur-xl orb-pulse" />
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-sm tracking-wide">This Week</h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${(performanceMetrics?.week_change || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
                                {(performanceMetrics?.week_change || 0) >= 0 ? '+' : ''}{performanceMetrics?.week_change || 0}%
                            </span>
                        </div>
                        <p className="text-4xl font-black tracking-tight"><Counter value={performanceMetrics?.quotations_this_week || 0} /></p>
                        <p className="text-indigo-200 text-xs mt-1">Quotations created</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-indigo-300">
                            <span>vs {performanceMetrics?.quotations_last_week || 0} last week</span>
                            <span className="text-indigo-400">|</span>
                            <span>~{performanceMetrics?.avg_items_per_quotation || 0} items/quotation</span>
                        </div>
                    </div>
                    </Reveal>

                    <Reveal delay={500} direction="up" className="h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <h3 className="font-bold text-slate-900 text-sm mb-3">Clients by Type</h3>
                        {clientsByType.length > 0 ? clientsByType.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.type === 'Company' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                                        <span className="text-lg">{item.type === 'Company' ? '🏢' : '👤'}</span>
                                    </div>
                                    <span className="font-medium text-slate-700 text-sm">{item.type}</span>
                                </div>
                                <span className="text-2xl font-black text-slate-900"><Counter value={item.count} /></span>
                            </div>
                        )) : <p className="text-center text-slate-400 py-4 text-sm">No data</p>}
                    </div>
                    </Reveal>

                    <Reveal delay={600} direction="up" className="lg:col-span-2 h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <h3 className="font-bold text-slate-900 text-sm mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { label: 'Quotations', icon: '📋', colors: 'from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100', route: 'quotations.index', perm: 'quotations.view' },
                                { label: 'Clients', icon: '👥', colors: 'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100', route: 'clients.index', perm: 'clients.view' },
                                { label: 'Products', icon: '📦', colors: 'from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100', route: 'products.index', perm: 'products.view' },
                                { label: 'Users', icon: '🛡️', colors: 'from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100', route: 'users.index', perm: 'users.view' },
                            ].filter(a => hasPermission(a.perm)).map((action, idx) => (
                                <Link key={idx} href={route(action.route)} className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br ${action.colors} transition-all group`}>
                                    <span className="text-2xl group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-300">{action.icon}</span>
                                    <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                    </Reveal>
                </div>

                {/* ═══════════ CHARTS ROW 1 ═══════════ */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Reveal delay={200} direction="left" className="lg:col-span-2 h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Activity Overview</h3>
                                <p className="text-sm text-slate-500">System activity trends</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-violet-500" /><span className="text-slate-600">Activities</span></div>
                        </div>
                        <div className="h-72">
                            {activityByDay.length > 0 ? <Line data={activityChartData} options={baseOpts} /> : (
                                <div className="h-full flex items-center justify-center text-slate-400"><p className="text-sm">No activity data yet</p></div>
                            )}
                        </div>
                    </div>
                    </Reveal>

                    <Reveal delay={300} direction="right" className="h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Quotation Status</h3>
                        <p className="text-sm text-slate-500 mb-4">Distribution</p>
                        <div className="h-52 relative">
                            {quotationsByStatus.length > 0 ? (
                                <>
                                    <Doughnut data={statusChartData} options={doughnutOpts} />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <p className="text-3xl font-black text-slate-900"><Counter value={stats?.total_quotations || 0} /></p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</p>
                                        </div>
                                    </div>
                                </>
                            ) : <div className="h-full flex items-center justify-center text-slate-400"><p className="text-sm">No data</p></div>}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-1.5">
                            {quotationsByStatus.slice(0, 6).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs py-1">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-slate-600 truncate">{item.status}</span>
                                    <span className="text-slate-400 ml-auto font-semibold">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    </Reveal>
                </div>

                {/* ═══════════ CHARTS ROW 2 ═══════════ */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Reveal delay={200} direction="up" className="h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div><h3 className="text-lg font-bold text-slate-900">Quotation Trend</h3><p className="text-sm text-slate-500">Created vs Won</p></div>
                            {hasPermission('quotations.view') && <Link href={route('quotations.index')} className="text-sm text-violet-600 hover:text-violet-800 font-semibold">View All</Link>}
                        </div>
                        <div className="h-72">{quotationsByMonth.length > 0 ? <Bar data={monthlyChartData} options={barOpts} /> : <div className="h-full flex items-center justify-center text-slate-400"><p className="text-sm">No data</p></div>}</div>
                    </div>
                    </Reveal>

                    <Reveal delay={300} direction="up" className="h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div><h3 className="text-lg font-bold text-slate-900">Products by Category</h3><p className="text-sm text-slate-500">Top categories</p></div>
                            {hasPermission('products.view') && <Link href={route('products.index')} className="text-sm text-violet-600 hover:text-violet-800 font-semibold">View All</Link>}
                        </div>
                        <div className="h-72">{productsByCategory.length > 0 ? <Bar data={categoryChartData} options={horizBarOpts} /> : <div className="h-full flex items-center justify-center text-slate-400"><p className="text-sm">No products yet</p></div>}</div>
                    </div>
                    </Reveal>
                </div>

                {/* ═══════════ BOTTOM: TOP CLIENTS + RECENT ACTIVITY ═══════════ */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Reveal delay={200} direction="left" className="h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div><h3 className="text-lg font-bold text-slate-900">Top Clients</h3><p className="text-sm text-slate-500">By quotation value</p></div>
                            {hasPermission('clients.view') && <Link href={route('clients.index')} className="text-sm text-violet-600 hover:text-violet-800 font-semibold">View All</Link>}
                        </div>
                        {topClients.length > 0 ? (
                            <div className="space-y-2">
                                {topClients.map((client, idx) => (
                                    <Reveal key={client.id} delay={idx * 80} direction="left">
                                    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg ${
                                            idx === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-500/30' :
                                            idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/30' :
                                            idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-600/30' :
                                            'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/30'
                                        } group-hover:scale-110 transition-transform duration-300`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-900 truncate text-sm">{client.name}</p>
                                            <p className="text-xs text-slate-500">{client.quotation_count} quotations</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 text-sm">{fmtCurrency(client.total_value)}</p>
                                            <p className="text-[10px] text-emerald-600 font-semibold">{fmtCurrency(client.accepted_value)} won</p>
                                        </div>
                                    </div>
                                    </Reveal>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400"><span className="text-4xl block mb-3">👥</span><p className="text-sm">No clients yet</p></div>
                        )}
                    </div>
                    </Reveal>

                    <Reveal delay={300} direction="right" className="lg:col-span-2 h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div><h3 className="text-lg font-bold text-slate-900">Recent Activity</h3><p className="text-sm text-slate-500">Latest events</p></div>
                            {hasPermission('activity-logs.view') && <Link href={route('activity-logs.index')} className="text-sm text-violet-600 hover:text-violet-800 font-semibold">View All</Link>}
                        </div>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-1">
                                {recentActivity.slice(0, 8).map((activity, idx) => (
                                    <Reveal key={activity.id} delay={idx * 60} direction="right">
                                    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group">
                                        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                            <span className="text-xs font-bold text-white">{activity.user_name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                                <span className="font-semibold text-slate-900 text-sm">{activity.user_name}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionColors[activity.action.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>{activity.action}</span>
                                                {activity.model_type && <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{activity.model_type}</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{activity.description || `${activity.action} a ${activity.model_type}`}</p>
                                        </div>
                                        <span className="flex-shrink-0 text-[10px] text-slate-400 whitespace-nowrap">{activity.created_at}</span>
                                    </div>
                                    </Reveal>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400"><span className="text-4xl block mb-3">🕐</span><p className="text-sm">No recent activity</p></div>
                        )}
                    </div>
                    </Reveal>
                </div>

                {/* ═══════════ TOP QUOTATIONS TABLE ═══════════ */}
                {topQuotations && topQuotations.length > 0 && (
                    <Reveal delay={200} direction="up">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm card-3d hover:shadow-lg transition-all duration-500 h-full">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Top Quotations</h3>
                        <p className="text-sm text-slate-500 mb-4">Highest value quotations</p>
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-sm">
                                <thead><tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-left font-semibold">#</th>
                                    <th className="px-4 py-3 text-left font-semibold">Client</th>
                                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                                    <th className="px-4 py-3 text-right font-semibold">Value</th>
                                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                                </tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {topQuotations.map((q, idx) => (
                                        <tr key={q.id} className="hover:bg-violet-50/50 transition-colors group" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <td className="px-4 py-3"><Link href={route('quotations.show', q.id)} className="font-bold text-violet-600 hover:text-violet-800">{q.quotation_number}</Link></td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{q.client_name}</td>
                                            <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColors[q.status_key] || 'bg-slate-100 text-slate-600'}`}>{q.status}</span></td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-900">{fmtCurrency(q.grand_total)}</td>
                                            <td className="px-4 py-3 text-slate-500">{q.created_at}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </Reveal>
                )}

            </div>

            {/* ═══════════ ANIMATIONS CSS ═══════════ */}
            <style>{`
                /* Hero animated gradient */
                .hero-gradient {
                    background: linear-gradient(-45deg, #7c3aed, #6d28d9, #4f46e5, #7c3aed, #8b5cf6);
                    background-size: 400% 400%;
                    animation: hero-flow 12s ease infinite;
                }
                @keyframes hero-flow {
                    0%, 100% { background-position: 0% 50%; }
                    25% { background-position: 100% 0%; }
                    50% { background-position: 100% 100%; }
                    75% { background-position: 0% 100%; }
                }

                /* Hero text shimmer */
                .hero-text-shimmer {
                    background-size: 200% auto;
                    animation: text-shimmer 4s linear infinite;
                }
                @keyframes text-shimmer {
                    0% { background-position: 0% center; }
                    100% { background-position: 200% center; }
                }

                /* Glass morphism cards */
                .glass-card {
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                /* Floating orbs */
                .orb-float {
                    animation: orb-bob 6s ease-in-out infinite;
                }
                .orb-float-reverse {
                    animation: orb-bob 8s ease-in-out infinite reverse;
                }
                .orb-pulse {
                    animation: orb-pulse 4s ease-in-out infinite;
                }
                @keyframes orb-bob {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(10px, -15px); }
                    66% { transform: translate(-8px, 10px); }
                }
                @keyframes orb-pulse {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(1.3); }
                }

                /* Blinking cursor */
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
                .animate-blink { animation: blink 1s step-end infinite; }

                /* 3D card tilt on hover */
                .card-3d {
                    transform-style: preserve-3d;
                    perspective: 1000px;
                    transition: transform 0.4s cubic-bezier(.34,1.56,.64,1), box-shadow 0.4s ease;
                }
                .card-3d:hover {
                    transform: translateY(-6px) rotateX(2deg) rotateY(-1deg);
                }

                /* Card icon bounce */
                .card-icon {
                    display: inline-block;
                    transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
                }
                .group:hover .card-icon {
                    transform: scale(1.2) rotate(-8deg);
                }

                /* Hero button glow */
                .hero-btn {
                    position: relative;
                    overflow: hidden;
                }
                .hero-btn::after {
                    content: '';
                    position: absolute;
                    inset: -2px;
                    background: linear-gradient(45deg, transparent, rgba(139,92,246,0.3), transparent);
                    border-radius: inherit;
                    opacity: 0;
                    transition: opacity 0.3s;
                    z-index: -1;
                }
                .hero-btn:hover::after { opacity: 1; }
                .hero-btn:hover { transform: translateY(-2px); box-shadow: 0 20px 40px -8px rgba(139,92,246,0.4); }

                /* Sparkline path draw animation */
                .spark-line {
                    stroke-dasharray: 500;
                    stroke-dashoffset: 500;
                    animation: draw-line 2s ease forwards 0.5s;
                }
                .spark-area {
                    opacity: 0;
                    animation: fade-in 0.8s ease forwards 1.5s;
                }
                @keyframes draw-line {
                    to { stroke-dashoffset: 0; }
                }
                @keyframes fade-in {
                    to { opacity: 1; }
                }

                /* Smooth entrance for animate-in elements */
                .animate-in {
                    animation: slide-up 0.3s ease-out;
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
