import React from 'react';
import './HistoryTable.css';

const HistoryTable = ({ history }) => {
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
    return event === 'FULL' ? 'event-full' : 'event-empty';
  };

  const getEventIcon = (event) => {
    return event === 'FULL' ? '🔴' : '⚪';
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
      <h2 className="history-title">Event History</h2>
      <div className="history-table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Event</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={record._id} className="history-row">
                <td>{index + 1}</td>
                <td>
                  <span className={`event-badge ${getEventClass(record.event)}`}>
                    <span className="event-icon">{getEventIcon(record.event)}</span>
                    {record.event}
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
