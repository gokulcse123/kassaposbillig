import React from 'react';
import { fmt2, fmtINR } from '../../../shared/helpers/index.js';

function AmtRow({ label, value, editable, onChange, highlight }) {
  return (
    <div className={`amt-row${highlight ? ' total' : ''}`}>
      <span className="label">{label}</span>
      {editable ? (
        <input
          className="form-control text-right"
          style={{ width: 100, height: 22, fontSize: 12 }}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
        />
      ) : (
        <span className="value">{fmt2(value)}</span>
      )}
    </div>
  );
}

export function AmountSummary({ totals, overrides, onOverrideChange, header, onHeaderChange }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header"><span>💵</span> Amount Summary</div>
      <div className="card-body" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--border)' }}>

          {/* Column 1 */}
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <AmtRow label="Gross Amt"  value={totals.grossAmt} />
            <AmtRow label="Trans Amt"  value={overrides.transAmt}  editable onChange={v => onOverrideChange('transAmt', v)} />
            <AmtRow label="Display Amt" value={totals.displayAmt} />
          </div>

          {/* Column 2 */}
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <AmtRow label="CD Amt"    value={totals.cdAmt} />
            <AmtRow label="Disc Amt"  value={totals.discAmt} />
            <AmtRow label="CESS Amt"  value={totals.cessAmt} />
          </div>

          {/* Column 3 */}
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <AmtRow label="CGST Amt"  value={header.igst ? 0 : totals.cgstAmt} />
            <AmtRow label="SGST Amt"  value={header.igst ? 0 : totals.sgstAmt} />
            <AmtRow label="GST Amt"   value={totals.gstAmt} />
          </div>

          {/* Column 4 */}
          <div style={{ borderRight: '1px solid var(--border)' }}>
            <AmtRow label="Others (+)" value={overrides.otherPlus} editable onChange={v => onOverrideChange('otherPlus', v)} />
            <AmtRow label="Others (-)" value={overrides.otherSub}  editable onChange={v => onOverrideChange('otherSub', v)} />
            <AmtRow label="TCS %"     value={overrides.tcsPercent} editable onChange={v => onOverrideChange('tcsPercent', v)} />
          </div>

          {/* Column 5 */}
          <div>
            <AmtRow label="TCS Amt"   value={totals.tcsAmt} />
            <div className="amt-row">
              <span className="label">Loadding</span>
              <input
                className="form-control"
                style={{ width: 100, height: 22, fontSize: 11, textTransform: 'uppercase' }}
                value={header.loadding}
                onChange={e => onHeaderChange('loadding', e.target.value.toUpperCase())}
                placeholder="Loadding..."
              />
            </div>
            <div className="amt-row">
              <span className="label">Lorry No</span>
              <input
                className="form-control"
                style={{ width: 100, height: 22, fontSize: 11, textTransform: 'uppercase' }}
                value={header.lorryNo}
                onChange={e => onHeaderChange('lorryNo', e.target.value.toUpperCase())}
                placeholder="Lorry no..."
              />
            </div>
          </div>
        </div>

        {/* Net Total */}
        <div className="net-total-box">
          <div className="nt-label">NET TOTAL</div>
          <div className="nt-value">₹ {fmtINR(totals.netAmt)}</div>
        </div>
      </div>
    </div>
  );
}
