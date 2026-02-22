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
          <h1>Support Tickets</h1>
        </div>
        <nav className="tab-bar" role="tablist">
          <button
            role="tab"
            className={`tab ${activeTab === 'dashboard' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            aria-selected={activeTab === 'dashboard'}
          >
            Dashboard
          </button>
          <button
            role="tab"
            className={`tab ${activeTab === 'tickets' ? 'tab--active' : ''}`}
            onClick={() => setActiveTab('tickets')}
            aria-selected={activeTab === 'tickets'}
          >
            Tickets
          </button>
        </nav>
      </header>

      <main className="app-main">
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
