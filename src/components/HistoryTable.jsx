import React, { useState } from 'react';
import './HistoryTable.css';

const HistoryTable = ({ history, onDeleteSelected }) => {
  const [selected, setSelected] = useState(new Set());

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventClass = (event) => {
    switch (event) {
      case 'FULL': return 'event-full';
      case 'EMPTY': return 'event-empty';
      case 'MOTOR_ON': return 'event-motor-on';
      case 'MOTOR_OFF': return 'event-motor-off';
      default: return '';
    }
  };

  const getEventIcon = (event) => {
    switch (event) {
      case 'FULL': return '🔴';
      case 'EMPTY': return '⚪';
      case 'MOTOR_ON': return '▶️';
      case 'MOTOR_OFF': return '⏹️';
      default: return '•';
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === history.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(history.map((r) => r._id)));
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected record(s)?`)) return;
    await onDeleteSelected(Array.from(selected));
    setSelected(new Set());
  };

  if (!history || history.length === 0) {
    return (
      <div className="history-container">
        <h2 className="history-title">Event History</h2>
        <div className="no-history">
          <p>No events recorded yet. History will show when tank reaches FULL or EMPTY status.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header-row">
        <h2 className="history-title">Event History</h2>
        {selected.size > 0 && (
          <button className="delete-selected-btn" onClick={handleDelete}>
            🗑️ Delete ({selected.size})
          </button>
        )}
      </div>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th className="check-col">
                <input
                  type="checkbox"
                  checked={selected.size === history.length && history.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>#</th>
              <th>Event</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr
                key={record._id}
                className={`history-row ${selected.has(record._id) ? 'row-selected' : ''}`}
              >
                <td className="check-col">
                  <input
                    type="checkbox"
                    checked={selected.has(record._id)}
                    onChange={() => toggleSelect(record._id)}
                  />
                </td>
                <td>{index + 1}</td>
                <td>
                  <span className={`event-badge ${getEventClass(record.event)}`}>
                    <span className="event-icon">{getEventIcon(record.event)}</span>
                    {record.event.replace('_', ' ')}
                  </span>
                </td>
                <td className="timestamp">{formatDate(record.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="history-footer">
        Showing {history.length} event{history.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default HistoryTable;
