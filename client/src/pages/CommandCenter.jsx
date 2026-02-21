import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Fuel, Clock, AlertTriangle, ChevronRight, Drill, Activity, Gauge, BarChart3, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import DrillingEntryModal from '../components/DrillingEntryModal';

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function CommandCenter() {
    const [kpis, setKpis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [advisorData, setAdvisorData] = useState(null);

    const fetchKPIs = async () => {
        try {
            const [kpiRes, advRes] = await Promise.all([
                axios.get('/api/drilling/kpis', { withCredentials: true }),
                axios.get('/api/advisor/parameters', { withCredentials: true }).catch(() => null),
            ]);
            setKpis(kpiRes.data);
            if (advRes) setAdvisorData(advRes.data);
        } catch (err) {
            console.error('Failed to load KPIs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchKPIs(); }, []);

    const handleEntryCreated = () => {
        setShowEntryModal(false);
        fetchKPIs();
    };

    if (loading) {
        return (
            <div style={{ padding: '32px 28px' }}>
                {/* Skeleton header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                    <div>
                        <div className="skeleton-shimmer" style={{ height: 32, width: 300, borderRadius: 8 }} />
                        <div className="skeleton-shimmer" style={{ height: 16, width: 200, borderRadius: 6, marginTop: 8 }} />
                    </div>
                    <div className="skeleton-shimmer" style={{ height: 42, width: 130, borderRadius: 12 }} />
                </div>
                {/* Skeleton KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-shimmer" style={{ height: 140, borderRadius: 16 }} />)}
                </div>
                {/* Skeleton charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="skeleton-shimmer" style={{ height: 360, borderRadius: 16 }} />
                    <div className="skeleton-shimmer" style={{ height: 360, borderRadius: 16 }} />
                </div>
            </div>
        );
    }

    const overview = kpis?.overview || {};
    const rigPerf = kpis?.rigPerformance || [];
    const recent = kpis?.recentEntries || [];
    const trend = advisorData?.dailyTrend || [];

    const kpiCards = [
        {
            label: 'Total Meters Drilled',
            value: overview.totalMeters ? Math.round(overview.totalMeters).toLocaleString() : '0',
            unit: 'meters',
            icon: TrendingUp,
            gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
            glow: 'rgba(249,115,22,0.2)',
            accentColor: '#f97316',
        },
        {
            label: 'Avg Meters / Entry',
            value: overview.avgMetersPerEntry ? Math.round(overview.avgMetersPerEntry).toLocaleString() : '0',
            unit: 'm/entry',
            icon: Gauge,
            gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            glow: 'rgba(59,130,246,0.2)',
            accentColor: '#3b82f6',
        },
        {
            label: 'NPT Hours',
            value: overview.totalNptHours ? Math.round(overview.totalNptHours * 10) / 10 : '0',
            unit: 'hours',
            icon: Clock,
            gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
            glow: 'rgba(239,68,68,0.2)',
            accentColor: '#ef4444',
        },
        {
            label: 'Active Rigs',
            value: overview.activeRigs || '0',
            unit: 'operational',
            icon: Zap,
            gradient: 'linear-gradient(135deg, #10b981, #059669)',
            glow: 'rgba(16,185,129,0.2)',
            accentColor: '#10b981',
        },
    ];

    return (
        <div style={{ padding: '28px 28px 100px 28px', maxWidth: 1400, margin: '0 auto' }}>
            {/* ═══════════════ HERO HEADER ═══════════════ */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 28, flexWrap: 'wrap', gap: 16,
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'linear-gradient(135deg, #f97316, #ea580c)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
                        }}>
                            <Activity size={24} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
                                Rig Command Center
                            </h1>
                            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>
                                Real-time drilling operations overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setShowEntryModal(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 22px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
                        transition: 'all 0.2s',
                    }}
                    className="btn-press hover-lift"
                >
                    <Plus size={16} />
                    New Entry
                </button>
            </div>

            {/* ═══════════════ KPI CARDS ═══════════════ */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16, marginBottom: 24,
            }} className="stagger-children">
                {kpiCards.map((card, i) => (
                    <div key={i} className="card-enter hover-lift" style={{
                        background: '#111827', borderRadius: 16, padding: '20px 22px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        position: 'relative', overflow: 'hidden',
                        animationDelay: `${i * 80}ms`,
                    }}>
                        {/* Accent glow top-right */}
                        <div style={{
                            position: 'absolute', top: -20, right: -20, width: 80, height: 80,
                            borderRadius: '50%', background: card.glow, filter: 'blur(25px)',
                        }} />

                        {/* Bottom accent line */}
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                            background: `linear-gradient(90deg, ${card.accentColor}, transparent)`,
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                            <div>
                                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, marginBottom: 10 }}>
                                    {card.label}
                                </p>
                                <p style={{ fontSize: 34, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, margin: 0 }}>
                                    {card.value}
                                </p>
                                <p style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{card.unit}</p>
                            </div>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: `0 6px 16px ${card.glow}`,
                            }}>
                                <card.icon size={20} color="white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ═══════════════ CHARTS ROW ═══════════════ */}
            <div style={{
                display: 'grid', gridTemplateColumns: trend.length > 1 ? '1fr 1fr' : '1fr',
                gap: 20, marginBottom: 24,
            }}>
                {/* Rig Performance Bar Chart */}
                <div className="card-enter" style={{
                    background: '#111827', borderRadius: 16, padding: '22px 24px',
                    border: '1px solid rgba(255,255,255,0.06)', animationDelay: '200ms',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 30, height: 30, borderRadius: 8,
                                background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <BarChart3 size={14} style={{ color: '#f97316' }} />
                            </div>
                            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Rig Performance</h2>
                        </div>
                        <span style={{ fontSize: 11, color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 20 }}>
                            Total Meters
                        </span>
                    </div>
                    {rigPerf.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={rigPerf} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="rigName" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9', fontSize: 13 }}
                                    formatter={(val) => [`${Math.round(val).toLocaleString()} m`, 'Meters']}
                                    cursor={{ fill: 'rgba(249,115,22,0.06)' }}
                                />
                                <Bar dataKey="totalMeters" fill="url(#orangeGrad)" radius={[8, 8, 0, 0]} />
                                <defs>
                                    <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f97316" />
                                        <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14 }}>
                            <div style={{ textAlign: 'center' }}>
                                <Drill size={40} style={{ color: '#334155', marginBottom: 12 }} />
                                <p>No data yet. Create your first drilling entry!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Drilling Trend Area Chart (if trend data available) */}
                {trend.length > 1 && (
                    <div className="card-enter" style={{
                        background: '#111827', borderRadius: 16, padding: '22px 24px',
                        border: '1px solid rgba(255,255,255,0.06)', animationDelay: '280ms',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <TrendingUp size={14} style={{ color: '#3b82f6' }} />
                                </div>
                                <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Drilling Trend</h2>
                            </div>
                            <span style={{ fontSize: 11, color: '#475569', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: 20 }}>
                                7-Day
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, color: '#f1f5f9', fontSize: 13 }}
                                    formatter={(val) => [`${Math.round(val).toLocaleString()} m`, 'Meters']}
                                    labelFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                                />
                                <defs>
                                    <linearGradient id="blueAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="meters" stroke="#3b82f6" strokeWidth={2.5} fill="url(#blueAreaGrad)" dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5, fill: '#3b82f6' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* ═══════════════ RECENT ENTRIES ═══════════════ */}
            <div className="card-enter" style={{
                background: '#111827', borderRadius: 16, padding: '22px 24px',
                border: '1px solid rgba(255,255,255,0.06)', animationDelay: '360ms',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Drill size={14} style={{ color: '#f97316' }} />
                        </div>
                        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Recent Entries</h2>
                    </div>
                    <span style={{ fontSize: 11, color: '#475569' }}>
                        {recent.length} entries
                    </span>
                </div>

                {recent.length > 0 ? (
                    <div style={{ display: 'grid', gap: 8 }}>
                        {recent.map((entry, idx) => (
                            <div key={entry.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 16px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                transition: 'all 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.15)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                        background: 'rgba(249,115,22,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Drill size={15} style={{ color: '#f97316' }} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {entry.rig?.name || 'Unknown Rig'}
                                        </p>
                                        <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {entry.project?.name || '—'} · {entry.shift}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                                    <p style={{ fontSize: 15, fontWeight: 700, color: '#f97316', margin: 0 }}>
                                        {Math.round(entry.metersDrilled).toLocaleString()} m
                                    </p>
                                    <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0' }}>
                                        {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
                        <Drill size={40} style={{ color: '#334155', marginBottom: 12, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 14 }}>No entries yet. Click "New Entry" to get started!</p>
                    </div>
                )}
            </div>

            {/* Entry Modal */}
            {showEntryModal && (
                <DrillingEntryModal
                    onClose={() => setShowEntryModal(false)}
                    onSuccess={handleEntryCreated}
                />
            )}
        </div>
    );
}
