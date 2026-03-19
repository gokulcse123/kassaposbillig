/**
 * PRESENTATION HOOK: usePurchaseViewModel
 * Bridges use-cases ↔ UI. All state lives here.
 * Components just render + call handlers — zero business logic in JSX.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { PurchaseRepositoryImpl } from '../../infrastructure/repositories/PurchaseRepositoryImpl.js';
import { CreatePurchase }          from '../../application/usecases/CreatePurchase.js';
import { AddPurchaseItem }         from '../../application/usecases/AddPurchaseItem.js';
import { RemovePurchaseItem }      from '../../application/usecases/RemovePurchaseItem.js';
import { CalculatePurchaseTotal }  from '../../application/usecases/CalculatePurchaseTotal.js';
import { PurchaseCalculator }      from '../../domain/services/PurchaseCalculator.js';
import { PurchaseDTO }             from '../../application/dto/PurchaseDTO.js';
import { todayISO, addDays, showToast } from '../../shared/helpers/index.js';

const repo           = new PurchaseRepositoryImpl();
const createUC       = new CreatePurchase(repo);
const addItemUC      = new AddPurchaseItem();
const removeItemUC   = new RemovePurchaseItem();
const calcTotalUC    = new CalculatePurchaseTotal();

const EMPTY_HEADER = {
  purchaseNo:    '',
  purchaseDate:  todayISO(),
  dueDate:       '',
  purchaseType:  'Purchase',
  supplierId:    0,
  supplierName:  '',
  supplierAddress: '',
  supplierCity:  '',
  supplierContact: '',
  supplierBalance: 0,
  invoiceNo:     '',
  invoiceDate:   todayISO(),
  invoiceAmt:    '',
  remarks:       '',
  taxMode:       'exclusive',
  igst:          false,
  loadding:      '',
  lorryNo:       '',
};

const EMPTY_TOTALS = {
  grossAmt: 0, transAmt: 0, displayAmt: 0, cdAmt: 0, discAmt: 0,
  cessAmt: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, gstAmt: 0,
  otherPlus: 0, otherSub: 0, tcsPercent: 0, tcsAmt: 0, netAmt: 0,
};

export function usePurchaseViewModel() {
  // ── Master data ────────────────────────────────────────────
  const [suppliers,     setSuppliers]     = useState([]);
  const [purchaseTypes, setPurchaseTypes] = useState([]);
  const [allProducts,   setAllProducts]   = useState([]);

  // ── Form state ─────────────────────────────────────────────
  const [header,  setHeader]  = useState(EMPTY_HEADER);
  const [items,   setItems]   = useState([]);
  const [totals,  setTotals]  = useState(EMPTY_TOTALS);
  const [gstRows, setGstRows] = useState([]);

  // ── Override fields (user-editable totals) ─────────────────
  const [overrides, setOverrides] = useState({
    transAmt: '', otherPlus: '', otherSub: '', tcsPercent: '0',
  });

  // ── UI state ───────────────────────────────────────────────
  const [loading,     setLoading]     = useState(false);
  const [editMode,    setEditMode]    = useState(false);
  const [editId,      setEditId]      = useState(0);
  const [confirmDlg,  setConfirmDlg]  = useState(null); // { msg, onYes }
  const [productQuery, setProductQuery] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [activeRowId,  setActiveRowId]  = useState(null);
  const [activeCellKey, setActiveCellKey] = useState(null);

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [sRes, tRes, pRes, noRes] = await Promise.all([
        repo.getSuppliers(),
        repo.getPurchaseTypes(),
        repo.getProducts(''),
        repo.getNextPurchaseNo(),
      ]);
      if (sRes.ok) setSuppliers(sRes.data);
      if (tRes.ok) setPurchaseTypes(tRes.data);
      if (pRes.ok) setAllProducts(pRes.data);
      if (noRes.ok) setHeader(h => ({ ...h, purchaseNo: noRes.purchaseNo }));
      setLoading(false);
    })();
  }, []);

  // ── Recalculate whenever items or overrides change ─────────
  useEffect(() => {
    const t = calcTotalUC.execute(items, {
      transAmt:   parseFloat(overrides.transAmt)   || 0,
      otherPlus:  parseFloat(overrides.otherPlus)  || 0,
      otherSub:   parseFloat(overrides.otherSub)   || 0,
      tcsPercent: parseFloat(overrides.tcsPercent) || 0,
      igst:       header.igst,
    });
    setTotals(t);
    setGstRows(PurchaseCalculator.buildGstSummary(items, header.igst));
  }, [items, overrides, header.igst]);

  // ── Header change handler ──────────────────────────────────
  const onHeaderChange = useCallback((field, value) => {
    setHeader(h => ({ ...h, [field]: value }));
  }, []);

  // ── Supplier select ────────────────────────────────────────
  const onSupplierSelect = useCallback((supplierId) => {
    const sup = suppliers.find(s => s.id === parseInt(supplierId));
    if (sup) {
      setHeader(h => ({
        ...h,
        supplierId:      sup.id,
        supplierName:    sup.name,
        supplierAddress: sup.address,
        supplierCity:    sup.city,
        supplierContact: sup.contact,
        supplierBalance: sup.balance,
        dueDate:         addDays(h.purchaseDate, sup.creditDays || 0),
      }));
    }
  }, [suppliers]);

  // ── Product search ─────────────────────────────────────────
  const onProductSearch = useCallback((q) => {
    setProductQuery(q);
    if (q.length < 1) { setProductSuggestions([]); return; }
    const ql = q.toLowerCase();
    setProductSuggestions(
      allProducts.filter(p =>
        p.name.toLowerCase().includes(ql) || p.code.toLowerCase().includes(ql)
      ).slice(0, 8)
    );
  }, [allProducts]);

  const onProductSelect = useCallback((product, rowId) => {
    setItems(prev => prev.map(item => {
      if (item.rowId !== rowId) return item;
      const updated = {
        ...item,
        productCode:   product.code,
        productName:   product.name,
        productRefId:  product.id,
        hsnCode:       product.hsnCode,
        uom:           product.uom,
        uomRefId:      product.uomRefId,
        mrp:           product.mrp,
        purchaseRate:  product.purchaseRate,
        taxPercent:    product.taxPercent,
        cessPercent:   product.cessPercent,
        saleRate:      product.saleRate,
        itemQty:       1,
      };
      return { ...updated, ...PurchaseCalculator.calculateItemAmount(updated, header.taxMode) };
    }));
    setProductSuggestions([]);
    setProductQuery('');
  }, [header.taxMode]);

  // ── Item field change & recalc ─────────────────────────────
  const onItemChange = useCallback((rowId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.rowId !== rowId) return item;
      const updated = { ...item, [field]: value };
      const recalced = PurchaseCalculator.calculateItemAmount(updated, header.taxMode);
      return { ...updated, ...recalced, editMode: true };
    }));
  }, [header.taxMode]);

  // ── Add empty row ──────────────────────────────────────────
  const addEmptyRow = useCallback(() => {
    const rowId = crypto.randomUUID();
    setItems(prev => [...prev, {
      rowId, id: 0, productCode: '', productName: '', productRefId: 0,
      hsnCode: '', uom: '', uomRefId: 0, mrp: 0, purchaseRate: 0,
      itemQty: 0, freeQty: 0, cdPercent: 0, cdAmount: 0,
      discountPercent: 0, discountAmt: 0, taxPercent: 0, taxAmt: 0,
      cessPercent: 0, cessAmount: 0, saleRate: 0, amount: 0,
      editMode: false, landingCost: 0, stockQty: 0, batchNo: '',
      mfgDate: '', expiryDate: '', narration: '',
    }]);
    setActiveRowId(rowId);
    setActiveCellKey('productCode');
  }, []);

  // ── Remove item ────────────────────────────────────────────
  const removeItem = useCallback((rowId) => {
    setItems(prev => removeItemUC.execute(prev, rowId));
  }, []);

  // ── Override field change ──────────────────────────────────
  const onOverrideChange = useCallback((field, value) => {
    setOverrides(o => ({ ...o, [field]: value }));
  }, []);

  // ── Tax mode toggle ────────────────────────────────────────
  const onTaxModeChange = useCallback((mode) => {
    setHeader(h => ({ ...h, taxMode: mode }));
    // Recalculate all items with new tax mode
    setItems(prev => prev.map(item => ({
      ...item,
      ...PurchaseCalculator.calculateItemAmount(item, mode),
    })));
  }, []);

  // ── IGST toggle ────────────────────────────────────────────
  const onIgstToggle = useCallback((val) => {
    setHeader(h => ({ ...h, igst: val }));
  }, []);

  // ── Save ───────────────────────────────────────────────────
  const onSave = useCallback(async () => {
    if (!header.supplierId) { showToast('Please select a supplier!', 'error'); return; }
    if (items.length === 0)  { showToast('Add at least one product!', 'error'); return; }

    setLoading(true);
    try {
      const purchaseData = {
        ...header,
        items,
        ...totals,
        tcsPercent: parseFloat(overrides.tcsPercent) || 0,
        tcsAmt:     totals.tcsAmt,
      };

      let result;
      if (editMode && editId) {
        result = await repo.updatePurchase(editId, PurchaseDTO.toSavePayload(purchaseData));
      } else {
        result = await createUC.execute(purchaseData);
      }

      if (result.ok) {
        showToast(result.message || 'Saved successfully!', 'success');
        await onClear();
      } else {
        showToast(result.message || 'Save failed.', 'error');
      }
    } catch (e) {
      showToast('Technical error: ' + e.message, 'error');
    }
    setLoading(false);
  }, [header, items, totals, overrides, editMode, editId]);

  // ── Delete ─────────────────────────────────────────────────
  const onDelete = useCallback(() => {
    if (!editId) { showToast('No record to delete.', 'error'); return; }
    setConfirmDlg({
      msg: `Delete Purchase No: ${header.purchaseNo}?`,
      onYes: async () => {
        setConfirmDlg(null);
        setLoading(true);
        const r = await repo.deletePurchase(editId, []);
        if (r.ok) { showToast(r.message, 'success'); await onClear(); }
        else showToast(r.message, 'error');
        setLoading(false);
      },
    });
  }, [editId, header.purchaseNo]);

  // ── Edit by purchaseNo ─────────────────────────────────────
  const onEdit = useCallback(async (id) => {
    setLoading(true);
    const r = await repo.getPurchaseById(id);
    if (r.ok && r.data) {
      const d = PurchaseDTO.fromApiResponse(r.data);
      setHeader({
        purchaseNo:      d.purchaseNo,
        purchaseDate:    d.purchaseDate,
        dueDate:         d.dueDate,
        purchaseType:    d.purchaseType,
        supplierId:      d.supplierId,
        supplierName:    d.supplierName,
        supplierAddress: '',
        supplierCity:    '',
        supplierContact: '',
        supplierBalance: 0,
        invoiceNo:       d.invoiceNo,
        invoiceDate:     d.invoiceDate,
        invoiceAmt:      d.invoiceAmt,
        remarks:         d.remarks,
        taxMode:         d.taxMode,
        igst:            d.igst,
        loadding:        d.loadding,
        lorryNo:         d.lorryNo,
      });
      setItems(d.items);
      setOverrides({
        transAmt:   String(d.transAmt || ''),
        otherPlus:  String(d.otherPlus || ''),
        otherSub:   String(d.otherSub || ''),
        tcsPercent: String(d.tcsPercent || '0'),
      });
      setEditMode(true);
      setEditId(id);
    } else {
      showToast('Record not found.', 'error');
    }
    setLoading(false);
  }, []);

  // ── Clear / New ────────────────────────────────────────────
  const onClear = useCallback(async () => {
    const noRes = await repo.getNextPurchaseNo();
    setHeader({ ...EMPTY_HEADER, purchaseNo: noRes.ok ? noRes.purchaseNo : '' });
    setItems([]);
    setOverrides({ transAmt: '', otherPlus: '', otherSub: '', tcsPercent: '0' });
    setTotals(EMPTY_TOTALS);
    setGstRows([]);
    setEditMode(false);
    setEditId(0);
    setActiveRowId(null);
    setActiveCellKey(null);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1')     { e.preventDefault(); onSave(); }
      if (e.key === 'Escape') { e.preventDefault(); onClear(); }
      if (e.key === 'F9' && editMode) { e.preventDefault(); onDelete(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSave, onClear, onDelete, editMode]);

  return {
    // data
    suppliers, purchaseTypes, allProducts,
    // form state
    header, items, totals, gstRows, overrides,
    // ui state
    loading, editMode, confirmDlg, setConfirmDlg,
    productSuggestions, productQuery,
    activeRowId, setActiveRowId,
    activeCellKey, setActiveCellKey,
    // handlers
    onHeaderChange, onSupplierSelect,
    onProductSearch, onProductSelect,
    onItemChange, addEmptyRow, removeItem,
    onOverrideChange, onTaxModeChange, onIgstToggle,
    onSave, onDelete, onEdit, onClear,
  };
}
