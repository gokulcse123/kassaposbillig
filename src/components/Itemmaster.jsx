import { useState, useRef, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────
//  COLUMN DEFINITIONS  (mirrors JS InVisibleColumns)
// ─────────────────────────────────────────────
const COLUMNS = [
  { key: "ProductCode",      label: "Product Code",     width: 150, pinned: true  },
  { key: "SecondCode",       label: "Second Code",      width: 150, pinned: true  },
  { key: "ProductName",      label: "Description",      width: 200, pinned: true  },
  { key: "PrinterName",      label: "Printer Name",     width: 200 },
  { key: "HSNCode",          label: "HSN Code",         width: 100 },
  { key: "Brand",            label: "Brand",            width: 200 },
  { key: "Category",         label: "Category",         width: 200 },
  { key: "Department",       label: "Department",       width: 200 },
  { key: "Supplier",         label: "Supplier",         width: 200 },
  { key: "UOM",              label: "UOM",              width: 200 },
  { key: "LocationMaster",   label: "Location",         width: 200 },
  { key: "NomsQty",          label: "Noms Qty",         width: 100, type: "int"   },
  { key: "MRP",              label: "MRP",              width: 100, type: "float2"},
  { key: "DMPer",            label: "DM%",              width: 100, type: "float2", calc: true },
  { key: "DMAmt",            label: "DM Amt",           width: 100, type: "float2", calc: true },
  { key: "PurchaseRate",     label: "Purchase Rate",    width: 120, type: "float2"},
  { key: "GST",              label: "GST%",             width: 100, type: "float2"},
  { key: "GSTAmt",           label: "GST Amt",          width: 100, type: "float2", calc: true },
  { key: "TransPer",         label: "Transport%",       width: 110, type: "float2"},
  { key: "TransAmt",         label: "Transport Amt",    width: 120, type: "float2", calc: true },
  { key: "CESS",             label: "CESS%",            width: 100, type: "float2"},
  { key: "CESSAmt",          label: "CESS Amt",         width: 100, type: "float2", calc: true },
  { key: "SPLCESS",          label: "SPL CESS",         width: 100, type: "float2"},
  { key: "LandingCost",      label: "Landing Cost",     width: 120, type: "float2", calc: true },
  { key: "ProfitPer",        label: "Profit%",          width: 100, type: "float2"},
  { key: "ProfitAmt",        label: "Profit Amt",       width: 100, type: "float2", calc: true },
  { key: "SalesRate",        label: "Sale Rate",        width: 100, type: "float2"},
  { key: "CardRate",         label: "Card Rate",        width: 100, type: "float2"},
  { key: "WholeSaleRate",    label: "Whole Sale Rate",  width: 130, type: "float2"},
  { key: "NomsPCRate",       label: "Noms PC Rate",     width: 120, type: "float2"},
  { key: "SalesRateType",    label: "Fixed Rate",       width: 100, bool: true    },
  { key: "SaleDiscountPer",  label: "Sale Disc%",       width: 100, type: "float2"},
  { key: "SaleDiscountAmt",  label: "Sale Disc Amt",    width: 130, type: "float2"},
  { key: "ReorderLevelMin",  label: "Reorder Min",      width: 110, type: "float2"},
  { key: "ReorderLevelMax",  label: "Reorder Max",      width: 110, type: "float2"},
  { key: "MaxSaleQty",       label: "Max Sale Qty",     width: 110, type: "float2"},
  { key: "LessAmt",          label: "Less Amt",         width: 100, type: "float2"},
  { key: "StockNeed",        label: "Stock Need",       width: 100, bool: true    },
  { key: "ExpriyDate",       label: "Expiry Date",      width: 110, bool: true    },
  { key: "OnlineShow",       label: "Online Show",      width: 110, bool: true    },
  { key: "ExpriyDays",       label: "Expiry Days",      width: 110, type: "int"   },
  { key: "ExpiryBeforeDays", label: "Exp Before Days",  width: 130, type: "int"   },
  { key: "Repacking",        label: "Repacking",        width: 105, bool: true    },
  { key: "NetWeight",        label: "Net Weight",       width: 105, type: "float3"},
  { key: "BrandType",        label: "Brand Type",       width: 110, bool: true    },
  { key: "ModelType",        label: "Model Type",       width: 110, bool: true    },
  { key: "ColorType",        label: "Color Type",       width: 105, bool: true    },
  { key: "SizeType",         label: "Size Type",        width: 100, bool: true    },
  { key: "GenderType",       label: "Gender Type",      width: 110, bool: true    },
  { key: "SerialNoType",     label: "Serial No Type",   width: 125, bool: true    },
  { key: "CRMPoints",        label: "CRM Points",       width: 110, type: "float2"},
  { key: "NegativetStock",   label: "Neg Stock",        width: 110, bool: true    },
  { key: "BatchwiseStock",   label: "Batchwise Stock",  width: 120, bool: true    },
  { key: "Remarks",          label: "Remarks",          width: 150 },
  { key: "Active",           label: "Active",           width: 80,  bool: true    },
  { key: "ManufactureDate",  label: "Mfg Date",         width: 110, bool: true    },
  { key: "EditMode",         label: "Edit Mode",        width: 100, hiddenByDefault: true },
];

const DEFAULT_COLUMNS = COLUMNS.map(c => ({ ...c, visible: !c.hiddenByDefault }));
const SNO_WIDTH     = 50;
const ROWS_PER_PAGE = 20;
const EMPTY_FORM    = COLUMNS.reduce((a, c) => {
  a[c.key] = c.bool ? false : "";
  return a;
}, {});

// ─────────────────────────────────────────────
//  UTILITY  (mirrors JS helpers: ValNum, roundoff, toFixed)
// ─────────────────────────────────────────────
const valNum   = v => parseFloat(v) || 0;
const roundOff = v => Math.round(v * 100) / 100;
const toFixed2 = v => parseFloat(valNum(v).toFixed(2));
const toFixed3 = v => parseFloat(valNum(v).toFixed(3));

// ─────────────────────────────────────────────
//  CALCULATION ENGINE  (mirrors JS calcution())
//  Called whenever Purchase Rate, GST, CESS,
//  TransPer, MRP, or ProfitPer changes
// ─────────────────────────────────────────────
function calcDerivedFields(f) {
  const PR   = valNum(f.PurchaseRate);
  const GST  = valNum(f.GST);
  const CESS = valNum(f.CESS);
  const TP   = valNum(f.TransPer);
  const MRP  = valNum(f.MRP);
  const PP   = valNum(f.ProfitPer);

  const GSTAmt    = roundOff(PR * (GST  / 100));
  const CessAmt   = roundOff(PR * (CESS / 100));
  const TransAmt  = roundOff(PR * (TP   / 100));
  const LandingCost = roundOff(PR + GSTAmt + CessAmt + TransAmt);
  const DealerAmt = roundOff(MRP - LandingCost);
  const DealerPer = MRP > 0 ? roundOff((DealerAmt / MRP) * 100) : 0;
  const ProfitAmt = roundOff((LandingCost * PP) / 100);

  // Sale Rate: if ProfitAmt exists → LC + ProfitAmt, else MRP
  const SalesRate = ProfitAmt !== 0
    ? toFixed2(LandingCost + ProfitAmt)
    : (valNum(f.SalesRate) || toFixed2(MRP));

  return {
    GSTAmt:      toFixed2(GSTAmt),
    CESSAmt:     toFixed2(CessAmt),
    TransAmt:    toFixed2(TransAmt),
    LandingCost: toFixed2(LandingCost),
    DMAmt:       toFixed2(DealerAmt),
    DMPer:       toFixed2(DealerPer),
    ProfitAmt:   toFixed2(ProfitAmt),
    SalesRate,
  };
}

// Mirror JS grdSalesRate Enter handler — recalc ProfitPer from SalesRate
function calcFromSaleRate(f) {
  const LC = valNum(f.LandingCost);
  const SR = valNum(f.SalesRate);
  let DM = SR - LC;
  const DPer = (DM > 0 && LC > 0) ? roundOff((DM / LC) * 100) : 0;
  return { ...f, ProfitPer: toFixed2(DPer) };
}

// Mirror JS grdProfitAmt Enter handler — recalc ProfitPer from ProfitAmt
function calcFromProfitAmt(f) {
  const LC = valNum(f.LandingCost);
  const PA = valNum(f.ProfitAmt);
  const PP = LC > 0 ? toFixed2((PA / LC) * 100) : 0;
  return { ...f, ProfitPer: PP };
}

// ─────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  html,body,#root{height:100%;margin:0;padding:0;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;font-family:'Inter',sans-serif;}
  .im-root{height:100vh;display:flex;flex-direction:column;overflow:hidden;background:#eef1f7;font-size:12.5px;}

  /* HEADER */
  .im-header{background:#1a2e4a;display:flex;align-items:stretch;flex-shrink:0;height:48px;box-shadow:0 3px 10px rgba(0,0,0,.25);}
  .im-brand{background:#e8a020;display:flex;align-items:center;padding:0 16px;gap:8px;min-width:160px;}
  .im-brand-icon{width:28px;height:28px;border-radius:6px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#e8a020;flex-shrink:0;}
  .im-brand-text{display:flex;flex-direction:column;line-height:1.2;}
  .im-brand-name{font-size:13px;font-weight:700;color:#fff;}
  .im-brand-sub{font-size:9px;font-weight:600;color:rgba(255,255,255,.75);letter-spacing:1.5px;text-transform:uppercase;}
  .im-header-title{flex:1;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;letter-spacing:.5px;}
  .im-user-block{display:flex;align-items:center;gap:10px;padding:0 16px;border-left:1px solid rgba(255,255,255,.1);}
  .im-avatar{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.15);border:2px solid rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:15px;}
  .im-user-name{font-size:12px;font-weight:600;color:#fff;}
  .im-user-role{font-size:10px;color:rgba(255,255,255,.55);}

  /* CONTENT */
  .im-content{flex:1;display:flex;flex-direction:column;gap:6px;padding:8px 12px;overflow:hidden;min-height:0;}
  .im-titlebar{background:#fff;border:1px solid #d4dbe8;border-left:4px solid #e8a020;border-radius:5px;display:flex;align-items:center;justify-content:space-between;padding:5px 12px;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.06);}
  .im-titlebar-text{color:#1a2e4a;font-size:13px;font-weight:700;}
  .im-page-btn{width:24px;height:24px;border:1px solid #d4dbe8;background:#fff;border-radius:4px;cursor:pointer;font-size:11px;color:#1a2e4a;display:flex;align-items:center;justify-content:center;transition:all .15s;font-weight:600;}
  .im-page-btn:hover{background:#fef3e0;border-color:#e8a020;color:#e8a020;}
  .im-page-btn.active{background:#e8a020;color:#fff;border-color:#e8a020;}
  .val-err{background:#fff0f0;border:1px solid #f5c2c7;border-radius:4px;padding:2px 10px;font-size:10px;color:#842029;font-weight:600;}

  /* FILTER */
  .im-filter-row{background:#fff;border:1px solid #d4dbe8;border-radius:5px;padding:5px 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,.04);}
  .im-filter-label{font-size:10px;font-weight:600;color:#6b7a99;margin-right:3px;}
  .im-filter-row input{border:1px solid #d4dbe8;border-radius:3px;padding:3px 7px;font-size:11px;height:24px;outline:none;}
  .im-filter-row input:focus{border-color:#e8a020;box-shadow:0 0 0 2px rgba(232,160,32,.15);}

  /* SYNC OUTER */
  .im-sync-outer{flex:1;min-height:0;display:flex;flex-direction:column;border:1px solid #d4dbe8;border-radius:5px;background:#fff;overflow:hidden;box-shadow:0 1px 5px rgba(0,0,0,.07);}
  .im-form-scroll{overflow-x:hidden;overflow-y:hidden;flex-shrink:0;background:linear-gradient(180deg,#fff8ee 0%,#fef0d6 100%);border-bottom:2px solid #e8a020;}
  .im-form-strip{display:flex;align-items:flex-end;padding:5px 0;width:max-content;}
  .im-sno-ph{flex-shrink:0;}
  .im-form-cell{display:flex;flex-direction:column;gap:2px;padding:0 3px;flex-shrink:0;}
  .im-form-cell label{font-size:10px;color:#7a5000;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .im-form-cell input,.im-form-cell select{border:1px solid #f0c870;border-radius:3px;padding:2px 5px;font-size:11px;color:#1a2e4a;background:#fff;outline:none;height:24px;width:100%;transition:border-color .15s;}
  .im-form-cell input:focus,.im-form-cell select:focus{border-color:#e8a020;box-shadow:0 0 0 2px rgba(232,160,32,.2);}
  .im-form-cell input.calc-field{background:#eef7ff;border-color:#b3d4f5;color:#1055a0;font-weight:600;}

  /* GRID */
  .im-grid-scroll{flex:1;overflow:auto;min-height:0;cursor:grab;}
  .im-grid-scroll:active{cursor:grabbing;}
  .im-table{border-collapse:collapse;table-layout:fixed;}
  .im-table thead tr{position:sticky;top:0;z-index:3;}
  .im-table th{background:#1a2e4a;color:#fff;border:1px solid #253d5e;padding:5px 7px;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;user-select:none;}
  .im-table th:first-child{background:#152540;}
  .im-table td{border:1px solid #eaecf4;padding:3px 7px;font-size:11px;color:#1a2e4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .im-table tbody tr{cursor:pointer;transition:background .08s;}
  .im-table tbody tr:hover{background:#fef3e0;}
  .im-table tbody tr.sel-row{background:#fddfa0 !important;}
  .im-table tbody tr.inactive-row td{color:#bbb;}
  .im-table tbody tr.edited-row td:first-child{border-left:3px solid #e8a020;}
  .im-table tbody tr:nth-child(even){background:#f5f7fc;}
  .im-table tbody tr:nth-child(even).sel-row{background:#fddfa0 !important;}
  .im-sno-col{text-align:center;color:#8b99b5;}
  .im-empty-td{text-align:center;color:#b0bbd4;padding:40px 0;font-size:12px;}
  .bool-yes{background:#d1fae5;color:#065f46;border-radius:3px;padding:1px 6px;font-size:10px;font-weight:700;}
  .bool-no{background:#fee2e2;color:#991b1b;border-radius:3px;padding:1px 6px;font-size:10px;font-weight:700;}

  /* FOOTER */
  .im-footer{background:#fff;border-top:2px solid #d4dbe8;padding:5px 12px;display:flex;align-items:center;gap:2px;flex-wrap:wrap;flex-shrink:0;}
  .fn-btn{display:flex;align-items:center;gap:4px;background:none;border:1px solid transparent;cursor:pointer;font-size:11px;color:#4a5568;padding:3px 8px;border-radius:4px;transition:all .12s;font-weight:500;}
  .fn-btn:hover{background:#fef3e0;color:#e8a020;border-color:#f0c870;}
  .fn-save{color:#1a2e4a;font-weight:700;}
  .fn-save:hover{background:#1a2e4a !important;color:#fff !important;border-color:#1a2e4a !important;}
  .fn-delete{color:#dc3545;}
  .fn-delete:hover{background:#dc3545 !important;color:#fff !important;border-color:#dc3545 !important;}
  .fn-excel{color:#198754;}
  .fn-excel:hover{background:#198754 !important;color:#fff !important;border-color:#198754 !important;}
  .fn-new{color:#6f42c1;}
  .fn-new:hover{background:#6f42c1 !important;color:#fff !important;border-color:#6f42c1 !important;}
  .fn-col-settings{color:#0d6efd;}
  .fn-col-settings:hover{background:#0d6efd !important;color:#fff !important;border-color:#0d6efd !important;}
  .fn-sep{color:#d4dbe8;font-size:14px;padding:0 2px;}

  /* COLUMN SETTINGS POPUP */
  .cs-overlay{position:fixed;inset:0;background:rgba(10,20,40,.55);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;z-index:1000;animation:cs-fade .15s ease;}
  @keyframes cs-fade{from{opacity:0}to{opacity:1}}
  .cs-modal{background:#fff;width:680px;max-height:82vh;border-radius:10px;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,.25);overflow:hidden;animation:cs-slide .18s ease;}
  @keyframes cs-slide{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
  .cs-header{background:#1a2e4a;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .cs-header-left{display:flex;align-items:center;gap:10px;}
  .cs-header-icon{width:30px;height:30px;border-radius:6px;background:#e8a020;display:flex;align-items:center;justify-content:center;font-size:15px;}
  .cs-title{font-size:13px;font-weight:700;color:#fff;}
  .cs-subtitle{font-size:10px;color:rgba(255,255,255,.5);margin-top:1px;}
  .cs-close-btn{width:28px;height:28px;border-radius:5px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);cursor:pointer;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;transition:all .12s;}
  .cs-close-btn:hover{background:#dc3545;border-color:#dc3545;}
  .cs-toolbar{background:#f5f7fc;border-bottom:1px solid #e0e5f0;padding:8px 16px;display:flex;align-items:center;gap:8px;flex-shrink:0;}
  .cs-search{flex:1;border:1px solid #d4dbe8;border-radius:5px;padding:4px 10px;font-size:11px;outline:none;height:28px;}
  .cs-search:focus{border-color:#e8a020;box-shadow:0 0 0 2px rgba(232,160,32,.15);}
  .cs-toolbar-btn{border:1px solid #d4dbe8;background:#fff;border-radius:5px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer;height:28px;display:flex;align-items:center;gap:4px;color:#4a5568;transition:all .12s;}
  .cs-toolbar-btn:hover{background:#1a2e4a;color:#fff;border-color:#1a2e4a;}
  .cs-count-badge{background:#e8a020;color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;margin-left:auto;}
  .cs-list-header{display:grid;grid-template-columns:28px 1fr 80px 90px;gap:8px;align-items:center;padding:6px 16px;background:#eef1f7;border-bottom:1px solid #d4dbe8;flex-shrink:0;}
  .cs-list-header span{font-size:10px;font-weight:700;color:#6b7a99;text-transform:uppercase;letter-spacing:.6px;}
  .cs-list{overflow-y:auto;flex:1;padding:6px 0;}
  .cs-list::-webkit-scrollbar{width:5px;}
  .cs-list::-webkit-scrollbar-thumb{background:#c5cde0;border-radius:10px;}
  .cs-row{display:grid;grid-template-columns:28px 1fr 80px 90px;gap:8px;align-items:center;padding:5px 16px;border-bottom:1px solid #f0f2f8;transition:background .08s;}
  .cs-row:hover{background:#fef9f0;}
  .cs-row.hidden-row{opacity:.45;}
  .cs-row-num{font-size:10px;color:#b0bbd4;font-weight:600;text-align:center;}
  .cs-row-label{font-size:11.5px;color:#1a2e4a;font-weight:500;}
  .cs-row-label small{display:block;font-size:9.5px;color:#8b99b5;font-weight:400;}
  .cs-toggle{position:relative;width:34px;height:18px;flex-shrink:0;}
  .cs-toggle input{opacity:0;width:0;height:0;}
  .cs-toggle-track{position:absolute;inset:0;border-radius:9px;background:#d4dbe8;cursor:pointer;transition:background .2s;}
  .cs-toggle input:checked + .cs-toggle-track{background:#e8a020;}
  .cs-toggle-track::after{content:"";position:absolute;width:14px;height:14px;border-radius:50%;background:#fff;top:2px;left:2px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
  .cs-toggle input:checked + .cs-toggle-track::after{left:18px;}
  .cs-width-input{border:1px solid #d4dbe8;border-radius:4px;padding:3px 7px;font-size:11px;color:#1a2e4a;width:100%;outline:none;height:24px;text-align:right;}
  .cs-width-input:focus{border-color:#e8a020;box-shadow:0 0 0 2px rgba(232,160,32,.15);}
  .cs-footer{background:#f5f7fc;border-top:1px solid #e0e5f0;padding:10px 16px;display:flex;align-items:center;gap:8px;flex-shrink:0;}
  .cs-footer-info{font-size:10px;color:#8b99b5;}
  .cs-footer-info strong{color:#e8a020;}
  .cs-cancel-btn{margin-left:auto;border:1px solid #d4dbe8;background:#fff;border-radius:5px;padding:5px 16px;font-size:11px;font-weight:600;cursor:pointer;color:#4a5568;height:30px;}
  .cs-cancel-btn:hover{border-color:#8b99b5;background:#f0f2f8;}
  .cs-reset-btn{border:1px solid #ffc107;background:#fff8e1;border-radius:5px;padding:5px 14px;font-size:11px;font-weight:600;cursor:pointer;color:#856404;height:30px;}
  .cs-reset-btn:hover{background:#ffc107;color:#fff;border-color:#ffc107;}
  .cs-save-btn{border:none;background:#1a2e4a;border-radius:5px;padding:5px 18px;font-size:11px;font-weight:700;cursor:pointer;color:#fff;height:30px;display:flex;align-items:center;gap:5px;}
  .cs-save-btn:hover{background:#e8a020;}

  /* MESSAGE BOX  (mirrors JS MsgBox / MsgBoxYesNo) */
  .msg-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:2000;animation:cs-fade .12s ease;}
  .msg-box{background:#fff;border-radius:8px;padding:22px 26px;min-width:300px;max-width:460px;box-shadow:0 16px 48px rgba(0,0,0,.25);}
  .msg-title{font-size:13px;font-weight:700;color:#1a2e4a;margin-bottom:10px;}
  .msg-text{font-size:12px;color:#4a5568;margin-bottom:18px;line-height:1.55;}
  .msg-btns{display:flex;justify-content:flex-end;gap:8px;}
  .msg-ok{border:none;background:#1a2e4a;color:#fff;border-radius:5px;padding:5px 20px;font-size:11px;font-weight:700;cursor:pointer;height:30px;}
  .msg-ok:hover{background:#e8a020;}
  .msg-yes{border:none;background:#198754;color:#fff;border-radius:5px;padding:5px 20px;font-size:11px;font-weight:700;cursor:pointer;height:30px;}
  .msg-yes:hover{background:#146c43;}
  .msg-no{border:1px solid #d4dbe8;background:#fff;color:#4a5568;border-radius:5px;padding:5px 20px;font-size:11px;font-weight:600;cursor:pointer;height:30px;}
  .msg-no:hover{background:#f0f2f8;}
`;

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────
export default function ItemMaster() {

  // ── Column settings (persisted — mirrors JS F12Config + VisibleColumn + localStorage) ──
  const [columns, setColumns] = useState(() => {
    try {
      const s = localStorage.getItem("imColSettings");
      return s ? JSON.parse(s) : DEFAULT_COLUMNS;
    } catch { return DEFAULT_COLUMNS; }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [draftCols, setDraftCols] = useState([]);
  const [colSearch, setColSearch] = useState("");

  // ── Core state ──
  const [rows,       setRows]       = useState([]);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [selectedId, setSelectedId] = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [page,       setPage]       = useState(1);
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [validErr,   setValidErr]   = useState("");

  // ── Confirm dialog (mirrors JS MsgBoxYesNo) ──
  const [msgBox, setMsgBox] = useState(null);

  const nextId  = useRef(1);
  const formRef = useRef(null);
  const gridRef = useRef(null);
  const drag    = useRef({ on:false,x:0,y:0,sl:0,st:0 });
  const syncing = useRef(false);

  // Bootstrap CDN
  useEffect(() => {
    if (!document.getElementById("bs5-cdn")) {
      const l = document.createElement("link");
      l.id = "bs5-cdn"; l.rel = "stylesheet";
      l.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css";
      document.head.appendChild(l);
    }
  }, []);

  // ── Global keyboard shortcuts (mirrors JS document.keydown) ──
  useEffect(() => {
    const onKey = (e) => {
      if (showPopup || msgBox) return;
      if (e.key === "F1")      { e.preventDefault(); handleSaveAction(); }
      if (e.key === "F2")      { e.preventDefault(); handleNew(); }
      if (e.key === "F4")      { e.preventDefault(); handleExcel(); }
      if (e.key === "F12")     { e.preventDefault(); openColPopup(); }
      if (e.key === "Delete")  { handleDeleteAction(); }
      if (e.key === "Escape")  { e.preventDefault(); handleNew(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line
  }, [showPopup, msgBox, rows, form, selectedId, editingId]);

  // ── Refs for stable callbacks ──
  const rowsRef      = useRef(rows);
  const formRef2     = useRef(form);
  const selectedRef  = useRef(selectedId);
  const editingRef   = useRef(editingId);
  useEffect(() => { rowsRef.current = rows; }, [rows]);
  useEffect(() => { formRef2.current = form; }, [form]);
  useEffect(() => { selectedRef.current = selectedId; }, [selectedId]);
  useEffect(() => { editingRef.current = editingId; }, [editingId]);

  // ─────────────────────────────────────────
  //  COLUMN POPUP HELPERS
  //  (mirrors JS F12Config + savewidth handler)
  // ─────────────────────────────────────────
  const openColPopup = () => {
    setDraftCols(columns.map(c => ({ ...c })));
    setColSearch("");
    setShowPopup(true);
  };
  const handleColSave = () => {
    setColumns(draftCols);
    try { localStorage.setItem("imColSettings", JSON.stringify(draftCols)); } catch {}
    setShowPopup(false);
  };
  const colReset   = () => setDraftCols(DEFAULT_COLUMNS.map(c => ({ ...c })));
  const colShowAll = () => setDraftCols(draftCols.map(c => ({ ...c, visible: true })));
  const colHideAll = () => setDraftCols(draftCols.map(c => ({ ...c, visible: false })));
  const colToggle  = (i) => { const u=[...draftCols]; u[i]={...u[i],visible:!u[i].visible}; setDraftCols(u); };
  const colWidth   = (i,v) => { const u=[...draftCols]; u[i]={...u[i],width:Number(v)||u[i].width}; setDraftCols(u); };

  const filteredDraft = draftCols.filter(c =>
    c.label.toLowerCase().includes(colSearch.toLowerCase()) ||
    c.key.toLowerCase().includes(colSearch.toLowerCase())
  );
  const visibleCount = draftCols.filter(c => c.visible).length;
  const visibleCols  = columns.filter(c => c.visible);

  // ─────────────────────────────────────────
  //  SCROLL SYNC + DRAG (mirrors JS scroll handlers)
  // ─────────────────────────────────────────
  const onGridScroll = useCallback(() => {
    if (syncing.current) return;
    syncing.current = true;
    if (formRef.current && gridRef.current)
      formRef.current.scrollLeft = gridRef.current.scrollLeft;
    syncing.current = false;
  }, []);

  const onMD = (e) => { const el=gridRef.current; drag.current={on:true,x:e.pageX-el.offsetLeft,y:e.pageY-el.offsetTop,sl:el.scrollLeft,st:el.scrollTop}; };
  const onML = () => { drag.current.on=false; };
  const onMU = () => { drag.current.on=false; };
  const onMM = (e) => {
    if (!drag.current.on) return; e.preventDefault();
    const el=gridRef.current;
    el.scrollLeft=drag.current.sl-((e.pageX-el.offsetLeft)-drag.current.x)*1.5;
    el.scrollTop =drag.current.st-((e.pageY-el.offsetTop )-drag.current.y)*1.5;
  };

  // ─────────────────────────────────────────
  //  FORM FIELD CHANGE
  //  (mirrors JS gridItemmaster keypress + calcution auto-trigger)
  // ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newForm = { ...form, [name]: type === "checkbox" ? checked : value };

    // Auto-recalculate derived fields when rate inputs change
    const rateInputs = ["PurchaseRate","GST","CESS","TransPer","MRP","ProfitPer"];
    if (rateInputs.includes(name)) {
      const derived = calcDerivedFields({ ...newForm });
      newForm = { ...newForm, ...derived };
    }

    // SalesRate change → recalc ProfitPer (mirrors JS grdSalesRate handler)
    if (name === "SalesRate") {
      // First compute LandingCost if not yet done
      if (!newForm.LandingCost) {
        const derived = calcDerivedFields(newForm);
        newForm = { ...newForm, ...derived };
      }
      newForm = calcFromSaleRate(newForm);
    }

    // ProfitAmt change → recalc ProfitPer (mirrors JS grdProfitAmt handler)
    if (name === "ProfitAmt") {
      newForm = calcFromProfitAmt(newForm);
      const derived = calcDerivedFields(newForm);
      newForm = { ...newForm, ...derived };
    }

    setValidErr("");
    setForm(newForm);
  };

  // ─────────────────────────────────────────
  //  VALIDATION  (mirrors JS vaildatefunction + gridemptycheck)
  // ─────────────────────────────────────────
  const validateForm = (f) => {
    if (!String(f.ProductCode || "").trim()) {
      setValidErr("❌ Product Code is required.");
      return false;
    }
    if (!String(f.ProductName || "").trim()) {
      setValidErr("❌ Description is required.");
      return false;
    }
    // LandingCostCompare logic (mirrors JS LandingCostCompare checks)
    if (valNum(f.SalesRate) !== 0 && valNum(f.LandingCost) !== 0) {
      if (valNum(f.LandingCost) > valNum(f.SalesRate)) {
        setValidErr("❌ Sale Rate is less than Landing Cost.");
        return false;
      }
    }
    if (valNum(f.MRP) !== 0 && valNum(f.SalesRate) !== 0) {
      if (valNum(f.MRP) < valNum(f.SalesRate)) {
        setValidErr("❌ Sale Rate is greater than MRP.");
        return false;
      }
    }
    if (valNum(f.MRP) !== 0 && valNum(f.PurchaseRate) !== 0) {
      if (valNum(f.MRP) < valNum(f.PurchaseRate)) {
        setValidErr("❌ Purchase Rate is greater than MRP.");
        return false;
      }
    }
    setValidErr("");
    return true;
  };

  // ─────────────────────────────────────────
  //  SAVE  (mirrors JS F1 / SaveItemMaster)
  // ─────────────────────────────────────────
  const handleSaveAction = () => {
    if (!validateForm(form)) return;

    const doSave = () => {
      if (editingId !== null) {
        // Edit existing (mirrors JS gridItemmaster EditMode=0 after save)
        setRows(prev => prev.map(r =>
          r.Id === editingId
            ? { ...form, Id: editingId, EditMode: 0 }
            : r
        ));
      } else {
        // Add new (mirrors JS addrow → source.addrow → setcellvalue Active=true)
        const newId = nextId.current++;
        setRows(prev => [...prev, {
          ...form,
          Id: newId,
          EditMode: 0,
          Active:       form.Active       !== "" ? form.Active       : true,
          StockNeed:    form.StockNeed    !== "" ? form.StockNeed    : true,
          SalesRateType:form.SalesRateType!== "" ? form.SalesRateType: true,
        }]);
      }
      setForm({ ...EMPTY_FORM });
      setSelectedId(null);
      setEditingId(null);
      setValidErr("");
      setPage(p => p); // stay on current page
    };

    setMsgBox({
      text: "Do you want to Save Item Master Details?",
      yesNo: true,
      onYes: () => { setMsgBox(null); doSave(); },
      onNo:  () => setMsgBox(null),
    });
  };

  // ─────────────────────────────────────────
  //  NEW  (mirrors JS F2 / handleNew + addrow reset)
  // ─────────────────────────────────────────
  const handleNew = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedId(null);
    setEditingId(null);
    setValidErr("");
  };

  // ─────────────────────────────────────────
  //  ROW CLICK  (mirrors JS gridItemmaster cellselect + row populate)
  // ─────────────────────────────────────────
  const handleRowClick = (row) => {
    setSelectedId(row.Id);
    setEditingId(row.Id);
    setForm({ ...EMPTY_FORM, ...row });
    setValidErr("");
  };

  // ─────────────────────────────────────────
  //  DELETE  (mirrors JS Delete key → MsgBoxYesNo → DeleteItemMaster)
  // ─────────────────────────────────────────
  const handleDeleteAction = () => {
    if (selectedId === null) {
      setMsgBox({ text: "Select a row to delete.", yesNo: false, onYes: () => setMsgBox(null) });
      return;
    }
    const row = rows.find(r => r.Id === selectedId);
    setMsgBox({
      text: `Wish to Delete the Record "${row?.ProductName || selectedId}"?`,
      yesNo: true,
      onYes: () => {
        setRows(prev => prev.filter(r => r.Id !== selectedId));
        setForm({ ...EMPTY_FORM });
        setSelectedId(null);
        setEditingId(null);
        setMsgBox(null);
      },
      onNo: () => setMsgBox(null),
    });
  };

  // ─────────────────────────────────────────
  //  EXCEL DOWNLOAD
  //  (mirrors JS F4 handler — decimal formatting like JS forEach + alasql XLSX export)
  // ─────────────────────────────────────────
  const handleExcel = () => {
    if (!rows.length) {
      setMsgBox({ text: "No records to export.", yesNo: false, onYes: () => setMsgBox(null) });
      return;
    }

    const formatted = rows.map((r, i) => {
      const obj = { "S.No": i+1, Id: r.Id };
      visibleCols.forEach(c => {
        let v = r[c.key] ?? "";
        // Apply same decimal formatting as JS data.data.forEach
        if      (c.type === "float2") v = valNum(v).toFixed(2);
        else if (c.type === "float3") v = valNum(v).toFixed(3);
        else if (c.type === "float4") v = valNum(v).toFixed(4);
        else if (c.type === "int")    v = String(parseInt(valNum(v)) || 0);
        else if (c.bool)              v = v ? "Yes" : "No";
        obj[c.label] = v;
      });
      return obj;
    });

    const header = Object.keys(formatted[0]).join(",");
    const body   = formatted.map(r =>
      Object.values(r).map(v => `"${v}"`).join(",")
    ).join("\n");

    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "itemmaster.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────
  //  PAGINATION + FILTER
  // ─────────────────────────────────────────
  const filtered   = rows.filter(r =>
    String(r.ProductCode || "").toLowerCase().includes(filterCode.toLowerCase()) &&
    String(r.ProductName || "").toLowerCase().includes(filterName.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paged      = filtered.slice((page-1)*ROWS_PER_PAGE, page*ROWS_PER_PAGE);
  const pageNums   = Array.from({ length: totalPages }, (_,i) => i+1);
  const totalWidth = SNO_WIDTH + visibleCols.reduce((s,c) => s+c.width, 0);

  // ─────────────────────────────────────────
  //  CELL RENDERER (mirrors JS columntype checkbox / cellsalign right)
  // ─────────────────────────────────────────
  const renderCell = (col, row) => {
    const v = row[col.key];
    if (col.bool) return v
      ? <span className="bool-yes">✓ Yes</span>
      : <span className="bool-no">✗ No</span>;
    if (col.type === "float2") return valNum(v).toFixed(2);
    if (col.type === "float3") return valNum(v).toFixed(3);
    if (col.type === "int")    return String(parseInt(valNum(v)) || "");
    return v ?? "";
  };

  const isNumericCol = (col) => !!(col.type || col.bool === false);

  // ═══════════════════════════════════════════
  //  JSX RENDER
  // ═══════════════════════════════════════════
  return (
    <>
      <style>{CSS}</style>
      <div className="im-root">

        {/* ══ HEADER ══ */}
        <div className="im-header">
          <div className="im-brand">
            <div className="im-brand-icon">D</div>
            <div className="im-brand-text">
              <span className="im-brand-name">Dreams POS</span>
              <span className="im-brand-sub">Billing</span>
            </div>
          </div>
          <div className="im-header-title">⬛ KASSA BM</div>
          <div className="im-user-block">
            <div className="im-avatar">👤</div>
            <div>
              <div className="im-user-name">8754031480</div>
              <div className="im-user-role">Administrator</div>
            </div>
          </div>
        </div>

        <div className="im-content">

          {/* ── TITLE BAR ── */}
          <div className="im-titlebar">
            <span className="im-titlebar-text">📋 Item Master</span>
            <div className="d-flex align-items-center gap-2">
              <div className="d-flex gap-1">
                {pageNums.slice(0,6).map(n=>(
                  <button key={n} className={`im-page-btn${page===n?" active":""}`} onClick={()=>setPage(n)}>{n}</button>
                ))}
                {totalPages>6 && <span style={{color:"#8b99b5",fontSize:11}}>...</span>}
              </div>
              <span style={{background:"#1a2e4a",color:"#fff",fontSize:11,fontWeight:600,padding:"2px 10px",borderRadius:20}}>
                Records: {rows.length}
              </span>
              {editingId && (
                <span style={{background:"#fff3cd",color:"#856404",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,border:"1px solid #ffc107"}}>
                  ✏️ Editing #{editingId}
                </span>
              )}
              {validErr && <span className="val-err">{validErr}</span>}
            </div>
          </div>

          {/* ── FILTER ── */}
          <div className="im-filter-row">
            <span style={{fontWeight:700,color:"#e8a020",fontSize:12}}>🔍 Search</span>
            <div className="d-flex align-items-center gap-1">
              <span className="im-filter-label">Product Code</span>
              <input style={{width:120}} value={filterCode}
                onChange={e=>{setFilterCode(e.target.value);setPage(1);}}
                placeholder="Search code..." />
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="im-filter-label">Description</span>
              <input style={{width:150}} value={filterName}
                onChange={e=>{setFilterName(e.target.value);setPage(1);}}
                placeholder="Search name..." />
            </div>
            <span className="ms-auto" style={{fontSize:11,color:"#8b99b5"}}>
              {rows.length===0
                ? <span style={{color:"#e8a020",fontWeight:600}}>Enter data in fields below → 💾 F1 Save</span>
                : `Showing ${paged.length} of ${filtered.length} records`}
            </span>
          </div>

          {/* ── SYNCED FORM + GRID ── */}
          <div className="im-sync-outer">

            {/* FORM STRIP */}
            <div className="im-form-scroll" ref={formRef}>
              <div className="im-form-strip" style={{width:totalWidth}}>
                <div className="im-sno-ph" style={{width:SNO_WIDTH,minWidth:SNO_WIDTH}} />
                {visibleCols.map(col=>(
                  <div key={col.key} className="im-form-cell" style={{width:col.width,minWidth:col.width}}>
                    <label title={col.key}>
                      {col.label}{col.calc ? " 🔒" : ""}
                    </label>

                    {/* Bool → Yes/No select (mirrors JS columntype:checkbox) */}
                    {col.bool ? (
                      <select name={col.key}
                        value={form[col.key] ? "Yes" : "No"}
                        onChange={e => {
                          setForm(f => ({ ...f, [col.key]: e.target.value === "Yes" }));
                          setValidErr("");
                        }}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>

                    ) : col.calc ? (
                      /* Calculated / read-only (mirrors JS GSTAmt, LandingCost etc.) */
                      <input className="calc-field" readOnly
                        value={form[col.key] !== "" ? form[col.key] : ""}
                        placeholder="Auto-calc" />

                    ) : col.type === "float2" || col.type === "float3" || col.type === "float4" ? (
                      /* Numeric fields (mirrors JS GridKeyPressValidation float) */
                      <input name={col.key}
                        type="number"
                        step={col.type === "float3" ? "0.001" : "0.01"}
                        value={form[col.key] || ""}
                        onChange={handleChange}
                        placeholder="0.00" />

                    ) : col.type === "int" ? (
                      /* Integer fields */
                      <input name={col.key}
                        type="number" step="1"
                        value={form[col.key] || ""}
                        onChange={handleChange}
                        placeholder="0" />

                    ) : (
                      /* String fields */
                      <input name={col.key}
                        value={form[col.key] || ""}
                        onChange={handleChange}
                        placeholder={col.label} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GRID */}
            <div className="im-grid-scroll" ref={gridRef}
              onScroll={onGridScroll}
              onMouseDown={onMD} onMouseLeave={onML} onMouseUp={onMU} onMouseMove={onMM}
            >
              <table className="im-table" style={{width:totalWidth}}>
                <thead>
                  <tr>
                    <th style={{width:SNO_WIDTH,minWidth:SNO_WIDTH}} className="im-sno-col">S.No</th>
                    {visibleCols.map(col=>(
                      <th key={col.key} style={{width:col.width,minWidth:col.width}}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.length===0 ? (
                    <tr>
                      <td colSpan={visibleCols.length+1} className="im-empty-td">
                        📭 No records — fill the fields above and press <strong>F1 Save</strong>
                      </td>
                    </tr>
                  ) : paged.map((row,idx)=>(
                    <tr key={row.Id}
                      className={[
                        selectedId===row.Id ? "sel-row"     : "",
                        row.Active===false  ? "inactive-row" : "",
                        row.EditMode===1    ? "edited-row"   : "",
                      ].filter(Boolean).join(" ")}
                      onClick={()=>handleRowClick(row)}
                    >
                      <td className="im-sno-col">{(page-1)*ROWS_PER_PAGE+idx+1}</td>
                      {visibleCols.map(col=>(
                        <td key={col.key}
                          style={{
                            width:col.width,
                            textAlign: col.type && !col.bool ? "right" : "left",
                          }}>
                          {renderCell(col, row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* ══ FOOTER ══ */}
        <div className="im-footer">
          <button className="fn-btn fn-save"         onClick={handleSaveAction}>  💾 F1 - Save</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn fn-new"          onClick={handleNew}>          ➕ F2 - New</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn">                                               📦 F3 - Opening Stock</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn fn-excel"        onClick={handleExcel}>        📥 F4 - Excel Download</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn">                                               🏪 F5 - Branchwise SaleRate</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn">                                               🌐 F6 - Tamil Name</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn fn-excel">                                      📤 F7 - Excel Upload</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn">                                               🏷️ F8 - BarcodeList</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn fn-delete"       onClick={handleDeleteAction}> 🗑️ DEL - Delete</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn fn-col-settings" onClick={openColPopup}>       ⚙️ F12 - Columns</button>
          <span className="fn-sep">|</span>
          <button className="fn-btn"                 onClick={handleNew}>          ✖️ ESC - Exit</button>
        </div>

        {/* ══ COLUMN SETTINGS POPUP (F12) ══ */}
        {showPopup && (
          <div className="cs-overlay" onClick={e=>{ if(e.target===e.currentTarget) setShowPopup(false); }}>
            <div className="cs-modal">
              <div className="cs-header">
                <div className="cs-header-left">
                  <div className="cs-header-icon">⚙️</div>
                  <div>
                    <div className="cs-title">Column Settings</div>
                    <div className="cs-subtitle">Toggle visibility · Adjust column width</div>
                  </div>
                </div>
                <button className="cs-close-btn" onClick={()=>setShowPopup(false)}>✕</button>
              </div>
              <div className="cs-toolbar">
                <input className="cs-search" placeholder="🔍  Search columns..."
                  value={colSearch} onChange={e=>setColSearch(e.target.value)} />
                <button className="cs-toolbar-btn" onClick={colShowAll}>✅ Show All</button>
                <button className="cs-toolbar-btn" onClick={colHideAll}>🚫 Hide All</button>
                <span className="cs-count-badge">{visibleCount} / {draftCols.length} visible</span>
              </div>
              <div className="cs-list-header">
                <span>#</span>
                <span>Column Name</span>
                <span style={{textAlign:"center"}}>Visible</span>
                <span style={{textAlign:"right"}}>Width px</span>
              </div>
              <div className="cs-list">
                {filteredDraft.length===0 && (
                  <div style={{textAlign:"center",padding:"30px 0",color:"#b0bbd4",fontSize:12}}>No columns match</div>
                )}
                {filteredDraft.map(col=>{
                  const ri = draftCols.findIndex(c=>c.key===col.key);
                  return (
                    <div key={col.key} className={`cs-row${!col.visible?" hidden-row":""}`}>
                      <div className="cs-row-num">{ri+1}</div>
                      <div className="cs-row-label">
                        {col.label}
                        {/* <small>{col.key}{col.calc?" · auto-calc":""}</small> */}
                      </div>
                      <div style={{display:"flex",justifyContent:"center"}}>
                        <label className="cs-toggle">
                          <input type="checkbox" checked={col.visible} onChange={()=>colToggle(ri)} />
                          <div className="cs-toggle-track" />
                        </label>
                      </div>
                      <div>
                        <input type="number" className="cs-width-input"
                          value={col.width} min={40} max={500}
                          onChange={e=>colWidth(ri,e.target.value)} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="cs-footer">
                <span className="cs-footer-info">Press <strong>F12</strong> anytime · Settings saved to browser</span>
                <button className="cs-cancel-btn" onClick={()=>setShowPopup(false)}>Cancel</button>
                <button className="cs-reset-btn"  onClick={colReset}>↩ Reset</button>
                <button className="cs-save-btn"   onClick={handleColSave}>💾 Save Settings</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ MESSAGE BOX (MsgBox / MsgBoxYesNo) ══ */}
        {msgBox && (
          <div className="msg-overlay">
            <div className="msg-box">
              <div className="msg-title">
                {msgBox.yesNo ? "⚠️ Confirm" : "ℹ️ Information"}
              </div>
              <div className="msg-text">{msgBox.text}</div>
              <div className="msg-btns">
                {msgBox.yesNo ? (
                  <>
                    <button className="msg-no"  onClick={msgBox.onNo}>No</button>
                    <button className="msg-yes" onClick={msgBox.onYes}>Yes</button>
                  </>
                ) : (
                  <button className="msg-ok" onClick={msgBox.onYes}>OK</button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
