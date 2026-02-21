import React, { useState, useEffect } from 'react';
import { Gauge, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, RefreshCw, ChevronDown, Zap, Fuel, Wrench, Activity, BarChart3 } from 'lucide-react';
import axios from 'axios';

const STATUS_COLORS = {
    good: { bg: 'rgba(34,197,94,0.12)', border: '#22c55e', text: '#4ade80', dot: '#22c55e' },
    warning: { bg: 'rgba(250,204,21,0.12)', border: '#facc15', text: '#fde047', dot: '#facc15' },
    critical: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#f87171', dot: '#ef4444' },
    info: { bg: 'rgba(59,130,246,0.12)', border: '#3b82f6', text: '#60a5fa', dot: '#3b82f6' },
};

const KPI_ICONS = {
    rop: TrendingUp, utilization: Gauge, npt: Clock, cost: BarChart3,
    meters: Activity, fuel: Fuel, health: Wrench, rigs: Zap,
};

/**
 * Mini sparkline chart component — renders a tiny inline SVG line chart.
 */
function Sparkline({ data, color = '#f97316', width = 80, height = 28 }) {
    if (!data || data.length < 2) return <div style={{ width, height }} />;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x},${y}`;
    }).join(' ');

    // Gradient area
    const areaPoints = `0,${height} ${points} ${width},${height}`;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon points={areaPoints} fill={`url(#spark-${color.replace('#', '')})`} />
            <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            {/* Last point dot */}
            {data.length > 0 && (() => {
                const lastX = width;
                const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
                return <circle cx={lastX} cy={lastY} r="2.5" fill={color} />;
            })()}
        </svg>
    );
}

