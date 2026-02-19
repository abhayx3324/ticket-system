import { useState } from 'react';
import { createTicket, classifyTicket } from '../services/api';
import Spinner from './Spinner';

const CATEGORY_OPTIONS = ['billing', 'technical', 'account', 'general'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

export default function TicketForm({ onTicketCreated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [priority, setPriority] = useState('');
    const [classifying, setClassifying] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    async function handleDescriptionBlur() {
        if (!description.trim()) return;
        setClassifying(true);
        try {
            const result = await classifyTicket(description);
            if (result.suggested_category) setCategory(result.suggested_category);
            if (result.suggested_priority) setPriority(result.suggested_priority);
        } catch {
            // graceful degradation — LLM failure doesn't block the form
        } finally {
            setClassifying(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!title.trim() || !description.trim() || !category || !priority) {
            setError('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        try {
            const ticket = await createTicket({ title, description, category, priority });
            setSuccessMsg(`Ticket #${ticket.id} created successfully!`);
            setTitle('');
            setDescription('');
            setCategory('');
            setPriority('');
            onTicketCreated(ticket);
        } catch (err) {
            const detail = err.data ? JSON.stringify(err.data) : err.message;
            setError(`Failed to create ticket: ${detail}`);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section className="card" aria-labelledby="form-heading">
            <h2 id="form-heading">Submit a Ticket</h2>

            <form onSubmit={handleSubmit} noValidate>
                <div className="field">
                    <label htmlFor="title">
                        Title <span className="char-count">({title.length}/200)</span>
                    </label>
                    <input
                        id="title"
                        type="text"
                        maxLength={200}
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Brief summary of the issue"
                    />
                </div>

                <div className="field">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        required
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        onBlur={handleDescriptionBlur}
                        placeholder="Describe your issue in detail… (leave this field to auto-suggest category & priority)"
                    />
                </div>

                <div className="field-row">
                    <div className="field">
                        <label htmlFor="category">
                            Category
                            {classifying && <Spinner size={14} />}
                        </label>
                        <select
                            id="category"
                            required
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        >
                            <option value="">— select —</option>
                            {CATEGORY_OPTIONS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="field">
                        <label htmlFor="priority">
                            Priority
                            {classifying && <Spinner size={14} />}
                        </label>
                        <select
                            id="priority"
                            required
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                        >
                            <option value="">— select —</option>
                            {PRIORITY_OPTIONS.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {classifying && (
                    <p className="hint"><Spinner size={12} /> Analyzing with AI…</p>
                )}

                {error && <p className="msg msg--error" role="alert">{error}</p>}
                {successMsg && <p className="msg msg--success" role="status">{successMsg}</p>}

                <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={submitting || classifying}
                >
                    {submitting ? <><Spinner size={14} /> Submitting…</> : 'Submit Ticket'}
                </button>
            </form>
        </section>
    );
}
