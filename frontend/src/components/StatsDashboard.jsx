import { useState, useEffect, useCallback } from 'react';
import { getStats } from '../services/api';

const PRIORITY_COLORS = {
    low: 'var(--color-low)',
    medium: 'var(--color-medium)',
    high: 'var(--color-high)',
    critical: 'var(--color-critical)',
};

const CATEGORY_COLORS = {
    billing: '#7c3aed',
    technical: '#0ea5e9',
    account: '#f59e0b',
    general: '#6b7280',
};

function BreakdownBar({ label, value, total, color }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    return (
        <div className="breakdown-row">
            <span className="breakdown-label">{label}</span>
            <div className="breakdown-bar-track">
                <div
                    className="breakdown-bar-fill"
                    style={{ width: `${pct}%`, background: color }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
            <span className="breakdown-count">{value}</span>
        </div>
    );
}

export default function StatsDashboard({ refreshKey }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStats = useCallback(async (retries = 4) => {
        setLoading(true);
        setError('');
        try {
            const data = await getStats();
            setStats(data);
        } catch {
            if (retries > 0) {
                // Backend may still be starting — retry after a short delay
                await new Promise(r => setTimeout(r, 2000));
                return fetchStats(retries - 1);
            }
            setError('Failed to load stats. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) return <section className="card"><h2>Stats</h2><p className="hint">Loading…</p></section>;
    if (error) return <section className="card"><h2>Stats</h2><p className="msg msg--error">{error}</p></section>;
    if (!stats) return null;

    const { total_tickets, open_tickets, avg_tickets_per_day, priority_breakdown, category_breakdown } = stats;

    return (
        <section className="card stats-card" aria-labelledby="stats-heading">
            <h2 id="stats-heading">Dashboard</h2>

            {/* KPI row */}
            <div className="stats-kpis">
                <div className="kpi">
                    <span className="kpi__value">{total_tickets}</span>
                    <span className="kpi__label">Total Tickets</span>
                </div>
                <div className="kpi">
                    <span className="kpi__value kpi__value--open">{open_tickets}</span>
                    <span className="kpi__label">Open</span>
                </div>
                <div className="kpi">
                    <span className="kpi__value">{avg_tickets_per_day}</span>
                    <span className="kpi__label">Avg / Day</span>
                </div>
            </div>

            <div className="stats-breakdowns">
                {/* Priority breakdown */}
                <div className="breakdown">
                    <h3 className="breakdown__title">Priority</h3>
                    {Object.entries(priority_breakdown).map(([p, count]) => (
                        <BreakdownBar
                            key={p}
                            label={p}
                            value={count}
                            total={total_tickets}
                            color={PRIORITY_COLORS[p]}
                        />
                    ))}
                </div>

                {/* Category breakdown */}
                <div className="breakdown">
                    <h3 className="breakdown__title">Category</h3>
                    {Object.entries(category_breakdown).map(([c, count]) => (
                        <BreakdownBar
                            key={c}
                            label={c}
                            value={count}
                            total={total_tickets}
                            color={CATEGORY_COLORS[c]}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
