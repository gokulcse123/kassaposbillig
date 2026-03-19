import React, { useState } from 'react';

export function PurchaseActions({ onSave, onEdit, onDelete, onClear, editMode, header, onHeaderChange }) {
  const [editPurchaseNo, setEditPurchaseNo] = useState('');

  const handleEditPrompt = () => {
    const val = window.prompt('Enter Purchase ID to edit:', '');
    if (val && !isNaN(parseInt(val))) {
      onEdit(parseInt(val));
    }
  };

  return (
    <div className="card">
      <div className="card-header"><span>⚙️</span> Actions</div>
      <div className="card-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Remarks */}
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Remarks</label>
            <input
              className="form-control"
              placeholder="Remarks..."
              value={header.remarks}
              onChange={e => onHeaderChange('remarks', e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          {/* Buttons */}
          <div className="actions-bar" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={onSave}>
              💾 {editMode ? 'Update' : 'Save'}
              <span className="kbd">F1</span>
            </button>
            <button className="btn btn-secondary" onClick={handleEditPrompt}>
              ✏️ Edit
              <span className="kbd">F3</span>
            </button>
            <button
              className="btn btn-danger"
              onClick={onDelete}
              disabled={!editMode}
            >
              🗑 Delete
              <span className="kbd" style={{ background: '#fee2e2', color: 'var(--danger)' }}>F9</span>
            </button>
            <button className="btn btn-secondary" onClick={onClear}>
              🔄 New
              <span className="kbd">ESC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
