import { useState, useEffect, useCallback } from 'react';
import './App.css';
import WaterGauge from './components/WaterGauge';
import AlertBanner from './components/AlertBanner';
import HistoryTable from './components/HistoryTable';
import MotorControl from './components/MotorControl';
import TankSelector from './components/TankSelector';
import ThemeToggle from './components/ThemeToggle';
import LoginPage from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import {
  getCurrentWaterLevel,
  getHistory,
  getTanks,
  createTank,
  deleteTank,
  getMotorStatus,
  setMotorMode,
  toggleMotor,
  deleteSelectedHistory,
} from './services/api';

function App() {
  const { user, loading: authLoading, logout } = useAuth();

  // Tank state
  const [tanks, setTanks] = useState([]);
  const [selectedTankId, setSelectedTankId] = useState(null);

  // Water level state
  const [waterLevel, setWaterLevel] = useState(0);
  const [status, setStatus] = useState('EMPTY');
  const [lastUpdated, setLastUpdated] = useState(null);

  // Motor state
  const [motor, setMotor] = useState({ mode: 'AUTO', isOn: false });

  // History state
  const [history, setHistory] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aquamonitor-theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('aquamonitor-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // ---- Fetch functions ----

  const fetchTanks = useCallback(async () => {
    try {
      const data = await getTanks();
      setTanks(data.tanks || []);
      return data.tanks || [];
    } catch (err) {
      console.error('Failed to fetch tanks:', err);
      return [];
    }
  }, []);

  const fetchCurrentLevel = useCallback(async (tankId) => {
    if (!tankId) return;
    try {
      const data = await getCurrentWaterLevel(tankId);
      setWaterLevel(data.waterLevel);
      setStatus(data.status);
      setLastUpdated(data.updatedAt ? new Date(data.updatedAt) : null);
      if (data.motor) {
        setMotor(data.motor);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch water level:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (tankId) => {
    if (!tankId) return;
    try {
      const data = await getHistory(50, tankId);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, []);

  const fetchMotor = useCallback(async (tankId) => {
    if (!tankId) return;
    try {
      const data = await getMotorStatus(tankId);
      setMotor({ mode: data.mode, isOn: data.isOn });
    } catch (err) {
      console.error('Failed to fetch motor:', err);
    }
  }, []);

  // ---- Initial load ----

  useEffect(() => {
    const init = async () => {
      const fetchedTanks = await fetchTanks();
      if (fetchedTanks.length > 0) {
        setSelectedTankId(fetchedTanks[0].tankId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, [fetchTanks]);

  // When selectedTankId changes, fetch its data
  useEffect(() => {
    if (!selectedTankId) return;
    setLoading(true);
    fetchCurrentLevel(selectedTankId);
    fetchHistory(selectedTankId);
    fetchMotor(selectedTankId);
  }, [selectedTankId, fetchCurrentLevel, fetchHistory, fetchMotor]);

  // Auto-refresh every 10s
  useEffect(() => {
    if (!selectedTankId) return;
    const interval = setInterval(() => {
      fetchCurrentLevel(selectedTankId);
      fetchHistory(selectedTankId);
      fetchMotor(selectedTankId);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedTankId, fetchCurrentLevel, fetchHistory, fetchMotor]);

  // ---- Handlers ----

  const handleAddTank = async (tankId, name, location) => {
    await createTank(tankId, name, location);
    const fetched = await fetchTanks();
    if (!selectedTankId && fetched.length > 0) {
      setSelectedTankId(fetched[0].tankId);
    }
  };

  const handleDeleteTank = async (tankId) => {
    await deleteTank(tankId);
    const fetched = await fetchTanks();
    if (selectedTankId === tankId) {
      setSelectedTankId(fetched.length > 0 ? fetched[0].tankId : null);
      if (fetched.length === 0) {
        setWaterLevel(0);
        setStatus('EMPTY');
        setHistory([]);
        setMotor({ mode: 'AUTO', isOn: false });
      }
    }
  };

  const handleChangeMode = async (mode) => {
    if (!selectedTankId) return;
    await setMotorMode(selectedTankId, mode);
    fetchMotor(selectedTankId);
  };

  const handleToggleMotor = async (isOn) => {
    if (!selectedTankId) return;
    await toggleMotor(selectedTankId, isOn);
    fetchMotor(selectedTankId);
    fetchHistory(selectedTankId);
  };

  const handleDeleteHistory = async (ids) => {
    await deleteSelectedHistory(ids);
    fetchHistory(selectedTankId);
  };

  if (authLoading) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="app">
      <AlertBanner status={status} motorOn={motor.isOn} />

      <header className="app-header">
        <div className="app-brand">
          <span className="app-logo">💧</span>
          <div>
            <h1 className="app-title">AquaMonitor</h1>
            <p className="app-subtitle">Smart Water Management</p>
          </div>
        </div>
        <div className="header-right">
          <div className="header-status">
            <span className="live-dot"></span>
            Live
          </div>
          <ThemeToggle theme={theme} onToggle={handleToggleTheme} />
          <button className="logout-btn" onClick={logout} title="Sign out">
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <TankSelector
          tanks={tanks}
          selectedTankId={selectedTankId}
          onSelectTank={setSelectedTankId}
          onAddTank={handleAddTank}
          onDeleteTank={handleDeleteTank}
        />

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>⚠️ {error}</p>
            <button onClick={() => fetchCurrentLevel(selectedTankId)} className="retry-button">
              Retry Connection
            </button>
          </div>
        ) : !selectedTankId ? (
          <div className="no-tank-selected">
            <p>Add a water tank above to start monitoring.</p>
          </div>
        ) : (
          <>
            <div className="dashboard-grid">
              <section className="gauge-section">
                <WaterGauge waterLevel={waterLevel} status={status} />
                {lastUpdated && (
                  <div className="last-updated">
                    Updated {lastUpdated.toLocaleString()}
                  </div>
                )}
              </section>

              <section className="gauge-section">
                <MotorControl
                  motor={motor}
                  onToggleMotor={handleToggleMotor}
                  onChangeMode={handleChangeMode}
                />
                <div className="refresh-info">
                  Auto-refreshing every 10s
                </div>
              </section>
            </div>

            <section className="history-section">
              <HistoryTable history={history} onDeleteSelected={handleDeleteHistory} />
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
