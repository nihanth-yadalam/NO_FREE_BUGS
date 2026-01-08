import React, { useState } from 'react';
import {
    QueryClient,
    QueryClientProvider,
    useQuery
} from '@tanstack/react-query';
import axios from 'axios';
import {
    TrendingUp,
    ShieldCheck,
    Wallet,
    AlertCircle,
    ArrowUpRight,
    Info
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

const queryClient = new QueryClient();

// Configuration
const API_BASE = "http://localhost:8080"; // Your VaultGuard Backend

const Dashboard = () => {
    const [userId, setUserId] = useState("04032006");

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['analyze', userId],
        queryFn: async () => {
            const res = await axios.get(`${API_BASE}/analyze/${userId}`);
            return res.data;
        },
        refetchOnWindowFocus: false
    });

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="animate-pulse text-xl font-bold">Scanning Predictive Liquidity...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        VaultGuard 🛡️
        </h1>
        <p className="text-slate-500 text-sm">Predictive Income Smoothing</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
        <span className="text-xs font-mono text-slate-400 uppercase">User: {userId}</span>
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        </header>

        {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
            <AlertCircle size={20} />
            <p>Bank Connection Error: {error.message}</p>
            </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actual Balance */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
        <Wallet size={20} />
        </div>
        </div>
        <p className="text-slate-400 text-sm font-medium">Actual Bank Balance</p>
        <h2 className="text-3xl font-bold mt-1">
        ${data?.currentBalance?.toLocaleString() || "0.00"}
        </h2>
        </div>

        {/* Safe Withdrawable Amount (SWA) */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
        <p className="text-blue-100 text-sm font-medium opacity-80">Safe Withdrawable Amount</p>
        <h2 className="text-4xl font-bold mt-1 text-white">
        ${data?.safe_withdrawable_amount?.toLocaleString() || "0"}
        </h2>
        <button className="mt-4 w-full bg-white text-blue-600 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
        Access Instant Liquidity
        </button>
        </div>
        <ShieldCheck size={80} className="absolute -right-4 -bottom-4 text-white/10" />
        </div>

        {/* AI Insight */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
        <TrendingUp size={20} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 px-2 py-1 bg-emerald-500/10 rounded">
        ML Confidence: 92%
        </span>
        </div>
        <p className="text-slate-400 text-sm font-medium">Predicted Inflow (14d)</p>
        <h2 className="text-3xl font-bold mt-1 text-emerald-400">
        +${data?.predicted_income_next_14d?.toLocaleString() || "0"}
        </h2>
        </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Prediction Visualization */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-8">
        <h3 className="font-bold text-lg">Predictive Cashflow Model</h3>
        <div className="flex gap-4 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Fixed Expenses</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> AI Projected Income</div>
        </div>
        </div>

        <div className="h-64 w-full">
        {/* Mocking a chart view of the predicted window */}
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[
            { day: 'Mon', val: 0 }, { day: 'Tue', val: 200 }, { day: 'Wed', val: 0 },
            { day: 'Thu', val: 0 }, { day: 'Fri', val: 800 }, { day: 'Sat', val: 0 },
            { day: 'Sun', val: 0 }
        ]}>
        <defs>
        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
        </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="day" stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
        <Tooltip
        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
        itemStyle={{ color: '#10b981' }}
        />
        <Area type="monotone" dataKey="val" stroke="#10b981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
        </AreaChart>
        </ResponsiveContainer>
        </div>
        </div>

        {/* Bills Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
        Upcoming Liabilities
        <Info size={14} className="text-slate-500" />
        </h3>
        <div className="space-y-4">
        <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
        <span className="text-slate-400 text-sm">Fixed Bills (P1)</span>
        <span className="font-bold text-rose-400">-${data?.upcoming_bills_total || "0"}</span>
        </div>
        <div className="flex justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
        <span className="text-slate-400 text-sm">Variable Reserve</span>
        <span className="font-bold text-amber-400">-$400.00</span>
        </div>
        <div className="pt-4 border-t border-slate-800">
        <p className="text-[10px] text-slate-500 leading-relaxed italic">
        * VaultGuard has reserved these funds from your predictive limit to ensure your bills are covered.
        </p>
        </div>
        </div>
        </div>
        </div>

        </div>
        </div>
    );
};

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
        <Dashboard />
        </QueryClientProvider>
    );
}
