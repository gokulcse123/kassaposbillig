import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PurchaseApi } from '../../infrastructure/api/PurchaseApi.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const r2  = v => Math.round((parseFloat(v) || 0) * 100) / 100;
const f2  = v => (parseFloat(v) || 0).toFixed(2);
const f0  = v => (parseFloat(v) || 0).toFixed(0);
const today = () => new Date().toISOString().split('T')[0];
const fmtDate = d => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
};
const addDays = (d, n) => {
  const dt = new Date(d || new Date());
  dt.setDate(dt.getDate() + (parseInt(n) || 0));
  return dt.toISOString().split('T')[0];
};

function showToast(msg, type = 'success') {
  window.dispatchEvent(new CustomEvent('pm-toast', { detail: { msg, type } }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Calculation logic  (mirrors PurchaseMaster.js Calculation function exactly)
// ─────────────────────────────────────────────────────────────────────────────
function calcItem(item, igstBill = false) {
  const rate    = parseFloat(item.PurchaseRate)    || 0;
  const qty     = parseFloat(item.ItemQty)         || 0;
  const noms    = parseFloat(item.Noms)            || 0;
  const totalQty= qty + noms;
  const cdPer   = parseFloat(item.CDPercent)       || 0;
  const discPer = parseFloat(item.DiscountPercent) || 0;
  const gstPer  = parseFloat(item.TaxPercent)      || 0;
  const cessPer = parseFloat(item.CESSPer)         || 0;
  const transPer= parseFloat(item.TransPer)        || 0;

  const purAmt   = r2(rate * totalQty);
  const cdAmt    = r2(purAmt * cdPer / 100);
  const disAmt   = r2((purAmt - cdAmt) * discPer / 100);
  const C1       = totalQty ? r2(cdAmt  / totalQty) : 0;
  const D1       = totalQty ? r2(disAmt / totalQty) : 0;
  const netRate  = r2(rate - C1 - D1);
  const transAmt = totalQty ? r2(netRate * totalQty * transPer / 100) : 0;
  const cessAmt  = r2(netRate * totalQty * cessPer  / 100);
  const ctAmt    = r2(netRate * totalQty * (gstPer / 2) / 100);
  const stAmt    = (igstBill) ? 0 : ctAmt;
  const gstAmt   = r2(ctAmt + stAmt);
  const landingCost = totalQty ? r2(netRate + (gstAmt + cessAmt) / totalQty) : 0;
  const amount   = r2(purAmt - cdAmt - disAmt + gstAmt + cessAmt + transAmt);
  const productTotal = purAmt;

  return {
    ...item,
    CDAmount:      f2(cdAmt),
    DiscountAmt:   f2(disAmt),
    TaxAmt:        f2(gstAmt),
    CESSAmount:    f2(cessAmt),
    TransAmt:      f2(transAmt),
    CTAmount:      f2(ctAmt),
    STAmount:      f2(stAmt),
    LandingCost:   f2(landingCost),
    Amount:        f2(amount),
    ProductTotal:  f2(productTotal),
  };
}

function calcTotals(items, overrides, igstBill) {
  const valid = items.filter(i => i.ProductCode);
  const grossAmt  = r2(valid.reduce((s, i) => s + (parseFloat(i.ProductTotal) || 0), 0));
  const gstAmt    = r2(valid.reduce((s, i) => s + (parseFloat(i.TaxAmt)       || 0), 0));
  const cessAmt   = r2(valid.reduce((s, i) => s + (parseFloat(i.CESSAmount)   || 0), 0));
  const transAmt  = r2(valid.reduce((s, i) => s + (parseFloat(i.TransAmt)     || 0), 0));
  const cdAmt     = r2(valid.reduce((s, i) => s + (parseFloat(i.CDAmount)     || 0), 0));
  const discAmt   = r2(valid.reduce((s, i) => s + (parseFloat(i.DiscountAmt)  || 0), 0));
  const ctAmt     = r2(valid.reduce((s, i) => s + (parseFloat(i.CTAmount)     || 0), 0));
  const stAmt     = r2(valid.reduce((s, i) => s + (parseFloat(i.STAmount)     || 0), 0));
  const totalQty  = r2(valid.reduce((s, i) => s + (parseFloat(i.ItemQty)      || 0), 0));

  const otherPlus  = parseFloat(overrides.otherPlus)  || 0;
  const otherSub   = parseFloat(overrides.otherSub)   || 0;
  const tcsPer     = parseFloat(overrides.tcsPer)     || 0;
  const transManual= parseFloat(overrides.transAmt)   || 0;

  const grossTotal = r2(grossAmt + gstAmt + cessAmt + transAmt + otherPlus - cdAmt - discAmt - otherSub);
  const tcsAmt     = r2(grossTotal * tcsPer / 100);
  const netAmt     = r2(grossTotal + tcsAmt + transManual);

  return {
    grossAmt:   f2(grossAmt),
    gstAmt:     f2(gstAmt),
    cessAmt:    f2(cessAmt),
    transAmt:   f2(transAmt),
    cdAmt:      f2(cdAmt),
    discAmt:    f2(discAmt),
    cgstAmt:    f2(igstBill ? 0 : ctAmt),
    sgstAmt:    f2(igstBill ? 0 : stAmt),
    tcsAmt:     f2(tcsAmt),
    netAmt:     f2(netAmt),
    displayAmt: f2(grossAmt),
    totalQty:   f2(totalQty),
  };
}

function buildGstRows(items, igstBill) {
  const map = {};
  items.filter(i => i.ProductCode).forEach(i => {
    const k = parseFloat(i.TaxPercent) || 0;
    if (!map[k]) map[k] = { gstPer: k, gstAmt: 0, cgst: 0, sgst: 0 };
    map[k].gstAmt = r2(map[k].gstAmt + (parseFloat(i.TaxAmt)    || 0));
    map[k].cgst   = r2(map[k].cgst   + (parseFloat(i.CTAmount)   || 0));
    map[k].sgst   = r2(map[k].sgst   + (igstBill ? 0 : (parseFloat(i.STAmount) || 0)));
  });
  return Object.values(map).sort((a, b) => a.gstPer - b.gstPer);
}

// ─────────────────────────────────────────────────────────────────────────────
// New empty row factory
// ─────────────────────────────────────────────────────────────────────────────
let rowCounter = 0;
function newRow() {
  return {
    _id: `row_${++rowCounter}`,
    ProductCode: '', ProductName: '', ProductRefId: 0,
    HSNCode: '', UOM: '', UOMDecimal: 2,
    MRP: '0.00', PurchaseRate: '0.00', StockQty: '0.000',
    ItemQty: '0', FreeQty: '0', Noms: '0',
    CDPercent: '0', CDAmount: '0.00',
    DiscountPercent: '0', DiscountAmt: '0.00',
    TaxPercent: '0', TaxAmt: '0.00',
    CESSPer: '0', CESSAmount: '0.00',
    TransPer: '0', TransAmt: '0.00',
    LandingCost: '0.00', Amount: '0.00',
    SalesRate: '0.00', WholeSaleRate: '0.00',
    ProfitPer: '0', ProfitAmt: '0.00',
    SaleDiscountPer: '0', CTAmount: '0.00', STAmount: '0.00',
    ProductTotal: '0.00', BatchNo: '', EditMode: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid columns  (visible ones matching the screenshot)
// ─────────────────────────────────────────────────────────────────────────────
const COLS = [
  { key: 'ProductCode',      label: 'Product Code',  w: 90,  align: 'left',  editable: true,  type: 'code' },
  { key: 'ProductName',      label: 'Description',   w: 200, align: 'left',  editable: true,  type: 'name' },
  { key: 'MRP',              label: 'MRP',           w: 80,  align: 'right', editable: true,  type: 'num'  },
  { key: 'PurchaseRate',     label: 'Pur.Rate',      w: 80,  align: 'right', editable: true,  type: 'num'  },
  { key: 'StockQty',         label: 'StockQty',      w: 72,  align: 'right', editable: false, type: 'num'  },
  { key: 'ItemQty',          label: 'Quantity',      w: 72,  align: 'right', editable: true,  type: 'num'  },
  { key: 'DiscountPercent',  label: 'Disc(%)',        w: 60,  align: 'right', editable: true,  type: 'num'  },
  { key: 'DiscountAmt',      label: 'Disc Amt',      w: 72,  align: 'right', editable: false, type: 'num'  },
  { key: 'TaxPercent',       label: 'GST(%)',         w: 60,  align: 'right', editable: true,  type: 'num'  },
  { key: 'LandingCost',      label: 'Landing Cost',  w: 88,  align: 'right', editable: false, type: 'num'  },
  { key: 'Amount',           label: 'Amount',        w: 90,  align: 'right', editable: false, type: 'num'  },
  { key: 'SalesRate',        label: 'SaleRate',       w: 78,  align: 'right', editable: true,  type: 'num'  },
];

// Tab/Enter focus order within a row
const FOCUS_KEYS = ['ProductCode', 'MRP', 'PurchaseRate', 'ItemQty', 'DiscountPercent', 'TaxPercent', 'SalesRate'];

// ─────────────────────────────────────────────────────────────────────────────
// Product Search Modal
// ─────────────────────────────────────────────────────────────────────────────
function ProductSearchModal({ open, rowIdx, initialQuery, onClose, onSelect }) {
  const [query,    setQuery]    = useState('');
  const [list,     setList]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selIdx,   setSelIdx]   = useState(0);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  // Reset & focus when modal opens
  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery || '');
    setSelIdx(0);
    setTimeout(() => inputRef.current?.focus(), 60);
  }, [open, initialQuery]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (!query.trim()) { setList([]); return; }
      setLoading(true);
      try {
        const r = await PurchaseApi.searchProducts(query.trim());
        setList(r.data || []);
        setSelIdx(0);
      } catch { setList([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, open]);

  // Scroll selected row into view
  useEffect(() => {
    const el = listRef.current?.children[selIdx];
    el?.scrollIntoView({ block: 'nearest' });
  }, [selIdx]);

  const handleKey = e => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSelIdx(s => Math.min(s + 1, list.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSelIdx(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter')      { e.preventDefault(); if (list[selIdx]) onSelect(list[selIdx], rowIdx); }
    if (e.key === 'Escape')     { e.preventDefault(); onClose(); }
  };

  if (!open) return null;
  return (
    <div style={MS.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...MS.box, width: 760, top: 55, position: 'fixed', left: '50%', transform: 'translateX(-50%)', maxHeight: '80vh' }}>
        {/* Header */}
        <div style={MS.hdr}>
          🔍 Product Search
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        {/* Search input */}
        <div style={{ padding: '7px 10px', borderBottom: '1px solid #dde5f5' }}>
          <input
            ref={inputRef}
            style={{ width: '100%', height: 28, padding: '0 8px', border: '1px solid #1f65de', borderRadius: 4, fontSize: 13, outline: 'none' }}
            placeholder="Product name / code enter pannunga..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        {/* Column headers */}
        <div style={{ display: 'flex', background: '#1f65de', color: 'white', fontSize: 11, fontWeight: 600, padding: '4px 0' }}>
          {[['Code',80],['Description',280],['Pur.Rate',80],['MRP',70],['Stock',70],['UOM',55],['GST%',55]].map(([h,w]) => (
            <span key={h} style={{ width: w, padding: '0 6px', textAlign: h==='Description'?'left':'right', flexShrink:0 }}>{h}</span>
          ))}
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', maxHeight: 320 }} ref={listRef}>
          {loading && <div style={{ padding: 16, textAlign: 'center', color: '#888', fontSize: 12 }}>Searching...</div>}
          {!loading && list.length === 0 && (
            <div style={{ padding: 16, textAlign: 'center', color: '#888', fontSize: 12 }}>
              {query ? 'No products found' : 'Type to search...'}
            </div>
          )}
          {list.map((p, i) => (
            <div
              key={p.Id || i}
              ref={el => { if (listRef.current) listRef.current.children[i] = el; }}
              onClick={() => onSelect(p, rowIdx)}
              style={{
                display: 'flex', alignItems: 'center', padding: '4px 0',
                background: i === selIdx ? '#e8f0fd' : 'white',
                borderBottom: '1px solid #f0f4ff', cursor: 'pointer', fontSize: 12,
              }}
            >
              <span style={{ width:80,  padding:'0 6px', color:'#4a6080', fontFamily:'monospace', flexShrink:0 }}>{p.ProductCode}</span>
              <span style={{ width:280, padding:'0 6px', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{p.ProductName}</span>
              <span style={{ width:80,  padding:'0 6px', textAlign:'right', fontFamily:'monospace', color:'#1a2b4a', flexShrink:0 }}>{f2(p.PurchaseRate)}</span>
              <span style={{ width:70,  padding:'0 6px', textAlign:'right', fontFamily:'monospace', color:'#1f65de', flexShrink:0 }}>₹{f2(p.MRP)}</span>
              <span style={{ width:70,  padding:'0 6px', textAlign:'right', fontFamily:'monospace', color: (p.Stock||0)>0?'#16a34a':'#dc2626', flexShrink:0 }}>{f2(p.Stock)}</span>
              <span style={{ width:55,  padding:'0 6px', textAlign:'center', color:'#888', flexShrink:0 }}>{p.UOM}</span>
              <span style={{ width:55,  padding:'0 6px', textAlign:'right', color:'#888', flexShrink:0 }}>{p.GST}%</span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ padding: '4px 10px', background: '#f5f5f5', fontSize: 11, color: '#888', borderTop: '1px solid #ddd', display:'flex', gap:12 }}>
          <span>↑↓ Navigate</span><span>Enter — Select</span><span>Esc — Close</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// F5 View Modal
// ─────────────────────────────────────────────────────────────────────────────
function F5ViewModal({ suppliers, onClose, onEditLoad }) {
  const [from,    setFrom]    = useState(today());
  const [to,      setTo]      = useState(today());
  const [sid,     setSid]     = useState(0);
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await PurchaseApi.getPurchaseList(from, to, parseInt(sid) || 0);
      setList(r.data || r.Data || []);
    } catch { setList([]); }
    setLoading(false);
  }, [from, to, sid]);

  // auto-load on open
  useEffect(() => { load(); }, []);

  return (
    <div style={MS.backdrop} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...MS.box, width: 900, maxHeight: '88vh' }}>
        <div style={MS.hdr}>
          📋 Purchase Details View — F5
          <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'white', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>
        {/* Filter bar */}
        <div style={{ padding:'8px 10px', display:'flex', gap:8, alignItems:'flex-end', borderBottom:'1px solid #dde5f5', flexWrap:'wrap' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <label style={FS.label}>From Date</label>
            <input type="date" style={{ ...FS.input, width:140 }} value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <label style={FS.label}>To Date</label>
            <input type="date" style={{ ...FS.input, width:140 }} value={to} onChange={e=>setTo(e.target.value)} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <label style={FS.label}>Supplier</label>
            <select style={{ ...FS.select, width:220 }} value={sid} onChange={e=>setSid(e.target.value)}>
              <option value={0}>All Suppliers</option>
              {suppliers.map(s => <option key={s.Id} value={s.Id}>{s.AccountName}</option>)}
            </select>
          </div>
          <button style={{ ...FS.btnP, height:28 }} onClick={load}>🔍 View</button>
        </div>
        {/* Table */}
        <div style={{ overflowY:'auto', maxHeight:480 }}>
          {loading && <div style={{ padding:20, textAlign:'center', color:'#888' }}>Loading...</div>}
          {!loading && (
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr>
                  {['S.No','Pur.No','Date','Type','Supplier','Invoice No','Net Amt','Action'].map(h => (
                    <th key={h} style={{ background:'#1f65de', color:'white', padding:'5px 8px',
                      textAlign:h==='Net Amt'?'right':'left', position:'sticky', top:0 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length===0 && <tr><td colSpan={8} style={{ padding:16, textAlign:'center', color:'#888' }}>No records found</td></tr>}
                {list.map((row, i) => (
                  <tr key={row.Id||i} style={{ borderBottom:'1px solid #dde5f5', background: i%2===0?'white':'#fafcff' }}>
                    <td style={{ padding:'4px 8px' }}>{i+1}</td>
                    <td style={{ padding:'4px 8px', fontWeight:600, color:'#1f65de' }}>{row.PurchaseNo}</td>
                    <td style={{ padding:'4px 8px' }}>{fmtDate(row.PurchaseDate)}</td>
                    <td style={{ padding:'4px 8px' }}>{row.PurchaseType==='CA'?'CASH':'CREDIT'}</td>
                    <td style={{ padding:'4px 8px' }}>{row.SupplierName}</td>
                    <td style={{ padding:'4px 8px' }}>{row.SupplierInvoiceNo}</td>
                    <td style={{ padding:'4px 8px', textAlign:'right', fontFamily:'monospace', fontWeight:600 }}>{f2(row.NetAmt)}</td>
                    <td style={{ padding:'4px 8px' }}>
                      <button
                        style={{ background:'#e8f0fd', border:'1px solid #1f65de', color:'#1f65de', borderRadius:3, padding:'2px 8px', fontSize:11, cursor:'pointer', fontWeight:600 }}
                        onClick={() => { onEditLoad(row.Id); onClose(); }}>
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Dialog
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmDialog({ msg, onYes, onNo }) {
  return (
    <div style={MS.backdrop}>
      <div style={{ ...MS.box, width: 380 }}>
        <div style={MS.hdr}>⚠️ Confirm</div>
        <div style={{ padding:'16px 14px', fontSize:13, color:'#1a2b4a' }}>{msg}</div>
        <div style={{ padding:'10px 14px', display:'flex', justifyContent:'flex-end', gap:8, borderTop:'1px solid #dde5f5' }}>
          <button style={{ ...FS.btnDanger, height:30, padding:'0 14px' }} onClick={onYes}>Yes, Proceed</button>
          <button style={{ ...FS.btnSec,    height:30, padding:'0 14px' }} onClick={onNo}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast Host
// ─────────────────────────────────────────────────────────────────────────────
function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const h = e => {
      const id = Date.now() + Math.random();
      setToasts(t => [...t, { id, ...e.detail }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
    };
    window.addEventListener('pm-toast', h);
    return () => window.removeEventListener('pm-toast', h);
  }, []);
  const colors = { success:'#16a34a', error:'#dc2626', warn:'#d97706', info:'#1f65de' };
  const icons  = { success:'✅', error:'❌', warn:'⚠️', info:'ℹ️' };
  return (
    <div style={{ position:'fixed', top:50, right:12, zIndex:9999, display:'flex', flexDirection:'column', gap:5 }}>
      {toasts.map(t => (
        <div key={t.id} style={{ minWidth:260, padding:'9px 14px', borderRadius:6, background:'white',
          borderLeft:`4px solid ${colors[t.type]||colors.info}`,
          boxShadow:'0 4px 16px rgba(0,0,0,0.14)', fontSize:13, fontWeight:500, display:'flex', gap:7, alignItems:'center' }}>
          {icons[t.type]||icons.info} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal & form shared styles
// ─────────────────────────────────────────────────────────────────────────────
const MS = {
  backdrop: { position:'fixed', inset:0, background:'rgba(10,20,50,0.5)', zIndex:8000, display:'flex', alignItems:'flex-start', justifyContent:'center' },
  box:      { background:'white', borderRadius:8, boxShadow:'0 20px 60px rgba(10,20,50,0.3)', overflow:'hidden', maxWidth:'96vw' },
  hdr:      { background:'#1f65de', color:'white', padding:'10px 14px', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8 },
};
const FS = {
  label:    { fontSize:10.5, fontWeight:500, color:'#4a6080', textTransform:'uppercase', letterSpacing:'0.3px' },
  input:    { height:26, padding:'0 7px', border:'1px solid #dde5f5', borderRadius:3, fontSize:12, fontFamily:'inherit', color:'#1a2b4a', outline:'none', background:'white' },
  inputRO:  { height:26, padding:'0 7px', border:'1px solid #dde5f5', borderRadius:3, fontSize:12, fontFamily:'inherit', color:'#4a6080', outline:'none', background:'#f0f4ff', cursor:'not-allowed' },
  select:   { height:26, padding:'0 5px', border:'1px solid #dde5f5', borderRadius:3, fontSize:12, fontFamily:'inherit', color:'#1a2b4a', background:'white', cursor:'pointer', outline:'none' },
  btnP:     { background:'#1f65de', color:'white', border:'none', borderRadius:4, fontWeight:600, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', height:30, padding:'0 14px' },
  btnSec:   { background:'white', color:'#1f65de', border:'1px solid #1f65de', borderRadius:4, fontWeight:600, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', height:30, padding:'0 14px' },
  btnDanger:{ background:'white', color:'#dc2626', border:'1px solid #dc2626', borderRadius:4, fontWeight:600, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', height:30, padding:'0 14px' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────────────────────────────────────
export function PurchaseMasterPage() {
  // ── Master data
  const [suppliers,  setSuppliers]  = useState([]);

  // ── Header fields
  const [purchaseNo,   setPurchaseNo]   = useState('');
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [dueDate,      setDueDate]      = useState(today());
  const [purchaseType, setPurchaseType] = useState('CREDIT');
  const [supplierId,   setSupplierId]   = useState(0);
  const [supInfo, setSupInfo] = useState({
    Address:'', City:'', ContactNo:'', Balance:0,
    CurrentStock:0, IGSTBill:'GST', CreditDays:0,
  });
  const [invoiceNo,   setInvoiceNo]   = useState('');
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [invoiceAmt,  setInvoiceAmt]  = useState('');
  const [igst,        setIgst]        = useState(false);
  const [taxMode,     setTaxMode]     = useState('exclusive');
  const [remarks,     setRemarks]     = useState('');

  // ── Grid items
  const [items, setItems] = useState([newRow()]);

  // ── Override fields (user-editable)
  const [overrides, setOverrides] = useState({
    transAmt: '', otherPlus: '', otherSub: '', tcsPer: '0',
  });

  // ── Edit state
  const [editMode, setEditMode] = useState(false);
  const [editId,   setEditId]   = useState(0);

  // ── UI state
  const [loading,    setLoading]    = useState(false);
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [prodModal,  setProdModal]  = useState({ open:false, rowIdx:0, query:'' });
  const [showF5,     setShowF5]     = useState(false);

  // ── Cell refs for programmatic focus
  const cellRefs = useRef({});
  const setRef   = (row, col) => el => { if (el) cellRefs.current[`${row}_${col}`] = el; };
  const focusCell = useCallback((row, col) => {
    setTimeout(() => {
      const el = cellRefs.current[`${row}_${col}`];
      if (el) { el.focus(); el.select?.(); }
    }, 40);
  }, []);

  // ── Computed totals & GST rows
  const totals  = useMemo(() => calcTotals(items, overrides, igst), [items, overrides, igst]);
  const gstRows = useMemo(() => buildGstRows(items, igst),          [items, igst]);

  // ─── Init: load suppliers + purchase no ─────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);

      // Supplier load — separate try/catch
      try {
        const sRes = await PurchaseApi.getSuppliers();
        console.log('Supplier response:', sRes);
        if (sRes.ok) setSuppliers(sRes.data);
        else showToast('Supplier load failed', 'error');
      } catch (e) {
        showToast('Supplier error: ' + e.message, 'error');
        console.error('Supplier error:', e);
      }

      // Purchase No load — separate try/catch
      try {
        const noRes = await PurchaseApi.getNextPurchaseNo();
        if (noRes.ok) setPurchaseNo(noRes.purchaseNo);
      } catch (e) {
        console.error('PurchaseNo error:', e);
      }

      setLoading(false);
    })();
  }, []);

  // ─── Supplier select ─────────────────────────────────────────────────────
  const handleSupplierChange = async sid => {
    const id = parseInt(sid);
    setSupplierId(id);
    if (!id) {
      setSupInfo({ Address:'', City:'', ContactNo:'', Balance:0, CurrentStock:0, IGSTBill:'GST', CreditDays:0 });
      return;
    }
    const s = suppliers.find(x => x.Id === id);
    if (!s) return;

    const info = {
      Address:      [s.Address1, s.Address2].filter(Boolean).join(', '),
      City:         s.City         || '',
      ContactNo:    s.MobileNo     || '',
      Balance:      0,
      CurrentStock: 0,
      IGSTBill:     s.IGSTBill     || 'GST',
      CreditDays:   s.CreditBillDays || 0,
    };
    setSupInfo(info);
    setDueDate(addDays(purchaseDate, info.CreditDays));
    setIgst(info.IGSTBill === 'IGST' || info.IGSTBill === 'UGST');

    // Async: load balance
    try {
      const br = await PurchaseApi.getSupplierBalance(id, purchaseDate);
      if (br.ok) setSupInfo(p => ({ ...p, Balance: parseFloat(br.data) || 0 }));
    } catch {}
  };

  // ─── Item field change → recalculate ────────────────────────────────────
  const handleItemChange = useCallback((idx, field, val) => {
    setItems(prev => {
      const next = [...prev];
      const row  = { ...next[idx], [field]: val };
      next[idx]  = calcItem(row, igst);
      next[idx].EditMode = 1;
      return next;
    });
  }, [igst]);

  // ─── Apply selected product to a row ────────────────────────────────────
  const applyProduct = useCallback((p, rowIdx) => {
    setItems(prev => {
      const next = [...prev];
      const base = {
        ...next[rowIdx],
        ProductCode:     p.ProductCode     || '',
        ProductName:     p.ProductName     || '',
        ProductRefId:    p.Id              || 0,
        HSNCode:         p.HSNCode         || '',
        UOM:             p.UOM             || '',
        UOMDecimal:      p.UOMDecimal      || 2,
        MRP:             f2(p.MRP          || 0),
        PurchaseRate:    f2(p.PurchaseRate || 0),
        StockQty:        f2(p.Stock        || 0),
        ItemQty:         '1',
        TaxPercent:      f2(p.GST          || 0),
        CESSPer:         f2(p.CESS         || 0),
        SalesRate:       f2(p.SalesRate    || 0),
        LandingCost:     f2(p.LandingCost  || 0),
        ProfitPer:       f2(p.ProfitPer    || 0),
        ProfitAmt:       f2(p.ProfitAmt    || 0),
        WholeSaleRate:   f2(p.WholeSaleRate|| 0),
        SaleDiscountPer: f2(p.SaleDiscountPer || 0),
        CDPercent: '0', CDAmount: '0.00',
        DiscountPercent: '0', DiscountAmt: '0.00',
        TransPer: '0', TransAmt: '0.00',
        EditMode: 1,
      };
      next[rowIdx] = calcItem(base, igst);

      // Auto-add empty row when filling the last row
      if (rowIdx === next.length - 1) next.push(newRow());
      return next;
    });

    setProdModal({ open:false, rowIdx:0, query:'' });
    // Focus next editable cell: ItemQty
    focusCell(rowIdx, 'ItemQty');
  }, [igst, focusCell]);

  // ─── ProductCode Enter: lookup then modal ────────────────────────────────
  const handleProductCodeEnter = useCallback(async (idx, code) => {
    const trimmed = code.trim();
    if (!trimmed) {
      // Empty → open modal with blank search
      setProdModal({ open:true, rowIdx:idx, query:'' });
      return;
    }
    setLoading(true);
    try {
      const r = await PurchaseApi.getProductByCode(trimmed);
      const data = r.data || [];
      if (data.length === 1) {
        applyProduct(data[0], idx);
      } else {
        // 0 results or multiple → open modal pre-filled
        setProdModal({ open:true, rowIdx:idx, query: trimmed });
      }
    } catch {
      setProdModal({ open:true, rowIdx:idx, query: trimmed });
    }
    setLoading(false);
  }, [applyProduct]);

  // ─── Grid cell keyboard handler ──────────────────────────────────────────
  const handleCellKey = useCallback((e, idx, colKey) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    if (colKey === 'ProductCode') {
      handleProductCodeEnter(idx, items[idx].ProductCode);
      return;
    }
    if (colKey === 'ProductName') {
      setProdModal({ open:true, rowIdx:idx, query: items[idx].ProductName || '' });
      return;
    }

    // Navigate: find next focusable column
    const fi = FOCUS_KEYS.indexOf(colKey);
    if (fi !== -1 && fi < FOCUS_KEYS.length - 1) {
      focusCell(idx, FOCUS_KEYS[fi + 1]);
      return;
    }

    // Last column → next row ProductCode
    const nextIdx = idx + 1;
    if (nextIdx >= items.length) {
      setItems(p => [...p, newRow()]);
      setTimeout(() => focusCell(nextIdx, 'ProductCode'), 50);
    } else {
      focusCell(nextIdx, 'ProductCode');
    }
  }, [items, handleProductCodeEnter, focusCell]);

  // ─── Delete row ──────────────────────────────────────────────────────────
  const deleteRow = useCallback(idx => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length === 0 ? [newRow()] : next;
    });
  }, []);

  // ─── Save ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!supplierId) { showToast('Supplier select pannunga!', 'error'); return; }
    if (!invoiceNo.trim()) { showToast('Invoice No enter pannunga!', 'error'); return; }
    const validItems = items.filter(i => i.ProductCode);
    if (!validItems.length) { showToast('Minimum one product add pannunga!', 'error'); return; }
    if (parseFloat(invoiceAmt) > 0 && parseFloat(invoiceAmt) !== parseFloat(totals.netAmt)) {
      showToast('Invoice Amount ≠ Net Total — confirm pannunga!', 'warn');
    }

    const sup    = suppliers.find(s => s.Id === supplierId) || {};
    const purType= purchaseType === 'CASH' ? 'CA' : 'CR';

    const payload = [{
      Id:                  editMode ? editId : 0,
      SupplierRefId:       supplierId,
      PurchaseNo:          purchaseNo,
      CompanyRefId:        parseInt(localStorage.getItem('Comid') || '1'),
      PurchaseDate:        purchaseDate,
      PurchaseType:        purType,
      IGSTBill:            igst ? 'IGST' : 'GST',
      taxamount:           parseFloat(totals.gstAmt)  || 0,
      CTAmount:            parseFloat(totals.cgstAmt) || 0,
      STAmount:            parseFloat(totals.sgstAmt) || 0,
      SupplierName:        sup.AccountName            || '',
      SupplierInvoiceNo:   invoiceNo,
      SupplierInvoiceDate: invoiceDate,
      NetAmt:              parseFloat(totals.netAmt)  || 0,
      discamount:          parseFloat(totals.discAmt) || 0,
      cdamount:            parseFloat(totals.cdAmt)   || 0,
      Others_A:            parseFloat(overrides.otherPlus) || 0,
      Others_D:            parseFloat(overrides.otherSub)  || 0,
      DueDate:             dueDate,
      DisplayAmount:       parseFloat(totals.displayAmt)   || 0,
      FreightCharges:      parseFloat(overrides.transAmt)  || 0,
      CESSAmount:          parseFloat(totals.cessAmt) || 0,
      SPLCESSAmount:       0,
      Remarks:             remarks,
      UpdateId:            '',
      Credit:              0,
      Debit:               parseFloat(totals.netAmt)  || 0,
      IGSTAmount:          igst ? parseFloat(totals.gstAmt) || 0 : 0,
      PaymentRefId:        null,
      PoRefId:             null,
      Address1:            sup.Address1  || '',
      Address2:            sup.Address2  || '',
      City:                sup.City      || '',
      Phone:               sup.MobileNo  || '',
      Tin:                 sup.GSTNo     || '',
      Email:               sup.Email     || '',
      Modified_By:         localStorage.getItem('username') || 'sa',
      MultiPurchaseOrderMasterRefid: 0,
      PurchaseDetails: validItems.map(i => ({
        PDId:              i.id || 0,
        ProductRefId:      i.ProductRefId,
        ProductCode:       i.ProductCode,
        ProductName:       i.ProductName,
        HSNCode:           i.HSNCode,
        UOM:               i.UOM,
        UOMRefid:          i.UOMRefid || 0,
        MRP:               parseFloat(i.MRP)             || 0,
        PurchaseRate:      parseFloat(i.PurchaseRate)    || 0,
        LandingCost:       parseFloat(i.LandingCost)     || 0,
        OldPurchaseRate:   parseFloat(i.PurchaseRate)    || 0,
        ItemQty:           parseFloat(i.ItemQty)         || 0,
        FreeQty:           parseFloat(i.FreeQty)         || 0,
        CDPercent:         parseFloat(i.CDPercent)       || 0,
        CDAmount:          parseFloat(i.CDAmount)        || 0,
        DiscountPercent:   parseFloat(i.DiscountPercent) || 0,
        DiscountAmt:       parseFloat(i.DiscountAmt)     || 0,
        TaxPercent:        parseFloat(i.TaxPercent)      || 0,
        TaxAmt:            parseFloat(i.TaxAmt)          || 0,
        CTAmount:          parseFloat(i.CTAmount)        || 0,
        STAmount:          parseFloat(i.STAmount)        || 0,
        CESSPer:           parseFloat(i.CESSPer)         || 0,
        CESSAmount:        parseFloat(i.CESSAmount)      || 0,
        TransPer:          parseFloat(i.TransPer)        || 0,
        TransAmt:          parseFloat(i.TransAmt)        || 0,
        Salerate:          parseFloat(i.SalesRate)       || 0,
        SalesRate:         parseFloat(i.SalesRate)       || 0,
        WholeSaleRate:     parseFloat(i.WholeSaleRate)   || 0,
        ProfitPer:         parseFloat(i.ProfitPer)       || 0,
        ProfitAmt:         parseFloat(i.ProfitAmt)       || 0,
        SaleDiscountPer:   parseFloat(i.SaleDiscountPer) || 0,
        Amount:            parseFloat(i.Amount)          || 0,
        ProductTotal:      parseFloat(i.ProductTotal)    || 0,
        BatchNo:           i.BatchNo || '',
        EditMode:          i.EditMode || 0,
        StockQty:          parseFloat(i.StockQty) || 0,
        SerialNoType:      0,
      })),
      StockDetails:   [],
      SerialNoDetails:[],
    }];

    setLoading(true);
    try {
      const r = await PurchaseApi.savePurchase(payload);
      if (r.redis === false) { showToast('Session expired — please login again', 'error'); return; }
      if (r.ok) { showToast(r.message || 'Purchase saved successfully!', 'success'); handleClear(); }
      else      { showToast(r.message || 'Save failed', 'error'); }
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    setLoading(false);
  }, [supplierId, invoiceNo, items, totals, overrides, igst, editMode, editId,
      purchaseNo, purchaseDate, dueDate, purchaseType, invoiceDate, invoiceAmt,
      remarks, suppliers]);

  // ─── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    if (!editMode || !editId) { showToast('Edit mode la irundhu delete pannunga!', 'warn'); return; }
    setConfirmDlg({
      msg: `Purchase No: ${purchaseNo} — delete pannanuma?`,
      onYes: async () => {
        setConfirmDlg(null);
        setLoading(true);
        try {
          const r = await PurchaseApi.deletePurchase(editId);
          if (r.ok) { showToast(r.message || 'Deleted!', 'success'); handleClear(); }
          else      { showToast(r.message || 'Delete failed', 'error'); }
        } catch (e) { showToast(e.message, 'error'); }
        setLoading(false);
      },
    });
  }, [editMode, editId, purchaseNo]);

  // ─── Edit load ───────────────────────────────────────────────────────────
  const handleEditLoad = useCallback(async id => {
    setLoading(true);
    try {
      const r = await PurchaseApi.getPurchaseById(id);
      const d = r.Data?.[0] || r.data?.[0] || r;
      if (!d?.PurchaseNo) { showToast('Record not found', 'error'); setLoading(false); return; }

      setPurchaseNo(d.PurchaseNo);
      setPurchaseDate(d.PurchaseDate?.split('T')[0] || today());
      setDueDate(d.DueDate?.split('T')[0] || today());
      setPurchaseType(d.PurchaseType === 'CA' ? 'CASH' : 'CREDIT');
      setSupplierId(d.SupplierRefId || 0);
      setInvoiceNo(d.SupplierInvoiceNo || '');
      setInvoiceDate(d.SupplierInvoiceDate?.split('T')[0] || today());
      setInvoiceAmt(f2(d.NetAmt));
      const isIgst = d.IGSTBill === 'IGST' || d.IGSTBill === 'UGST';
      setIgst(isIgst);
      setRemarks(d.Remarks || '');
      setOverrides({
        transAmt:  f2(d.FreightCharges || 0),
        otherPlus: f2(d.Others_A       || 0),
        otherSub:  f2(d.Others_D       || 0),
        tcsPer:    '0',
      });

      const rows = (d.PurchaseDetails || []).map(p => {
        const base = {
          _id: `row_${++rowCounter}`,
          id: p.PDId || 0,
          ProductCode:     p.ProductCode    || '',
          ProductName:     p.ProductName    || '',
          ProductRefId:    p.ProductRefId   || 0,
          HSNCode:         p.HSNCode        || '',
          UOM:             p.UOM            || '',
          UOMDecimal:      p.UOMDecimal     || 2,
          MRP:             f2(p.MRP         || 0),
          PurchaseRate:    f2(p.PurchaseRate|| 0),
          StockQty:        f2(p.StockQty    || 0),
          ItemQty:         f2(p.ItemQty     || 0),
          FreeQty:         f2(p.FreeQty     || 0),
          Noms:            '0',
          CDPercent:       f2(p.CDPercent   || 0),
          CDAmount:        f2(p.CDAmount    || 0),
          DiscountPercent: f2(p.DiscountPercent||0),
          DiscountAmt:     f2(p.DiscountAmt || 0),
          TaxPercent:      f2(p.TaxPercent  || 0),
          TaxAmt:          f2(p.TaxAmt      || 0),
          CESSPer:         f2(p.CESSPer     || 0),
          CESSAmount:      f2(p.CESSAmount  || 0),
          TransPer:        '0', TransAmt: '0.00',
          LandingCost:     f2(p.LandingCost || 0),
          Amount:          f2(p.Amount      || 0),
          SalesRate:       f2(p.SalesRate   || p.Salerate || 0),
          WholeSaleRate:   f2(p.WholeSaleRate||0),
          ProfitPer:       f2(p.ProfitPer   || 0),
          ProfitAmt:       f2(p.ProfitAmt   || 0),
          SaleDiscountPer: f2(p.SaleDiscountPer||0),
          CTAmount:        f2(p.CTAmount    || 0),
          STAmount:        f2(p.STAmount    || 0),
          ProductTotal:    f2(p.ProductTotal|| p.Amount || 0),
          BatchNo:         p.BatchNo        || '',
          EditMode:        0,
        };
        return calcItem(base, isIgst);
      });

      setItems([...rows, newRow()]);
      setEditMode(true);
      setEditId(id);
    } catch (e) { showToast('Load error: ' + e.message, 'error'); }
    setLoading(false);
  }, []);

  // ─── Clear / New ─────────────────────────────────────────────────────────
  const handleClear = useCallback(async () => {
    setEditMode(false); setEditId(0);
    setSupplierId(0);
    setSupInfo({ Address:'', City:'', ContactNo:'', Balance:0, CurrentStock:0, IGSTBill:'GST', CreditDays:0 });
    setInvoiceNo(''); setInvoiceAmt(''); setInvoiceDate(today());
    setPurchaseDate(today()); setDueDate(today());
    setPurchaseType('CREDIT'); setIgst(false); setRemarks('');
    setOverrides({ transAmt:'', otherPlus:'', otherSub:'', tcsPer:'0' });
    setItems([newRow()]);
    try {
      const r = await PurchaseApi.getNextPurchaseNo();
      if (r.ok) setPurchaseNo(r.purchaseNo);
    } catch {}
  }, []);

  // ─── Global keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const onKey = e => {
      if (prodModal.open || confirmDlg || showF5) return; // modals eat shortcuts
      if (e.key === 'F1') { e.preventDefault(); handleSave(); }
      if (e.key === 'F5') { e.preventDefault(); setShowF5(true); }
      if (e.key === 'F9') { e.preventDefault(); handleDelete(); }
      if (e.key === 'Escape') { e.preventDefault(); handleClear(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prodModal.open, confirmDlg, showF5, handleSave, handleDelete, handleClear]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  const balColor = supInfo.Balance < 0 ? '#dc2626' : supInfo.Balance > 0 ? '#16a34a' : '#888';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', fontFamily:"'DM Sans',sans-serif", fontSize:12, background:'#f0f4ff', overflow:'hidden' }}>

      {/* ═══ TOP BAR ═══════════════════════════════════════════════════════ */}
      <div style={{ background:'#1f65de', color:'white', height:44, display:'flex', alignItems:'center', padding:'0 14px', gap:12, flexShrink:0, boxShadow:'0 2px 6px rgba(31,101,222,0.35)', zIndex:100 }}>
        <span style={{ fontWeight:700, fontSize:15 }}>KassaPOS</span>
        <span style={{ fontSize:12.5, opacity:0.9 }}>{localStorage.getItem('CompanyName') || 'KASSAPOS SOFTWARE SOLUTIONS'}</span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12 }}>Bill Amount:</span>
          <span style={{ fontWeight:700, fontSize:14, fontFamily:'monospace', background:'rgba(255,255,255,0.15)', padding:'2px 10px', borderRadius:4 }}>
            Rs.{totals.netAmt}
          </span>
          {editMode && (
            <span style={{ background:'rgba(255,200,0,0.25)', border:'1px solid rgba(255,200,0,0.4)', padding:'2px 9px', borderRadius:4, fontSize:11.5, color:'#ffe066', fontWeight:600 }}>
              ✏️ EDIT MODE
            </span>
          )}
        </div>
      </div>

      {/* ═══ SCROLLABLE PAGE ════════════════════════════════════════════════ */}
      <div style={{ flex:1, overflow:'auto', padding:'6px 8px', display:'flex', flexDirection:'column', gap:6 }}>

        {/* ── ROW 1: Purchase Info | Supplier Info | Invoice Info ── */}
        <div style={{ display:'flex', gap:6 }}>

          {/* Purchase Info */}
          <div style={{ background:'white', border:'1px solid #dde5f5', borderRadius:6, flex:'0 0 310px', boxShadow:'0 1px 3px rgba(31,101,222,0.07)' }}>
            <div style={{ background:'#1f65de', color:'white', padding:'5px 10px', fontWeight:600, fontSize:11.5, borderRadius:'6px 6px 0 0' }}>📋 Purchase Info</div>
            <div style={{ padding:'8px 10px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'5px 8px' }}>
              <LF label="Purchase No">
                <input style={FS.inputRO} value={purchaseNo} readOnly />
              </LF>
              <LF label="Purchase Date">
                <input type="date" style={FS.input} value={purchaseDate}
                  onChange={e => { setPurchaseDate(e.target.value); setDueDate(addDays(e.target.value, supInfo.CreditDays)); }} />
              </LF>
              <LF label="Purchase Type">
                <select style={FS.select} value={purchaseType} onChange={e => setPurchaseType(e.target.value)}>
                  <option value="CREDIT">CREDIT</option>
                  <option value="CASH">CASH</option>
                  <option value="IMPORT">IMPORT</option>
                </select>
              </LF>
              <LF label="Due Date">
                <input type="date" style={FS.input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </LF>
            </div>
          </div>

          {/* Supplier Info */}
          <div style={{ background:'white', border:'1px solid #dde5f5', borderRadius:6, flex:1, boxShadow:'0 1px 3px rgba(31,101,222,0.07)' }}>
            <div style={{ background:'#1f65de', color:'white', padding:'5px 10px', fontWeight:600, fontSize:11.5, borderRadius:'6px 6px 0 0' }}>🏭 Supplier Info</div>
            <div style={{ padding:'8px 10px' }}>
              <LF label="Supplier Name">
                <select style={{ ...FS.select, width:'100%', height:28 }} value={supplierId} onChange={e => handleSupplierChange(e.target.value)}>
                  <option value={0}>Select SupplierName</option>
                  {suppliers.map(s => <option key={s.Id} value={s.Id}>{s.AccountName}</option>)}
                </select>
              </LF>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 8px', marginTop:4 }}>
                <LF label="Address">
                  <input style={FS.inputRO} value={supInfo.Address} readOnly />
                </LF>
                <LF label="City">
                  <input style={FS.inputRO} value={supInfo.City} readOnly />
                </LF>
                <LF label="ContactNo">
                  <input style={FS.inputRO} value={supInfo.ContactNo} readOnly />
                </LF>
                <LF label="Current Balance">
                  <input style={{ ...FS.inputRO, color: balColor, fontWeight:700, fontFamily:'monospace' }}
                    value={f2(supInfo.Balance)} readOnly />
                </LF>
              </div>
            </div>
          </div>

          {/* Invoice + Bill Amount */}
          <div style={{ background:'white', border:'1px solid #dde5f5', borderRadius:6, flex:'0 0 270px', boxShadow:'0 1px 3px rgba(31,101,222,0.07)' }}>
            <div style={{ background:'#1f65de', color:'white', padding:'5px 10px', fontWeight:600, fontSize:11.5, borderRadius:'6px 6px 0 0' }}>🧾 Invoice Info</div>
            <div style={{ padding:'8px 10px', display:'flex', flexDirection:'column', gap:5 }}>
              {/* Bill amount display */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#e8f0fd', borderRadius:4, padding:'4px 8px', marginBottom:2 }}>
                <span style={{ fontSize:11.5, color:'#1750b8', fontWeight:600 }}>Bill Amount</span>
                <span style={{ fontFamily:'monospace', fontWeight:700, fontSize:14, color:'#16a34a' }}>Rs.{totals.netAmt}</span>
              </div>
              <LF label="Invoice No">
                <input style={FS.input} value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="Supplier Invoice No" />
              </LF>
              <LF label="Invoice Date">
                <input type="date" style={FS.input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </LF>
              <LF label="Invoice Amount">
                <input style={{ ...FS.input, textAlign:'right', fontFamily:'monospace' }}
                  value={invoiceAmt} onChange={e => setInvoiceAmt(e.target.value)} placeholder="0.00" />
              </LF>
            </div>
          </div>
        </div>

        {/* ── PRODUCT GRID ── */}
        <div style={{ background:'white', border:'1px solid #dde5f5', borderRadius:6, boxShadow:'0 1px 3px rgba(31,101,222,0.07)' }}>
          {/* Grid header */}
          <div style={{ background:'#1f65de', color:'white', padding:'5px 10px', fontWeight:600, fontSize:11.5, borderRadius:'6px 6px 0 0', display:'flex', alignItems:'center', gap:10 }}>
            📦 Products
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
              {['exclusive','inclusive'].map(m => (
                <label key={m} style={{ display:'flex', alignItems:'center', gap:3, cursor:'pointer', fontSize:11.5,
                  color: taxMode===m ? 'white' : 'rgba(255,255,255,0.6)' }}>
                  <input type="radio" name="taxMode" value={m} checked={taxMode===m}
                    onChange={() => setTaxMode(m)} style={{ accentColor:'white' }} />
                  {m.charAt(0).toUpperCase()+m.slice(1)}
                </label>
              ))}
              <label style={{ display:'flex', alignItems:'center', gap:3, cursor:'pointer', color:'white', fontSize:11.5 }}>
                <input type="checkbox" checked={igst} onChange={e => setIgst(e.target.checked)} style={{ accentColor:'white' }} />
                IGST
              </label>
              <span style={{ background:'rgba(255,255,255,0.2)', borderRadius:10, padding:'2px 9px', fontSize:11, color:'white', fontWeight:600 }}>
                Total Item Qty : {totals.totalQty}
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflow:'auto', maxHeight:255 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
              <colgroup>
                <col style={{ width:42 }} />
                {COLS.map(c => <col key={c.key} style={{ width:c.w }} />)}
                <col style={{ width:34 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={TH}>S.No</th>
                  {COLS.map(c => <th key={c.key} style={{ ...TH, textAlign:c.align }}>{c.label}</th>)}
                  <th style={TH}>Del</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item._id} style={{ background:item.EditMode?'#eefaf1':'white', borderBottom:'1px solid #f0f4ff' }}>
                    <td style={{ ...TD, textAlign:'center', color:'#8099be', fontSize:11 }}>{idx+1}</td>

                    {COLS.map(col => (
                      <td key={col.key} style={{ ...TD, padding:'1px 3px' }}>
                        {col.editable ? (
                          <input
                            ref={setRef(idx, col.key)}
                            style={{ width:'100%', height:22, padding:'0 3px',
                              border:'1px solid #dde5f5', borderRadius:2, fontSize:11.5, outline:'none',
                              textAlign: col.align, fontFamily: col.align==='left' ? 'inherit' : 'monospace',
                              background:'white', color:'#1a2b4a' }}
                            value={item[col.key] ?? ''}
                            onFocus={e => {
                              e.target.select();
                              e.target.style.borderColor = '#1f65de';
                              e.target.style.boxShadow  = '0 0 0 2px rgba(31,101,222,0.15)';
                            }}
                            onBlur={e => {
                              e.target.style.borderColor = '#dde5f5';
                              e.target.style.boxShadow  = 'none';
                              if (col.type === 'num') {
                                handleItemChange(idx, col.key, e.target.value);
                              }
                            }}
                            onChange={e => handleItemChange(idx, col.key, e.target.value)}
                            onKeyDown={e => handleCellKey(e, idx, col.key)}
                          />
                        ) : (
                          <span style={{ display:'block', textAlign:col.align, fontFamily:'monospace', fontSize:11.5, padding:'2px 4px', color:'#4a6080' }}>
                            {item[col.key]}
                          </span>
                        )}
                      </td>
                    ))}

                    <td style={{ ...TD, textAlign:'center' }}>
                      <button onClick={() => deleteRow(idx)}
                        style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:13, lineHeight:1, opacity:0.7, padding:'1px 4px' }}
                        title="Delete row">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grid footer */}
          <div style={{ padding:'5px 8px', display:'flex', alignItems:'center', gap:8, borderTop:'1px solid #dde5f5', background:'#fafcff' }}>
            <button
              style={{ background:'#e8f0fd', border:'1px dashed #1f65de', color:'#1f65de', borderRadius:3, padding:'3px 10px', fontSize:11.5, cursor:'pointer', fontWeight:600 }}
              onClick={() => setItems(p => [...p, newRow()])}>
              ＋ Add Row
            </button>
            <button
              style={{ background:'none', border:'none', color:'#8099be', fontSize:11, cursor:'pointer' }}
              onClick={() => setProdModal({ open:true, rowIdx: items.length-1, query:'' })}>
              🔍 Search Product
            </button>
            <span style={{ marginLeft:'auto', fontSize:11, color:'#8099be' }}>
              {items.filter(i=>i.ProductCode).length} item(s) &nbsp;|&nbsp;
              Go to page: 1 &nbsp; Show rows: 15 &nbsp; {items.filter(i=>i.ProductCode).length}-{items.filter(i=>i.ProductCode).length} of {items.filter(i=>i.ProductCode).length}
            </span>
          </div>
        </div>

        {/* ── BOTTOM: GST Summary | Amount Summary ── */}
        <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>

          {/* Left: Remarks + GST */}
          <div style={{ background:'white', border:'1px solid #dde5f5', borderRadius:6, flex:'0 0 330px', boxShadow:'0 1px 3px rgba(31,101,222,0.07)' }}>
            <div style={{ background:'#1f65de', color:'white', padding:'5px 10px', fontWeight:600, fontSize:11.5, borderRadius:'6px 6px 0 0' }}>📊 GST Summary</div>
            <div style={{ padding:'6px 8px' }}>
              {/* Tax mode badges + remarks */}
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6 }}>
                <label style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, cursor:'pointer' }}>
                  <input type="radio" name="taxMode2" value="exclusive" checked={taxMode==='exclusive'} onChange={()=>setTaxMode('exclusive')} style={{ accentColor:'#1f65de' }} />
                  Exclusive
                </label>
                <label style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, cursor:'pointer' }}>
                  <input type="radio" name="taxMode2" value="inclusive" checked={taxMode==='inclusive'} onChange={()=>setTaxMode('inclusive')} style={{ accentColor:'#1f65de' }} />
                  Inclusive
                </label>
              </div>
              <input style={{ ...FS.input, width:'100%', textTransform:'uppercase', marginBottom:6 }}
                placeholder="Remarks..." value={remarks} onChange={e=>setRemarks(e.target.value.toUpperCase())} />

              {/* GST table */}
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
                <thead>
                  <tr style={{ background:'#1f65de', color:'white' }}>
                    <th style={{ padding:'4px 6px', textAlign:'center', fontWeight:500 }}>GST %</th>
                    <th style={{ padding:'4px 6px', textAlign:'right', fontWeight:500 }}>GST Amt</th>
                    <th style={{ padding:'4px 6px', textAlign:'right', fontWeight:500 }}>CGST Amt</th>
                    <th style={{ padding:'4px 6px', textAlign:'right', fontWeight:500 }}>SGST Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {gstRows.length === 0 && (
                    <tr><td colSpan={4} style={{ padding:10, textAlign:'center', color:'#aaa', fontSize:11 }}>No data to display</td></tr>
                  )}
                  {gstRows.map(r => (
                    <tr key={r.gstPer} style={{ borderBottom:'1px solid #dde5f5' }}>
                      <td style={{ padding:'3px 6px', textAlign:'center', fontWeight:600 }}>{r.gstPer}%</td>
                      <td style={{ padding:'3px 6px', textAlign:'right', fontFamily:'monospace' }}>{f2(r.gstAmt)}</td>
                      <td style={{ padding:'3px 6px', textAlign:'right', fontFamily:'monospace' }}>{f2(r.cgst)}</td>
                      <td style={{ padding:'3px 6px', textAlign:'right', fontFamily:'monospace' }}>{f2(r.sgst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Amount Summary */}
          <div style={{ background:'white', border:'1px solid #dde5f5', borderRadius:6, flex:1, boxShadow:'0 1px 3px rgba(31,101,222,0.07)' }}>
            <div style={{ background:'#1f65de', color:'white', padding:'5px 10px', fontWeight:600, fontSize:11.5, borderRadius:'6px 6px 0 0' }}>💵 Amount Summary</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderTop:'1px solid #dde5f5' }}>

              {/* Col 1 */}
              <div style={{ borderRight:'1px solid #dde5f5' }}>
                <AR label="Gross Amt"   value={totals.grossAmt} />
                <AR label="Trans Amt"   value={overrides.transAmt}  editable onChange={v=>setOverrides(p=>({...p,transAmt:v}))} />
                <AR label="Display Amt" value={totals.displayAmt} />
              </div>

              {/* Col 2 */}
              <div style={{ borderRight:'1px solid #dde5f5' }}>
                <AR label="CD Amt"   value={totals.cdAmt} />
                <AR label="Disc Amt" value={totals.discAmt} />
                <AR label="CESS Amt" value={totals.cessAmt} />
              </div>

              {/* Col 3 */}
              <div style={{ borderRight:'1px solid #dde5f5' }}>
                <AR label="CGST Amt" value={igst?'0.00':totals.cgstAmt} />
                <AR label="SGST Amt" value={igst?'0.00':totals.sgstAmt} />
                <AR label="GST Amt"  value={totals.gstAmt} />
              </div>

              {/* Col 4 */}
              <div>
                <AR label="Others (+)" value={overrides.otherPlus} editable onChange={v=>setOverrides(p=>({...p,otherPlus:v}))} />
                <AR label="Others (-)" value={overrides.otherSub}  editable onChange={v=>setOverrides(p=>({...p,otherSub:v}))} />
                <AR label="Net Total"  value={totals.netAmt} highlight />
              </div>
            </div>
          </div>
        </div>

      </div>{/* end scrollable page */}

      {/* ═══ SHORTCUTS BAR ══════════════════════════════════════════════════ */}
      <div style={{ background:'#e8e8e8', borderTop:'1px solid #ccc', padding:'3px 10px', display:'flex', flexShrink:0, alignItems:'center', gap:10, flexWrap:'wrap' }}>
        {[['F1','Save'],['F2','Free Product'],['F3','Edit'],['F5','View'],['F9','Delete'],['DEL','Delete'],['ESC','Exit']].map(([k,l]) => (
          <span key={k} style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:'#555' }}>
            <span style={{ background:'#e8f0fd', border:'1px solid #c5d9f9', color:'#1750b8', fontFamily:'monospace', fontWeight:700, fontSize:10, padding:'1px 5px', borderRadius:3 }}>{k}</span>
            {l} &nbsp;|
          </span>
        ))}
        {/* Action buttons */}
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <button style={{ ...FS.btnP, height:26, padding:'0 12px', fontSize:11 }} onClick={handleSave}>
            💾 {editMode?'Update':'Save'}
          </button>
          <button style={{ ...FS.btnSec, height:26, padding:'0 10px', fontSize:11 }} onClick={() => setShowF5(true)}>
            📋 View
          </button>
          <button style={{ ...FS.btnDanger, height:26, padding:'0 10px', fontSize:11, opacity:editMode?1:0.4, cursor:editMode?'pointer':'not-allowed' }}
            onClick={handleDelete} disabled={!editMode}>
            🗑 Delete
          </button>
          <button style={{ ...FS.btnSec, height:26, padding:'0 10px', fontSize:11 }} onClick={handleClear}>
            🔄 New
          </button>
        </div>
      </div>

      {/* ═══ MODALS ════════════════════════════════════════════════════════ */}
      <ProductSearchModal
        open={prodModal.open}
        rowIdx={prodModal.rowIdx}
        initialQuery={prodModal.query}
        onClose={() => setProdModal({ open:false, rowIdx:0, query:'' })}
        onSelect={applyProduct}
      />

      {showF5 && (
        <F5ViewModal
          suppliers={suppliers}
          onClose={() => setShowF5(false)}
          onEditLoad={handleEditLoad}
        />
      )}

      {confirmDlg && (
        <ConfirmDialog
          msg={confirmDlg.msg}
          onYes={confirmDlg.onYes}
          onNo={() => setConfirmDlg(null)}
        />
      )}

      {/* Spinner */}
      {loading && (
        <div style={{ position:'fixed', inset:0, background:'rgba(31,101,222,0.06)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(1px)' }}>
          <div style={{ width:38, height:38, border:'3px solid #c5d9f9', borderTopColor:'#1f65de', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
        </div>
      )}

      <ToastHost />

      {/* Global CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=text]:focus,input[type=number]:focus,input[type=date]:focus,select:focus {
          border-color: #1f65de !important;
          box-shadow: 0 0 0 2px rgba(31,101,222,0.15) !important;
          outline: none;
        }
        input[type=radio], input[type=checkbox] { cursor: pointer; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #c5d9f9; border-radius: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        /* remove number input arrows */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini helper components
// ─────────────────────────────────────────────────────────────────────────────

/** Label + Field wrapper */
function LF({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <label style={FS.label}>{label}</label>
      {children}
    </div>
  );
}

/** Amount Row */
function AR({ label, value, editable, onChange, highlight }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'3px 7px', borderBottom:'1px solid #f0f4ff', fontSize:12,
      background: highlight ? '#e8f0fd' : 'white' }}>
      <span style={{ color: highlight?'#1f65de':'#4a6080', fontWeight: highlight?700:'normal' }}>{label}</span>
      {editable ? (
        <input
          style={{ width:90, height:20, padding:'0 4px', border:'1px solid #dde5f5', borderRadius:2,
            fontSize:11.5, fontFamily:'monospace', textAlign:'right', background:'white', outline:'none' }}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
        />
      ) : (
        <span style={{ fontFamily:'monospace', fontWeight:highlight?700:600,
          color:highlight?'#1f65de':'#1a2b4a', fontSize:highlight?13:12 }}>
          {value}
        </span>
      )}
    </div>
  );
}

// Table header / data cell base styles
const TH = {
  background:'#1f65de', color:'white', padding:'4px 5px', fontWeight:500, fontSize:11,
  textAlign:'center', position:'sticky', top:0, zIndex:2, whiteSpace:'nowrap',
  borderRight:'1px solid rgba(255,255,255,0.12)',
};
const TD = {
  padding:'2px 4px', borderBottom:'1px solid #f0f4ff', borderRight:'1px solid #f0f4ff',
};