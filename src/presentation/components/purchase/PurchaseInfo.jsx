import React from 'react';

export function PurchaseInfo({ header, purchaseTypes, onHeaderChange, editMode }) {
  return (
    <div className="card">
      <div className="card-header">
        <span>📋</span> Purchase Info
        {editMode && (
          <span style={{
            marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
            borderRadius: 4, padding: '2px 8px', fontSize: 11,
          }}>EDIT MODE</span>
        )}
      </div>
      <div className="card-body">
        <div className="form-grid form-grid-4">
          <div className="form-group">
            <label className="form-label">Purchase No.</label>
            <input
              className="form-control"
              value={header.purchaseNo}
              disabled
              readOnly
            />
          </div>
          <div className="form-group">
            <label className="form-label">Purchase Date</label>
            <input
              type="date"
              className="form-control"
              value={header.purchaseDate}
              onChange={e => onHeaderChange('purchaseDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={header.dueDate}
              onChange={e => onHeaderChange('dueDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Purchase Type</label>
            <select
              className="form-select"
              value={header.purchaseType}
              onChange={e => onHeaderChange('purchaseType', e.target.value)}
            >
              {purchaseTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