export default function ParameterAdvisor() {
    const [data, setData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [comparison, setComparison] = useState([]);
    const [rigs, setRigs] = useState([]);
    const [selectedRig, setSelectedRig] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastRefresh, setLastRefresh] = useState(null);

    useEffect(() => {
        fetchRigs();
        fetchAll();
    }, []);

    useEffect(() => {
        if (selectedRig !== undefined) fetchAll();
    }, [selectedRig]);

    const fetchRigs = async () => {
        try {
            const res = await axios.get('/api/rigs', { withCredentials: true });
            setRigs(res.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = selectedRig ? { rigId: selectedRig } : {};
            const [paramRes, recRes, compRes] = await Promise.all([
                axios.get('/api/advisor/parameters', { params, withCredentials: true }),
                axios.get('/api/advisor/recommendations', { params, withCredentials: true }),
                axios.get('/api/advisor/comparison', { withCredentials: true }),
            ]);
            setData(paramRes.data);
            setRecommendations(recRes.data.recommendations || []);
            setComparison(compRes.data.comparison || []);
            setLastRefresh(new Date());
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) {
        return (
            <div className="page-enter" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <Gauge size={28} style={{ color: '#f97316' }} />
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9' }}>Parameter Advisor</h1>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="skeleton-shimmer" style={{ height: 120, borderRadius: 12 }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page-enter" style={{ padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Gauge size={22} color="white" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Parameter Advisor</h1>
                        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Real-time drilling KPIs & recommendations</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rig selector */}
                    <div style={{ position: 'relative' }}>
                        <select value={selectedRig} onChange={e => setSelectedRig(e.target.value)} style={{
                            background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8, padding: '8px 32px 8px 12px', fontSize: 13, cursor: 'pointer',
                            appearance: 'none', outline: 'none', minWidth: 140,
                        }}>
                            <option value="">All Rigs</option>
                            {rigs.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
                    </div>
                    <button onClick={fetchAll} style={{
                        background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                        color: '#fb923c', borderRadius: 8, padding: '8px 14px', fontSize: 13,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
                    >
                        <RefreshCw size={14} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Status Bar — inspired by DrillingMetrics Advisor Dashboard */}
            {data && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 1, background: 'rgba(249,115,22,0.15)', borderRadius: 12, overflow: 'hidden', marginBottom: 20,
                    border: '1px solid rgba(249,115,22,0.2)',
                }}>
                    <StatusCell label="Rig" value={data.rigInfo?.name || 'Fleet'} color="#f97316" />
                    <StatusCell label="Last Update" value={data.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : '—'} color="#3b82f6" />
                    <StatusCell label="Depth" value={data.currentDepth ? `${data.currentDepth.toLocaleString()} m` : '—'} color="#22c55e" />
                    <StatusCell label="Formation" value={data.lastFormation} color="#a855f7" />
                    <StatusCell label="Shift" value={data.currentShift} color="#06b6d4" />
                </div>
            )}

            {error && (
                <div style={{ padding: 16, background: 'rgba(239,68,68,0.1)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', marginBottom: 20 }}>
                    ⚠️ {error}
                </div>
            )}

            {/* KPI Grid — DrillingMetrics-style cards with sparklines */}
            {data?.kpis && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: 14, marginBottom: 24,
                }} className="stagger-children">
                    {data.kpis.map((kpi, idx) => {
                        const colors = STATUS_COLORS[kpi.status] || STATUS_COLORS.info;
                        const Icon = KPI_ICONS[kpi.id] || Activity;
                        return (
                            <div key={kpi.id} className="card-enter hover-lift" style={{
                                background: '#111827', borderRadius: 12, padding: 16,
                                border: `1px solid rgba(255,255,255,0.06)`,
                                position: 'relative', overflow: 'hidden',
                                animationDelay: `${idx * 60}ms`,
                            }}>
                                {/* Status indicator line at bottom */}
                                <div style={{
                                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                                    background: `linear-gradient(90deg, ${colors.border}, transparent)`,
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 8,
                                            background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Icon size={14} style={{ color: colors.text }} />
                                        </div>
                                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{kpi.label}</span>
                                    </div>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%', background: colors.dot,
                                        boxShadow: `0 0 8px ${colors.dot}40`,
                                    }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                                            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{kpi.unit}</div>
                                    </div>
                                    {kpi.trend && kpi.trend.length > 1 && (
                                        <Sparkline data={kpi.trend} color={colors.border} width={70} height={24} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Two-column layout: Recommendations + Fleet Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: comparison.length > 0 ? '1fr 1fr' : '1fr', gap: 20 }}>
                {/* Recommendations */}
                <div>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={16} style={{ color: '#f97316' }} />
                        Parameter Recommendations
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {recommendations.map((rec) => {
                            const colors = STATUS_COLORS[rec.severity] || STATUS_COLORS.info;
                            return (
                                <div key={rec.id} className="hover-lift" style={{
                                    background: '#111827', borderRadius: 12, padding: 14,
                                    borderLeft: `3px solid ${colors.border}`,
                                    border: `1px solid rgba(255,255,255,0.06)`,
                                    borderLeftColor: colors.border, borderLeftWidth: 3,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 18 }}>{rec.icon}</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{rec.title}</span>
                                        <span style={{
                                            fontSize: 10, padding: '2px 8px', borderRadius: 10,
                                            background: colors.bg, color: colors.text, fontWeight: 600,
                                            textTransform: 'uppercase', marginLeft: 'auto',
                                        }}>
                                            {rec.severity}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>{rec.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Fleet Comparison */}
                {comparison.length > 0 && (
                    <div>
                        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <BarChart3 size={16} style={{ color: '#f97316' }} />
                            Fleet Comparison (7 days)
                        </h2>
                        <div style={{
                            background: '#111827', borderRadius: 12, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(249,115,22,0.2)' }}>
                                        {['Rig', 'Meters', 'ROP', 'Util.', 'NPT'].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 12px', textAlign: 'left',
                                                fontSize: 11, color: '#f97316', fontWeight: 600, textTransform: 'uppercase',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparison.map((rig, idx) => (
                                        <tr key={rig.rigId} style={{
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            background: idx === 0 ? 'rgba(249,115,22,0.05)' : 'transparent',
                                        }}>
                                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>
                                                {idx === 0 && '🏆 '}{rig.rigName}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#cbd5e1' }}>{rig.totalMeters.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#cbd5e1' }}>{rig.rop} m/hr</td>
                                            <td style={{ padding: '10px 12px', fontSize: 13 }}>
                                                <span style={{ color: rig.utilization > 70 ? '#4ade80' : rig.utilization > 50 ? '#fde047' : '#f87171' }}>
                                                    {rig.utilization}%
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: 13, color: '#cbd5e1' }}>{rig.nptHours}h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {comparison.length === 0 && (
                                <div style={{ padding: 20, textAlign: 'center', color: '#64748b', fontSize: 13 }}>No rig data available</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Last refresh */}
            {lastRefresh && (
                <div style={{ marginTop: 20, textAlign: 'right', fontSize: 11, color: '#475569' }}>
                    Last refreshed: {lastRefresh.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}

function StatusCell({ label, value, color }) {
    return (
        <div style={{
            background: '#111827', padding: '10px 16px', textAlign: 'center',
        }}>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color }}>{value}</div>
        </div>
    );
}
