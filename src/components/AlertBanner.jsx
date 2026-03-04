import React from 'react';
import './AlertBanner.css';

const AlertBanner = ({ status }) => {
  if (status !== 'FULL') return null;

  return (
    <div className="alert-banner">
      <div className="alert-content">
        <span className="alert-icon">⚠️</span>
        <span className="alert-text">
          <strong>ALERT:</strong> Water tank is FULL! Please take action.
        </span>
        <span className="alert-icon">⚠️</span>
      </div>
    </div>
  );
};

export default AlertBanner;
