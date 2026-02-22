import { useState } from 'react';
import { createTicket, updateTicket, deleteTicket } from '../services/api';
import Spinner from './Spinner';
import AiClassifyButton from './AiClassifyButton';

const CATEGORY_OPTIONS = ['billing', 'technical', 'account', 'general'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const CATEGORY_LABEL = { billing: 'Billing', technical: 'Technical', account: 'Account', general: 'General' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };
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
const NEXT_STATUS = { open: 'in_progress', in_progress: 'resolved', resolved: 'closed', closed: null };
const NEXT_LABEL = { open: 'Mark In Progress', in_progress: 'Mark Resolved', resolved: 'Mark Closed' };

function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * Unified modal for creating and viewing/editing tickets.
 *
 * Props:
 *   ticket         — null for create mode, ticket object for view/edit mode
 *   initialEditMode — if true (and ticket is set), open directly in edit mode
 *   onClose        — called to close the modal
 *   onSaved        — called with the saved/created ticket object
 */
export default function TicketFormModal({ ticket, initialEditMode = false, onClose, onSaved, onDeleted }) {
    const isNew = !ticket;

    // In create mode we're always editing; in view mode we start in view unless initialEditMode
    const [editing, setEditing] = useState(isNew || initialEditMode);
    const [saving, setSaving] = useState(false);
    const [advancing, setAdvancing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    // Local copy of the ticket (for view mode updates)
    const [local, setLocal] = useState(ticket ? { ...ticket } : null);

    // Draft form values
    const [draft, setDraft] = useState({
        title: ticket?.title || '',
        description: ticket?.description || '',
        category: ticket?.category || '',
        priority: ticket?.priority || '',
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
        if (isNew) {
            onClose();
        } else {
            setEditing(false);
            setError('');
        }
    }

    async function handleSave() {
        if (!draft.title.trim() || !draft.description.trim() || !draft.category || !draft.priority) {
            setError('Please fill in all fields.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            let result;
            if (isNew) {
                result = await createTicket(draft);
            } else {
                result = await updateTicket(local.id, draft);
                setLocal(result);
            }
            setEditing(false);
            onSaved(result);
            if (isNew) onClose();
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`${isNew ? 'Create' : 'Save'} failed: ${detail}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleAdvance() {
        if (!local) return;
        const next = NEXT_STATUS[local.status];
        if (!next || advancing) return;
        setAdvancing(true);
        setError('');
        try {
            const updated = await updateTicket(local.id, { status: next });
            setLocal(updated);
            onSaved(updated);
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`Status update failed: ${detail}`);
        } finally {
            setAdvancing(false);
        }
    }

    function handleAiApply({ category, priority }) {
        setDraft(d => ({
            ...d,
            ...(category ? { category } : {}),
            ...(priority ? { priority } : {}),
        }));
    }

    async function handleDelete() {
        if (!local || deleting) return;
        const confirmed = window.confirm(
            `Are you sure you want to delete "${local.title}"? This action cannot be undone.`
        );
        if (!confirmed) return;
        setDeleting(true);
        setError('');
        try {
            await deleteTicket(local.id);
            onDeleted(local.id);
            onClose();
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`Delete failed: ${detail}`);
        } finally {
            setDeleting(false);
        }
    }

    const nextLabel = local ? NEXT_LABEL[local.status] : null;
    const modalTitle = isNew ? 'New Support Ticket' : (editing ? 'Edit Ticket' : local.title);

    return (
        <div className="modal-overlay" onClick={handleOverlay} role="dialog" aria-modal="true">
            <div className="modal detail-modal">
                {/* Header */}
                <header className="modal__header">
                    <div className="detail-modal__title-row">
                        <h2>{editing ? (isNew ? 'New Support Ticket' : 'Edit Ticket') : local.title}</h2>
                    </div>
                    <button className="modal__close" onClick={onClose} aria-label="Close">&#10005;</button>
                </header>

                {/* Badges (view mode only) */}
                {!isNew && !editing && (
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
                )}

                {/* Body */}
                <div className="detail-modal__body">
                    {editing ? (
                        <>
                            {/* Title field — same layout for both create and edit */}
                            <div className="field">
                                <label>
                                    Title <span className="char-count">({draft.title.length}/200)</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={200}
                                    value={draft.title}
                                    onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                                    placeholder="Brief summary of the issue"
                                    autoFocus
                                />
                            </div>

                            <div className="field">
                                <label>Description</label>
                                <textarea
                                    rows={5}
                                    value={draft.description}
                                    onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                                    placeholder="Describe your issue in detail..."
                                />
                            </div>

                            <AiClassifyButton
                                title={draft.title}
                                description={draft.description}
                                onApply={handleAiApply}
                            />

                            <div className="field-row">
                                <div className="field">
                                    <label>Category</label>
                                    <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}>
                                        <option value="">Select category</option>
                                        {CATEGORY_OPTIONS.map(c => (
                                            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="field">
                                    <label>Priority</label>
                                    <select value={draft.priority} onChange={e => setDraft(d => ({ ...d, priority: e.target.value }))}>
                                        <option value="">Select priority</option>
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
                                {saving
                                    ? <><Spinner size={14} /> {isNew ? 'Creating…' : 'Saving…'}</>
                                    : isNew ? 'Create Ticket' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn--danger" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <><Spinner size={14} /> Deleting…</> : 'Delete'}
                            </button>
                            <div style={{ flex: 1 }} />
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
