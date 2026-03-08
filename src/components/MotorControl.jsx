import React from 'react';
import './MotorControl.css';

const MotorControl = ({ motor, onToggleMotor, onChangeMode, disabled }) => {
  const mode = motor?.mode || 'AUTO';
  const isOn = motor?.isOn || false;

  return (
    <div className="motor-control">
      <h3 className="motor-title">⚙️ Motor Control</h3>

      <div className="motor-mode-switch">
        <button
          className={`mode-btn ${mode === 'AUTO' ? 'active' : ''}`}
          onClick={() => onChangeMode('AUTO')}
          disabled={disabled}
        >
          🤖 Auto
        </button>
        <button
          className={`mode-btn ${mode === 'MANUAL' ? 'active' : ''}`}
          onClick={() => onChangeMode('MANUAL')}
          disabled={disabled}
        >
          🖐️ Manual
        </button>
      </div>

      {mode === 'AUTO' ? (
        <div className="motor-auto-info">
          <div className={`motor-status-indicator ${isOn ? 'on' : 'off'}`}>
            <span className="motor-dot"></span>
            Motor is {isOn ? 'ON' : 'OFF'}
          </div>
          <p className="auto-desc">
            Motor turns <strong>ON</strong> at ≤ 10% and <strong>OFF</strong> at ≥ 95%
          </p>
        </div>
      ) : (
        <div className="motor-manual-controls">
          <div className={`motor-status-indicator ${isOn ? 'on' : 'off'}`}>
            <span className="motor-dot"></span>
            Motor is {isOn ? 'ON' : 'OFF'}
          </div>
          <button
            className={`motor-toggle-btn ${isOn ? 'turn-off' : 'turn-on'}`}
            onClick={() => onToggleMotor(!isOn)}
            disabled={disabled}
          >
            {isOn ? '⏹ Turn OFF' : '▶ Turn ON'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MotorControl;
