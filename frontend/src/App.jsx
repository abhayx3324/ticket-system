import { useState } from 'react';
import StatsDashboard from './components/StatsDashboard';
import TicketForm from './components/TicketForm';
import TicketList from './components/TicketList';

export default function App() {
  // Incrementing this triggers both TicketList and StatsDashboard to re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  function handleTicketCreated() {
    setRefreshKey(k => k + 1);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Support Tickets</h1>
        <p className="app-header__sub">Submit, track, and manage customer support tickets</p>
      </header>

      <main className="app-main">
        <StatsDashboard refreshKey={refreshKey} />
        <TicketForm onTicketCreated={handleTicketCreated} />
        <TicketList refreshKey={refreshKey} />
      </main>
    </div>
  );
}
