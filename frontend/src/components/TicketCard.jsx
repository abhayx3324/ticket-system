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

const STATUS_LABEL = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
};

const CATEGORY_LABEL = { billing: 'Billing', technical: 'Technical', account: 'Account', general: 'General' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

function formatDate(iso) {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function truncate(text, max = 120) {
    return text.length > max ? text.slice(0, max) + '…' : text;
}

// Pencil icon (inline SVG)
const EditIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export default function TicketCard({ ticket, onOpenDetail }) {
    return (
        <article
            className="ticket-card"
            onClick={() => onOpenDetail(ticket)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onOpenDetail(ticket)}
        >
            <header className="ticket-card__header">
                <h3 className="ticket-card__title">{ticket.title}</h3>
                <div className="ticket-card__badges">
                    <span className={`badge ${PRIORITY_BADGE[ticket.priority] || ''}`}>
                        {PRIORITY_LABEL[ticket.priority] || ticket.priority}
                    </span>
                    <span className="badge badge--category">
                        {CATEGORY_LABEL[ticket.category] || ticket.category}
                    </span>
                    <span className={`badge ${STATUS_BADGE[ticket.status] || ''}`}>
                        {STATUS_LABEL[ticket.status] || ticket.status}
                    </span>
                </div>
            </header>

            <p className="ticket-card__desc">{truncate(ticket.description)}</p>

            <footer className="ticket-card__footer">
                <span className="ticket-card__time">{formatDate(ticket.created_at)}</span>
            </footer>

            {/* Edit icon — visible on hover */}
            <button
                className="ticket-card__edit-btn"
                onClick={e => { e.stopPropagation(); onOpenDetail(ticket); }}
                aria-label="View and edit ticket"
            >
                <EditIcon />
            </button>
        </article>
    );
}
