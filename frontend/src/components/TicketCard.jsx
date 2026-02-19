import { useState } from 'react';
import { updateTicket } from '../services/api';

const PRIORITY_BADGE = {
    low: 'badge--low',
    medium: 'badge--medium',
    high: 'badge--high',
    critical: 'badge--critical',
};

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];

function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function truncate(text, max = 150) {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function TicketCard({ ticket, onStatusChange }) {
    const [expanded, setExpanded] = useState(false);
    const [localStatus, setLocalStatus] = useState(ticket.status);
    const [updating, setUpdating] = useState(false);

    async function handleStatusChange(e) {
        const newStatus = e.target.value;
        setUpdating(true);
        try {
            const updated = await updateTicket(ticket.id, { status: newStatus });
            setLocalStatus(updated.status);
            onStatusChange(updated);
        } catch {
            // revert on failure
        } finally {
            setUpdating(false);
        }
    }

    return (
        <article
            className={`ticket-card ${expanded ? 'ticket-card--expanded' : ''}`}
            onClick={() => setExpanded(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
            aria-expanded={expanded}
        >
            <header className="ticket-card__header">
                <h3 className="ticket-card__title">{ticket.title}</h3>
                <div className="ticket-card__badges">
                    <span className={`badge ${PRIORITY_BADGE[ticket.priority] || ''}`}>
                        {ticket.priority}
                    </span>
                    <span className="badge badge--category">{ticket.category}</span>
                </div>
            </header>

            <p className="ticket-card__desc">
                {expanded ? ticket.description : truncate(ticket.description)}
            </p>

            <footer className="ticket-card__footer">
                <span className="ticket-card__time">{formatDate(ticket.created_at)}</span>

                {/* Stop propagation so clicking the select doesn't toggle expand */}
                <div onClick={e => e.stopPropagation()}>
                    <select
                        className="status-select"
                        value={localStatus}
                        onChange={handleStatusChange}
                        disabled={updating}
                        aria-label="Change ticket status"
                    >
                        {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </footer>
        </article>
    );
}
