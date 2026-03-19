import React, { useState, useRef, useEffect, useCallback } from 'react';
import { fmt2 } from '../../../shared/helpers/index.js';

const EDITABLE_COLS = [
  { key: 'productName',    label: 'Description',  width: 180, align: 'left',   type: 'search' },
  { key: 'hsnCode',        label: 'HSN',           width: 70,  align: 'left',   type: 'text' },
  { key: 'uom',            label: 'UOM',           width: 55,  align: 'center', type: 'text', readOnly: true },
  { key: 'mrp',            label: 'MRP',           width: 75,  align: 'right',  type: 'number' },
  { key: 'purchaseRate',   label: 'Pur.Rate',      width: 85,  align: 'right',  type: 'number' },
  { key: 'itemQty',        label: 'Qty',           width: 70,  align: 'right',  type: 'number' },
  { key: 'freeQty',        label: 'Free',          width: 60,  align: 'right',  type: 'number' },
  { key: 'cdPercent',      label: 'CD%',           width: 60,  align: 'right',  type: 'number' },
  { key: 'cdAmount',       label: 'CD Amt',        width: 72,  align: 'right',  type: 'number', readOnly: true },
  { key: 'discountPercent',label: 'Disc%',         width: 60,  align: 'right',  type: 'number' },
  { key: 'discountAmt',    label: 'Disc Amt',      width: 72,  align: 'right',  type: 'number', readOnly: true },
  { key: 'taxPercent',     label: 'GST%',          width: 60,  align: 'right',  type: 'number' },
  { key: 'taxAmt',         label: 'GST Amt',       width: 72,  align: 'right',  type: 'number', readOnly: true },
  { key: 'saleRate',       label: 'Sale Rate',     width: 80,  align: 'right',  type: 'number' },
  { key: 'amount',         label: 'Amount',        width: 90,  align: 'right',  type: 'number', readOnly: true },
];

function CellInput({ col, item, onItemChange, onProductSearch, onProductSelect, productSuggestions, productQuery }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const value = col.key === 'productName' && !focused ? item.productName : item[col.key];

  const handleBlur = () => {
    setFocused(false);
    if (col.key === 'productName') onProductSearch('');
  };

  if (col.type === 'search') {
    return (
      <div className="autocomplete-wrapper">
        <input
          ref={inputRef}
          className={`grid-input text-left`}
          value={focused ? productQuery : item.productName}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(handleBlur, 150)}
          onChange={e => {
            onProductSearch(e.target.value);
          }}
          placeholder="Type to search..."
          autoComplete="off"
        />
        {focused && productSuggestions.length > 0 && (
          <div className="autocomplete-dropdown">
            {productSuggestions.map(p => (
              <div
                key={p.id}
                className="autocomplete-item"
                onMouseDown={() => onProductSelect(p, item.rowId)}
              >
                <span>{p.name}</span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <span className="code">{p.code}</span>
                  <span className="rate">₹{fmt2(p.purchaseRate)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (col.readOnly) {
    return (
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {fmt2(item[col.key])}
      </span>
    );
  }

  return (
    <input
      className="grid-input"
      type={col.type === 'number' ? 'number' : 'text'}
      value={item[col.key] ?? ''}
      onChange={e => onItemChange(item.rowId, col.key, col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
      onFocus={e => e.target.select()}
      min={0}
    />
  );
}

export function ProductGrid({
  items, addEmptyRow, removeItem,
  onItemChange, onProductSearch, onProductSelect,
  productSuggestions, productQuery,
  taxMode, onTaxModeChange, onIgstToggle, header,
  totalItemQty,
}) {
  return (
    <div className="card">
      <div className="card-header">
        <span>📦</span> Products
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Tax Mode */}
          <div className="tax-mode-group">
            <label className="radio-btn" style={{ color: taxMode === 'exclusive' ? 'white' : 'rgba(255,255,255,0.6)' }}>
              <input
                type="radio"
                name="taxMode"
                value="exclusive"
                checked={taxMode === 'exclusive'}
                onChange={() => onTaxModeChange('exclusive')}
              />
              Exclusive
            </label>
            <label className="radio-btn" style={{ color: taxMode === 'inclusive' ? 'white' : 'rgba(255,255,255,0.6)' }}>
              <input
                type="radio"
                name="taxMode"
                value="inclusive"
                checked={taxMode === 'inclusive'}
                onChange={() => onTaxModeChange('inclusive')}
              />
              Inclusive
            </label>
          </div>
          {/* IGST */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontSize: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={header.igst}
              onChange={e => onIgstToggle(e.target.checked)}
              style={{ accentColor: 'white' }}
            />
            IGST
          </label>
          {/* Item qty */}
          <span className="item-qty-badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
            Total Qty: {fmt2(totalItemQty)}
          </span>
        </div>
      </div>
      <div className="card-body" style={{ padding: '8px' }}>
        <div className="grid-wrapper">
          <table className="purchase-grid">
            <thead>
              <tr>
                <th style={{ width: 42 }}>S.No</th>
                {EDITABLE_COLS.map(c => (
                  <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.label}</th>
                ))}
                <th style={{ width: 36 }}>Del</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={EDITABLE_COLS.length + 2} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    No items. Click "Add Row" below to start.
                  </td>
                </tr>
              )}
              {items.map((item, idx) => (
                <tr key={item.rowId} className={item.editMode ? 'edited-row' : ''}>
                  <td className="text-center" style={{ color: 'var(--text-muted)', fontSize: 11 }}>{idx + 1}</td>
                  {EDITABLE_COLS.map(col => (
                    <td
                      key={col.key}
                      className={col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}
                      style={{ padding: '2px 4px' }}
                    >
                      <CellInput
                        col={col}
                        item={item}
                        onItemChange={onItemChange}
                        onProductSearch={onProductSearch}
                        onProductSelect={onProductSelect}
                        productSuggestions={productSuggestions}
                        productQuery={productQuery}
                      />
                    </td>
                  ))}
                  <td className="text-center">
                    <button className="btn-del-row" onClick={() => removeItem(item.rowId)} title="Delete row">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 6 }}>
          <button className="btn-add-row" onClick={addEmptyRow}>
            <span>＋</span> Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
