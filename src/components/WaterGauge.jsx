import React from 'react';
import './WaterGauge.css';

const WaterGauge = ({ waterLevel, status }) => {
  const safeLevel = Math.max(0, Math.min(100, waterLevel));

  const getStatusColor = () => {
    switch (status) {
      case 'EMPTY': return '#e74c3c';
      case 'LOW': return '#f39c12';
      case 'MEDIUM': return '#3498db';
      case 'HIGH': return '#2ecc71';
      case 'FULL': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const strokeColor = getStatusColor();

  return (
    <div className="water-gauge-container">
      <div className="tank-card">
        <div className="tank-header">
          <h2 className="tank-title">Tank Status</h2>
          <span className="tank-badge" style={{ color: strokeColor, borderColor: strokeColor }}>
            {status}
          </span>
        </div>

        <div className="tank-visual-wrap">
          <div className="tank-ruler">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>

          <div className="tank-shell" aria-label={`Water level is ${safeLevel}%`}>
            <div
              className="tank-water"
              style={{
                height: `${safeLevel}%`,
                background: `linear-gradient(180deg, ${strokeColor}CC 0%, ${strokeColor} 100%)`
              }}
            >
              <div className="wave wave-one"></div>
              <div className="wave wave-two"></div>
              <span className="bubble b1"></span>
              <span className="bubble b2"></span>
              <span className="bubble b3"></span>
            </div>
            <div className="tank-glass-shine"></div>
          </div>
        </div>

        <div className="tank-footer">
          <div className="level-value" style={{ color: strokeColor }}>
            {safeLevel}%
          </div>
          <p className="level-text">Current water level</p>
        </div>
      </div>
    </div>
  );
};

export default WaterGauge;
