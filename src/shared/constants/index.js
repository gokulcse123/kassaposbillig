export const COLORS = {
  primary: '#1f65de',
  primaryDark: '#1750b8',
  primaryLight: '#4d88f0',
  primarySoft: '#e8f0fd',
  primaryBorder: '#c5d9f9',
  white: '#ffffff',
  bgPage: '#f0f4ff',
  textPrimary: '#1a2b4a',
  textSecondary: '#4a6080',
  textMuted: '#8099be',
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  border: '#dde5f5',
  rowHover: '#f5f8ff',
  rowEdited: '#e6f4ea',
};

export const PURCHASE_TYPES = ['Purchase', 'Purchase Return', 'Import Purchase', 'Purchase Order'];

export const TAX_MODE = {
  EXCLUSIVE: 'exclusive',
  INCLUSIVE: 'inclusive',
};

export const KEY_BINDINGS = {
  SAVE: 'F1',
  FREE_PRODUCT: 'F2',
  EDIT: 'F3',
  VIEW: 'F5',
  DELETE: 'F9',
  EXIT: 'Escape',
};

export const GRID_COLUMNS = [
  { key: 'sno',           label: 'S.No',        width: 50,  align: 'center', editable: false },
  { key: 'productCode',   label: 'Code',         width: 90,  align: 'left',   editable: true },
  { key: 'productName',   label: 'Description',  width: 200, align: 'left',   editable: true },
  { key: 'hsnCode',       label: 'HSN',          width: 80,  align: 'left',   editable: true },
  { key: 'uom',           label: 'UOM',          width: 60,  align: 'center', editable: false },
  { key: 'mrp',           label: 'MRP',          width: 80,  align: 'right',  editable: true },
  { key: 'purchaseRate',  label: 'Pur.Rate',     width: 90,  align: 'right',  editable: true },
  { key: 'itemQty',       label: 'Qty',          width: 80,  align: 'right',  editable: true },
  { key: 'freeQty',       label: 'Free Qty',     width: 80,  align: 'right',  editable: true },
  { key: 'cdPercent',     label: 'CD%',          width: 70,  align: 'right',  editable: true },
  { key: 'cdAmount',      label: 'CD Amt',       width: 80,  align: 'right',  editable: false },
  { key: 'discountPercent', label: 'Disc%',      width: 70,  align: 'right',  editable: true },
  { key: 'discountAmt',   label: 'Disc Amt',     width: 80,  align: 'right',  editable: false },
  { key: 'taxPercent',    label: 'GST%',         width: 65,  align: 'right',  editable: true },
  { key: 'taxAmt',        label: 'GST Amt',      width: 80,  align: 'right',  editable: false },
  { key: 'cessPercent',   label: 'CESS%',        width: 65,  align: 'right',  editable: true, hidden: true },
  { key: 'cessAmount',    label: 'CESS Amt',     width: 80,  align: 'right',  editable: false, hidden: true },
  { key: 'saleRate',      label: 'Sale Rate',    width: 90,  align: 'right',  editable: true },
  { key: 'amount',        label: 'Amount',       width: 100, align: 'right',  editable: false },
];
