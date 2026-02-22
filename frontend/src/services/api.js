const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const err = new Error(`API error ${res.status}`);
        err.data = body;
        err.status = res.status;
        throw err;
    }
    // 204 No Content has no body
    if (res.status === 204) return null;
    return res.json();
}

export function listTickets(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const qs = params.toString();
    return request(`/tickets/${qs ? `?${qs}` : ''}`);
}

export function createTicket(data) {
    return request('/tickets/', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTicket(id, data) {
    return request(`/tickets/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteTicket(id) {
    return request(`/tickets/${id}/`, { method: 'DELETE' });
}

export function classifyTicket(title, description) {
    return request('/tickets/classify/', { method: 'POST', body: JSON.stringify({ title, description }) });
}

export function getStats() {
    return request('/tickets/stats/');
}
