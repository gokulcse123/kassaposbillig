import React from 'react';
import { fmtINR } from '../../../shared/helpers/index.js';

export function SupplierInfo({ header, suppliers, onSupplierSelect, onHeaderChange }) {
  const isNeg = header.supplierBalance < 0;
  const isPos = header.supplierBalance > 0;

  return (
    <div className="card">
      <div className="card-header"><span>🏭</span> Supplier Info</div>
      <div className="card-body">
        <div className="form-grid form-grid-2">
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Supplier Name</label>
            <select
              className="form-select"
              style={{ height: 30 }}
              value={header.supplierId || ''}
              onChange={e => onSupplierSelect(e.target.value)}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {header.supplierId > 0 && (
          <div className="supplier-info-row">
            <div className="sup-badge">
              <span>📍</span>
              <span className="val">{header.supplierCity || header.supplierAddress || '—'}</span>
            </div>
            <div className="sup-badge">
              <span>📞</span>
              <span className="val">{header.supplierContact || '—'}</span>
            </div>
            <div className="sup-badge">
              <span>💰 Balance:</span>
              <span className={`val ${isNeg ? 'balance-neg' : isPos ? 'balance-pos' : ''}`}>
                {isNeg ? '-' : ''}₹{fmtINR(Math.abs(header.supplierBalance))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
