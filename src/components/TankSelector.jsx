import React, { useState, useRef, useEffect } from 'react';
import './TankSelector.css';

const TankSelector = ({ tanks, selectedTankId, onSelectTank, onAddTank, onDeleteTank }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [newTank, setNewTank] = useState({ tankId: '', name: '', location: '' });
  const [addError, setAddError] = useState('');
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAdd = async () => {
    if (!newTank.tankId.trim() || !newTank.name.trim()) {
      setAddError('Tank ID and Name are required');
      return;
    }
    try {
      await onAddTank(newTank.tankId.trim(), newTank.name.trim(), newTank.location.trim());
      setNewTank({ tankId: '', name: '', location: '' });
      setShowAddForm(false);
      setAddError('');
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleDelete = (tankId) => {
    if (window.confirm(`Delete this tank and all its data? This cannot be undone.`)) {
      onDeleteTank(tankId);
    }
    setMenuOpenFor(null);
  };

  return (
    <div className="tank-selector">
      <div className="tank-selector-header">
        <h3 className="tank-selector-title">🏗️ Water Tanks</h3>
        <button className="add-tank-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕' : '+ Add Tank'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-tank-form">
          <input
            type="text"
            placeholder="Tank ID (e.g. ESP32-001)"
            value={newTank.tankId}
            onChange={(e) => setNewTank({ ...newTank, tankId: e.target.value })}
            maxLength={50}
          />
          <input
            type="text"
            placeholder="Tank Name"
            value={newTank.name}
            onChange={(e) => setNewTank({ ...newTank, name: e.target.value })}
            maxLength={100}
          />
          <input
            type="text"
            placeholder="Location (optional)"
            value={newTank.location}
            onChange={(e) => setNewTank({ ...newTank, location: e.target.value })}
            maxLength={100}
          />
          {addError && <p className="add-error">{addError}</p>}
          <button className="confirm-add-btn" onClick={handleAdd}>Add Tank</button>
        </div>
      )}

      <div className="tank-list">
        {tanks.length === 0 ? (
          <p className="no-tanks">No tanks added yet. Add one to get started!</p>
        ) : (
          tanks.map((tank) => (
            <div
              key={tank.tankId}
              className={`tank-item ${selectedTankId === tank.tankId ? 'selected' : ''}`}
              onClick={() => onSelectTank(tank.tankId)}
            >
              <div className="tank-item-info">
                <span className="tank-item-name">{tank.name}</span>
                <span className="tank-item-id">{tank.tankId}</span>
                {tank.location && <span className="tank-item-location">📍 {tank.location}</span>}
              </div>

              <div className="tank-item-actions" ref={menuOpenFor === tank.tankId ? menuRef : null}>
                <button
                  className="tank-dots-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenFor(menuOpenFor === tank.tankId ? null : tank.tankId);
                  }}
                >
                  ⋮
                </button>
                {menuOpenFor === tank.tankId && (
                  <div className="tank-dropdown">
                    <button
                      className="tank-dropdown-item delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tank.tankId);
                      }}
                    >
                      🗑️ Delete Tank
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TankSelector;
