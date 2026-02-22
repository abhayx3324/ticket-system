import { useState, useEffect, useCallback } from 'react';
import { listTickets } from '../services/api';
import TicketCard from './TicketCard';
import TicketFormModal from './TicketFormModal';

const CATEGORY_OPTIONS = ['billing', 'technical', 'account', 'general'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
const CATEGORY_LABEL = { billing: 'Billing', technical: 'Technical', account: 'Account', general: 'General' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

export default function TicketList({ refreshKey, onTicketCreated }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state: { ticket, editMode } or null
    const [modal, setModal] = useState(null);

    const [filters, setFilters] = useState({ category: '', priority: '', status: '', search: '' });

    const fetchTickets = useCallback(async (retries = 4) => {
        setLoading(true);
        setError('');
        try {
            const data = await listTickets(filters);
            setTickets(data);
        } catch {
            if (retries > 0) {
                await new Promise(r => setTimeout(r, 2000));
                return fetchTickets(retries - 1);
            }
            setError('Failed to load tickets. Is the backend running?');
        } finally {
            setLoading(false);
        }
    }, [filters, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    function setFilter(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function handleSaved(saved) {
        setTickets(prev => {
            const exists = prev.find(t => t.id === saved.id);
            if (exists) return prev.map(t => (t.id === saved.id ? saved : t));
            return [saved, ...prev];
        });
        // Also update the modal's local ticket reference if still open
        setModal(m => m && m.ticket && m.ticket.id === saved.id ? { ...m, ticket: saved } : m);
        // Notify parent (for dashboard counters etc.)
        onTicketCreated(saved);
    }

    function handleDeleted(id) {
        setTickets(prev => prev.filter(t => t.id !== id));
        setModal(null);
        onTicketCreated(); // refresh dashboard counts
    }

    return (
        <section className="card" aria-labelledby="list-heading">
            <div className="list-header">
                <h2 id="list-heading">All Tickets</h2>
                <button className="btn btn--primary" onClick={() => setModal({ ticket: null, editMode: true })}>
                    + New Ticket
                </button>
            </div>

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
                <select value={filters.category} onChange={e => setFilter('category', e.target.value)} aria-label="Filter by category">
                    <option value="">All categories</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
                <select value={filters.priority} onChange={e => setFilter('priority', e.target.value)} aria-label="Filter by priority">
                    <option value="">All priorities</option>
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilter('status', e.target.value)} aria-label="Filter by status">
                    <option value="">All statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
            </div>

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
                        onOpenDetail={(ticket, editMode) => setModal({ ticket, editMode: !!editMode })}
                    />
                ))}
            </div>

            {/* Unified modal for create AND view/edit */}
            {modal && (
                <TicketFormModal
                    key={modal.ticket?.id || 'new'}
                    ticket={modal.ticket}
                    initialEditMode={modal.editMode}
                    onClose={() => setModal(null)}
                    onSaved={handleSaved}
                    onDeleted={handleDeleted}
                />
            )}
        </section>
    );
}
