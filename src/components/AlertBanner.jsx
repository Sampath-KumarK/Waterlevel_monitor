import React from 'react';
import './AlertBanner.css';

const AlertBanner = ({ status, motorOn }) => {
  if (status !== 'FULL' && !motorOn) return null;

  return (
    <div className={`alert-banner ${motorOn && status !== 'FULL' ? 'alert-motor' : ''}`}>
      <div className="alert-content">
        {status === 'FULL' ? (
          <>
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">
              <strong>ALERT:</strong> Water tank is FULL! Please take action.
            </span>
            <span className="alert-icon">⚠️</span>
          </>
        ) : (
          <>
            <span className="alert-icon">⚙️</span>
            <span className="alert-text">
              <strong>MOTOR RUNNING:</strong> Water is being filled...
            </span>
            <span className="alert-icon">⚙️</span>
          </>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
