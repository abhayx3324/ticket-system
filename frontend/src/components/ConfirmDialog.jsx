/**
 * A styled confirmation dialog overlay.
 *
 * Props:
 *   message    — text to display
 *   onConfirm  — called when user clicks "Delete"
 *   onCancel   — called when user clicks "Cancel" or the overlay
 *   confirming — if true, show a spinner on the confirm button
 */
import Spinner from './Spinner';

export default function ConfirmDialog({ message, onConfirm, onCancel, confirming = false }) {
    return (
        <div className="confirm-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <div className="confirm-dialog">
                <p className="confirm-dialog__message">{message}</p>
                <div className="confirm-dialog__actions">
                    <button className="btn btn--ghost" onClick={onCancel} disabled={confirming}>
                        Cancel
                    </button>
                    <button className="btn btn--danger" onClick={onConfirm} disabled={confirming}>
                        {confirming ? <><Spinner size={14} /> Deleting…</> : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
