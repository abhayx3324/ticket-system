import { useState } from 'react';
import { classifyTicket } from '../services/api';
import Spinner from './Spinner';

const CATEGORY_LABEL = { billing: 'Billing', technical: 'Technical', account: 'Account', general: 'General' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

/**
 * Reusable AI classification button + callout.
 *
 * Props:
 *   title       — current ticket title (string)
 *   description — current ticket description (string)
 *   onApply     — called with { category, priority } when user accepts suggestion
 */
export default function AiClassifyButton({ title, description, onApply }) {
    const [classifying, setClassifying] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const [error, setError] = useState('');

    async function handleClassify() {
        if (!description || description.trim().length < 10) return;
        setClassifying(true);
        setSuggestion(null);
        setError('');
        try {
            const result = await classifyTicket(title || '', description);
            if (result.suggested_category || result.suggested_priority) {
                setSuggestion(result);
                // Auto-apply on first classify
                onApply({
                    category: result.suggested_category,
                    priority: result.suggested_priority,
                });
            } else {
                setError('AI returned no suggestion. Try a more detailed description.');
            }
        } catch (err) {
            if (err.status === 503) {
                setError('AI classification unavailable — LLM_API_KEY is not configured.');
            } else {
                setError('Classification failed. You can still set category and priority manually.');
            }
        } finally {
            setClassifying(false);
        }
    }

    function handleReapply() {
        if (suggestion) {
            onApply({
                category: suggestion.suggested_category,
                priority: suggestion.suggested_priority,
            });
        }
    }

    const canClassify = description && description.trim().length > 10 && !classifying;

    return (
        <>
            <div className="classify-row">
                <button
                    type="button"
                    className="btn btn--classify"
                    onClick={handleClassify}
                    disabled={!canClassify}
                >
                    {classifying
                        ? <><Spinner size={13} /> Analysing…</>
                        : 'Analyse with AI'}
                </button>
                <span className="classify-row__hint">
                    Auto-fills category and priority using AI
                </span>
            </div>

            {error && !classifying && (
                <p className="msg msg--error" role="alert">{error}</p>
            )}

            {suggestion && !classifying && (
                <div className="ai-callout">
                    <span className="ai-callout__label">AI Suggested</span>
                    <div className="ai-callout__body">
                        <p className="ai-callout__detail">
                            Category: <strong>{CATEGORY_LABEL[suggestion.suggested_category] || suggestion.suggested_category}</strong>
                            &nbsp;&middot;&nbsp;
                            Priority: <strong>{PRIORITY_LABEL[suggestion.suggested_priority] || suggestion.suggested_priority}</strong>
                        </p>
                    </div>
                    <button
                        type="button"
                        className="ai-callout__accept"
                        onClick={handleReapply}
                    >
                        Re-apply
                    </button>
                </div>
            )}
        </>
    );
}
