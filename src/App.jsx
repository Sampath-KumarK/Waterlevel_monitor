import { useState, useEffect } from 'react';
import './App.css';
import WaterGauge from './components/WaterGauge';
import AlertBanner from './components/AlertBanner';
import HistoryTable from './components/HistoryTable';
import { getCurrentWaterLevel, getHistory } from './services/api';

function App() {
  const [waterLevel, setWaterLevel] = useState(0);
  const [status, setStatus] = useState('EMPTY');
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current water level
  const fetchCurrentLevel = async () => {
    try {
      const data = await getCurrentWaterLevel();
      setWaterLevel(data.waterLevel);
      setStatus(data.status);
      setLastUpdated(new Date(data.updatedAt));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch water level:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const data = await getHistory(50);
      setHistory(data.history);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCurrentLevel();
    fetchHistory();
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentLevel();
      fetchHistory();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <AlertBanner status={status} />
      
      <header className="app-header">
        <h1 className="app-title">💧 Water Level Monitor</h1>
        <p className="app-subtitle">Real-time ESP32 Water Tank Monitoring System</p>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={fetchCurrentLevel} className="retry-button">
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <section className="gauge-section">
              <WaterGauge waterLevel={waterLevel} status={status} />
              {lastUpdated && (
                <div className="last-updated">
                  Last updated: {lastUpdated.toLocaleString()}
                </div>
              )}
              <div className="refresh-info">
                🔄 Auto-refreshing every 10 seconds
              </div>
            </section>

            <section className="history-section">
              <HistoryTable history={history} />
            </section>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 Water Level Monitoring System | ESP32 IoT Project</p>
      </footer>
    </div>
  );
}

export default App;
