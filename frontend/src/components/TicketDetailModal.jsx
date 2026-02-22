import { useState } from 'react';
import { updateTicket } from '../services/api';
import Spinner from './Spinner';
import AiClassifyButton from './AiClassifyButton';

const CATEGORY_OPTIONS = ['billing', 'technical', 'account', 'general'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const CATEGORY_LABEL = { billing: 'Billing', technical: 'Technical', account: 'Account', general: 'General' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const STATUS_LABEL = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};
const STATUS_BADGE = {
    open: 'badge--status-open',
    in_progress: 'badge--status-progress',
    resolved: 'badge--status-resolved',
    closed: 'badge--status-closed',
};
const PRIORITY_BADGE = {
    low: 'badge--low',
    medium: 'badge--medium',
    high: 'badge--high',
    critical: 'badge--critical',
};
const NEXT_STATUS = {
    open: 'in_progress',
    in_progress: 'resolved',
    resolved: 'closed',
    closed: null,
};
const NEXT_LABEL = {
    open: 'Mark In Progress',
    in_progress: 'Mark Resolved',
    resolved: 'Mark Closed',
};

function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TicketDetailModal({ ticket, onClose, onTicketUpdated, initialEditMode = false }) {
    const [editing, setEditing] = useState(initialEditMode);
    const [saving, setSaving] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [error, setError] = useState('');

    // Local ticket state (for optimistic UI)
    const [local, setLocal] = useState({ ...ticket });

    // Draft form state (only used when editing)
    const [draft, setDraft] = useState({
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
    });

    function handleOverlay(e) {
        if (e.target === e.currentTarget) onClose();
    }

    function startEdit() {
        setDraft({
            title: local.title,
            description: local.description,
            category: local.category,
            priority: local.priority,
        });
        setEditing(true);
        setError('');
    }

    function cancelEdit() {
        setEditing(false);
        setError('');
    }

    async function handleSave() {
        if (!draft.title.trim() || !draft.description.trim()) {
            setError('Title and description are required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const updated = await updateTicket(local.id, draft);
            setLocal(updated);
            setEditing(false);
            onTicketUpdated(updated);
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`Save failed: ${detail}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleAdvance() {
        const next = NEXT_STATUS[local.status];
        if (!next || advancing) return;
        setAdvancing(true);
        setError('');
        try {
            const updated = await updateTicket(local.id, { status: next });
            setLocal(updated);
            onTicketUpdated(updated);
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`Status update failed: ${detail}`);
        } finally {
            setAdvancing(false);
        }
    }

    const nextLabel = NEXT_LABEL[local.status];

    return (
        <div className="modal-overlay" onClick={handleOverlay} role="dialog" aria-modal="true">
            <div className="modal detail-modal">
                {/* Header */}
                <header className="modal__header">
                    <div className="detail-modal__title-row">
                        {editing ? (
                            <input
                                type="text"
                                className="detail-modal__title-input"
                                value={draft.title}
                                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                                maxLength={200}
                                autoFocus
                            />
                        ) : (
                            <h2>{local.title}</h2>
                        )}
                    </div>
                    <button className="modal__close" onClick={onClose} aria-label="Close">&#10005;</button>
                </header>

                {/* Badges row */}
                <div className="detail-modal__badges">
                    <span className={`badge ${PRIORITY_BADGE[local.priority] || ''}`}>
                        {PRIORITY_LABEL[local.priority] || local.priority}
                    </span>
                    <span className="badge badge--category">
                        {CATEGORY_LABEL[local.category] || local.category}
                    </span>
                    <span className={`badge ${STATUS_BADGE[local.status] || ''}`}>
                        {STATUS_LABEL[local.status] || local.status}
                    </span>
                </div>

                {/* Body */}
                <div className="detail-modal__body">
                    {editing ? (
                        <>
                            <div className="field">
                                <label>Description</label>
                                <textarea
                                    rows={5}
                                    value={draft.description}
                                    onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                                />
                            </div>
                            <AiClassifyButton
                                title={draft.title}
                                description={draft.description}
                                onApply={({ category, priority }) => {
                                    setDraft(d => ({
                                        ...d,
                                        ...(category ? { category } : {}),
                                        ...(priority ? { priority } : {}),
                                    }));
                                }}
                            />
                            <div className="field-row">
                                <div className="field">
                                    <label>Category</label>
                                    <select
                                        value={draft.category}
                                        onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                                    >
                                        {CATEGORY_OPTIONS.map(c => (
                                            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Priority</label>
                                    <select
                                        value={draft.priority}
                                        onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}
                                    >
                                        {PRIORITY_OPTIONS.map(p => (
                                            <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="detail-modal__desc">{local.description}</p>
                            <div className="detail-modal__meta">
                                <span>Created: {formatDate(local.created_at)}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Error */}
                {error && <p className="msg msg--error" role="alert">{error}</p>}

                {/* Footer actions */}
                <div className="detail-modal__actions">
                    {editing ? (
                        <>
                            <button className="btn btn--ghost" onClick={cancelEdit}>Cancel</button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                                {saving ? <><Spinner size={14} /> Saving…</> : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn--ghost" onClick={startEdit}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                Edit
                            </button>
                            {nextLabel && (
                                <button className="btn btn--primary" onClick={handleAdvance} disabled={advancing}>
                                    {advancing ? <><Spinner size={14} /> Updating…</> : nextLabel}
                                </button>
                            )}
                            {!nextLabel && (
                                <span className="detail-modal__closed-label">Closed</span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
