import { useState, useEffect, useCallback } from 'react';
import { listTickets } from '../services/api';
import TicketCard from './TicketCard';

const CATEGORY_OPTIONS = ['', 'billing', 'technical', 'account', 'general'];
const PRIORITY_OPTIONS = ['', 'low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS = ['', 'open', 'in_progress', 'resolved', 'closed'];

export default function TicketList({ refreshKey }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({
        category: '',
        priority: '',
        status: '',
        search: '',
    });

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await listTickets(filters);
            setTickets(data);
        } catch {
            setError('Failed to load tickets. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, [filters, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    function setFilter(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function handleStatusChange(updated) {
        setTickets(prev => prev.map(t => (t.id === updated.id ? updated : t)));
    }

    return (
        <section className="card" aria-labelledby="list-heading">
            <h2 id="list-heading">All Tickets</h2>

            {/* Filter bar */}
            <div className="filter-bar">
                <input
                    type="search"
                    placeholder="Search title or description…"
                    value={filters.search}
                    onChange={e => setFilter('search', e.target.value)}
                    className="filter-bar__search"
                    aria-label="Search tickets"
                />

                <select
                    value={filters.category}
                    onChange={e => setFilter('category', e.target.value)}
                    aria-label="Filter by category"
                >
                    <option value="">All categories</option>
                    {CATEGORY_OPTIONS.filter(Boolean).map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    value={filters.priority}
                    onChange={e => setFilter('priority', e.target.value)}
                    aria-label="Filter by priority"
                >
                    <option value="">All priorities</option>
                    {PRIORITY_OPTIONS.filter(Boolean).map(p => (
                        <option key={p} value={p}>{p}</option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={e => setFilter('status', e.target.value)}
                    aria-label="Filter by status"
                >
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.filter(Boolean).map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                </select>
            </div>

            {/* Results */}
            {loading && <p className="hint">Loading tickets…</p>}
            {error && <p className="msg msg--error">{error}</p>}
            {!loading && !error && tickets.length === 0 && (
                <p className="hint">No tickets match your filters.</p>
            )}

            <div className="ticket-list">
                {tickets.map(t => (
                    <TicketCard
                        key={t.id}
                        ticket={t}
                        onStatusChange={handleStatusChange}
                    />
                ))}
            </div>
        </section>
    );
}
