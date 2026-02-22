import { useState } from 'react';
import { createTicket } from '../services/api';
import Spinner from './Spinner';
import AiClassifyButton from './AiClassifyButton';

const CATEGORY_OPTIONS = ['billing', 'technical', 'account', 'general'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

const CATEGORY_LABEL = { billing: 'Billing', technical: 'Technical', account: 'Account', general: 'General' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

export default function CreateTicketModal({ onClose, onTicketCreated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Close on Escape
    useState(() => {
        function onKey(e) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    });

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        if (!title.trim() || !description.trim() || !category || !priority) {
            setError('Please fill in all fields.');
            return;
        }
        setSubmitting(true);
        try {
            const ticket = await createTicket({ title, description, category, priority });
            onTicketCreated(ticket);
            onClose();
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`Failed to create ticket: ${detail}`);
        } finally {
            setSubmitting(false);
        }
    }

    function handleOverlayClick(e) {
        if (e.target === e.currentTarget) onClose();
    }

    function handleAiApply({ category: cat, priority: pri }) {
        if (cat) setCategory(cat);
        if (pri) setPriority(pri);
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal">
                <header className="modal__header">
                    <h2 id="modal-title">New Support Ticket</h2>
                    <button className="modal__close" onClick={onClose} aria-label="Close">&#10005;</button>
                </header>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="field">
                        <label htmlFor="m-title">
                            Title <span className="char-count">({title.length}/200)</span>
                        </label>
                        <input
                            id="m-title"
                            type="text"
                            maxLength={200}
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Brief summary of the issue"
                            autoFocus
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="m-desc">Description</label>
                        <textarea
                            id="m-desc"
                            required
                            rows={4}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe your issue in detail..."
                        />
                    </div>

                    {/* Shared AI classify component */}
                    <AiClassifyButton
                        title={title}
                        description={description}
                        onApply={handleAiApply}
                    />

                    <div className="field-row">
                        <div className="field">
                            <label htmlFor="m-cat">Category</label>
                            <select id="m-cat" required value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="">Select category</option>
                                {CATEGORY_OPTIONS.map(c => (
                                    <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="m-pri">Priority</label>
                            <select id="m-pri" required value={priority} onChange={e => setPriority(e.target.value)}>
                                <option value="">Select priority</option>
                                {PRIORITY_OPTIONS.map(p => (
                                    <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && <p className="msg msg--error" role="alert">{error}</p>}

                    <div className="modal__actions">
                        <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn--primary" disabled={submitting}>
                            {submitting ? <><Spinner size={14} /> Submitting…</> : 'Submit Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
