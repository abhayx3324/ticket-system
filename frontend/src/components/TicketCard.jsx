import { useState } from 'react';
import { updateTicket } from '../services/api';

const PRIORITY_BADGE = {
    low: 'badge--low',
    medium: 'badge--medium',
    high: 'badge--high',
    critical: 'badge--critical',
};

const STATUS_BADGE = {
    open: 'badge--status-open',
    in_progress: 'badge--status-progress',
    resolved: 'badge--status-resolved',
    closed: 'badge--status-closed',
};

const NEXT_STATUS = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
    closed: null,
};

const STATUS_LABEL = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

const NEXT_LABEL = {
    open: 'Mark In Progress',
    in_progress: 'Mark Resolved',
    resolved: 'Mark Closed',
};

function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function truncate(text, max = 150) {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

export default function TicketCard({ ticket, onStatusChange }) {
    const [expanded, setExpanded] = useState(false);
    const [localStatus, setLocalStatus] = useState(ticket.status);
    const [localDesc, setLocalDesc] = useState(ticket.description);
    const [editingDesc, setEditingDesc] = useState(false);
    const [descDraft, setDescDraft] = useState(ticket.description);
    const [savingDesc, setSavingDesc] = useState(false);
    const [advancing, setAdvancing] = useState(false);

    const nextStatus = NEXT_STATUS[localStatus];
    const nextLabel = NEXT_LABEL[localStatus];

    async function handleAdvance(e) {
        e.stopPropagation();
        if (!nextStatus || advancing) return;
        setAdvancing(true);
        try {
            const updated = await updateTicket(ticket.id, { status: nextStatus });
            setLocalStatus(updated.status);
            onStatusChange(updated);
        } catch {
            // no-op — local state unchanged
        } finally {
            setAdvancing(false);
        }
    }

    async function handleSaveDesc(e) {
        e.stopPropagation();
        setSavingDesc(true);
        try {
            const updated = await updateTicket(ticket.id, { description: descDraft });
            setLocalDesc(updated.description);
            setEditingDesc(false);
        } catch {
            // no-op
        } finally {
            setSavingDesc(false);
        }
    }

    function handleCancelEdit(e) {
        e.stopPropagation();
        setDescDraft(localDesc);
        setEditingDesc(false);
    }

    function startEdit(e) {
        e.stopPropagation();
        setDescDraft(localDesc);
        setEditingDesc(true);
    }

    return (
        <article
            className={`ticket-card ${expanded ? 'ticket-card--expanded' : ''}`}
            onClick={() => !editingDesc && setExpanded(v => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && !editingDesc && setExpanded(v => !v)}
            aria-expanded={expanded}
        >
            <header className="ticket-card__header">
                <h3 className="ticket-card__title">{ticket.title}</h3>
                <div className="ticket-card__badges">
                    <span className={`badge ${PRIORITY_BADGE[ticket.priority] || ''}`}>
                        {capitalize(ticket.priority)}
                    </span>
                    <span className="badge badge--category">{capitalize(ticket.category)}</span>
                    <span className={`badge ${STATUS_BADGE[localStatus] || ''}`}>
                        {STATUS_LABEL[localStatus] || localStatus}
                    </span>
                </div>
            </header>

            {/* Description — view or edit mode */}
            {editingDesc ? (
                <div className="edit-desc" onClick={e => e.stopPropagation()}>
                    <textarea
                        rows={4}
                        value={descDraft}
                        onChange={e => setDescDraft(e.target.value)}
                        autoFocus
                    />
                    <div className="edit-desc__actions">
                        <button className="btn btn--primary btn--sm" onClick={handleSaveDesc} disabled={savingDesc}>
                            {savingDesc ? 'Saving…' : 'Save'}
                        </button>
                        <button className="btn btn--ghost btn--sm" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                </div>
            ) : (
                <p className="ticket-card__desc">
                    {expanded ? localDesc : truncate(localDesc)}
                </p>
            )}

            <footer className="ticket-card__footer">
                <span className="ticket-card__time">{formatDate(ticket.created_at)}</span>

                <div className="ticket-card__actions">
                    {/* Edit description button (only when expanded and not already editing) */}
                    {expanded && !editingDesc && (
                        <button className="btn btn--ghost btn--sm" onClick={startEdit}>
                            Edit Description
                        </button>
                    )}

                    {/* Stage advance */}
                    {nextLabel && (
                        <button
                            className="btn btn--advance"
                            onClick={handleAdvance}
                            disabled={advancing}
                        >
                            {advancing ? '…' : `${nextLabel}`}
                        </button>
                    )}
                    {!nextLabel && (
                        <span className="ticket-card__closed">Closed</span>
                    )}
                </div>
            </footer>
        </article>
    );
}
