import React from 'react';

export function InvoiceInfo({ header, onHeaderChange }) {
  return (
    <div className="card">
      <div className="card-header"><span>🧾</span> Invoice Info</div>
      <div className="card-body">
        <div className="form-grid form-grid-3">
          <div className="form-group">
            <label className="form-label">Invoice No.</label>
            <input
              className="form-control"
              placeholder="Supplier invoice no"
              value={header.invoiceNo}
              onChange={e => onHeaderChange('invoiceNo', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Date</label>
            <input
              type="date"
              className="form-control"
              value={header.invoiceDate}
              onChange={e => onHeaderChange('invoiceDate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Invoice Amount</label>
            <input
              className="form-control text-right"
              placeholder="0.00"
              value={header.invoiceAmt}
              onChange={e => onHeaderChange('invoiceAmt', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
