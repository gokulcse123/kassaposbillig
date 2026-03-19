/**
 * DOMAIN ENTITY: Purchase
 * Pure data model — no framework deps, no side effects.
 */
export class Purchase {
  constructor({
    id = 0,
    purchaseNo = '',
    purchaseDate = new Date().toISOString().split('T')[0],
    dueDate = '',
    purchaseType = 'Purchase',
    supplierId = 0,
    supplierName = '',
    supplierAddress = '',
    supplierCity = '',
    supplierContact = '',
    supplierBalance = 0,
    invoiceNo = '',
    invoiceDate = '',
    invoiceAmt = 0,
    remarks = '',
    taxMode = 'exclusive', // 'exclusive' | 'inclusive'
    igst = false,
    items = [],
    // summary fields
    grossAmt = 0,
    transAmt = 0,
    displayAmt = 0,
    cdAmt = 0,
    discAmt = 0,
    cessAmt = 0,
    cgstAmt = 0,
    sgstAmt = 0,
    igstAmt = 0,
    gstAmt = 0,
    otherPlus = 0,
    otherSub = 0,
    tcsPercent = 0,
    tcsAmt = 0,
    loadding = '',
    lorryNo = '',
    netAmt = 0,
    status = 'new', // 'new' | 'saved' | 'edit'
    editId = 0,
  } = {}) {
    this.id = id;
    this.purchaseNo = purchaseNo;
    this.purchaseDate = purchaseDate;
    this.dueDate = dueDate;
    this.purchaseType = purchaseType;
    this.supplierId = supplierId;
    this.supplierName = supplierName;
    this.supplierAddress = supplierAddress;
    this.supplierCity = supplierCity;
    this.supplierContact = supplierContact;
    this.supplierBalance = supplierBalance;
    this.invoiceNo = invoiceNo;
    this.invoiceDate = invoiceDate;
    this.invoiceAmt = invoiceAmt;
    this.remarks = remarks;
    this.taxMode = taxMode;
    this.igst = igst;
    this.items = items;
    this.grossAmt = grossAmt;
    this.transAmt = transAmt;
    this.displayAmt = displayAmt;
    this.cdAmt = cdAmt;
    this.discAmt = discAmt;
    this.cessAmt = cessAmt;
    this.cgstAmt = cgstAmt;
    this.sgstAmt = sgstAmt;
    this.igstAmt = igstAmt;
    this.gstAmt = gstAmt;
    this.otherPlus = otherPlus;
    this.otherSub = otherSub;
    this.tcsPercent = tcsPercent;
    this.tcsAmt = tcsAmt;
    this.loadding = loadding;
    this.lorryNo = lorryNo;
    this.netAmt = netAmt;
    this.status = status;
    this.editId = editId;
  }
}
