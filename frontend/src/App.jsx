import { useState } from 'react';
import StatsDashboard from './components/StatsDashboard';
import TicketList from './components/TicketList';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTicketCreated() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <p className="app-header__subtitle">Internal Tool</p>
          <h1>Support Ticket Management System</h1>
        </div>
      </header>

      <main className="app-main">
        <nav className="section-nav" role="tablist">
          <button
            role="tab"
            className={`section-nav__item ${activeTab === 'dashboard' ? 'section-nav__item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            aria-selected={activeTab === 'dashboard'}
          >
            Dashboard
          </button>
          <button
            role="tab"
            className={`section-nav__item ${activeTab === 'tickets' ? 'section-nav__item--active' : ''}`}
            onClick={() => setActiveTab('tickets')}
            aria-selected={activeTab === 'tickets'}
          >
            Tickets
          </button>
        </nav>

        {activeTab === 'dashboard' && (
          <StatsDashboard refreshKey={refreshKey} />
        )}
        {activeTab === 'tickets' && (
          <TicketList refreshKey={refreshKey} onTicketCreated={handleTicketCreated} />
        )}
      </main>
    </div>
  );
}
