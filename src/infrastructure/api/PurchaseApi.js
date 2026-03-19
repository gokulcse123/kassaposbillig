const BASE_URL = 'http://13.200.71.164:9001/api';

const DEFAULT_COMID = '34';
const DEFAULT_TOKEN = 'eyJhbGciOiJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzA0L3htbGRzaWctbW9yZSNobWFjLXNoYTI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhcmF2YW5hMUBnbWFpbC5jb20iLCJ1c2VySWQiOiIxIiwicm9sZSI6IkFkbWluIiwic3ViIjoiMSIsIm5iZiI6MTc3MzkyMjc4NCwiaWF0IjoxNzczOTIyNzg0LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjQ0MzAwLyIsImF1ZCI6InNlY3VyZWFwaXVzZXIiLCJleHAiOjE3NzQwMDkxODR9.EGKRlGGedits3n7ALfm175mDQvj61_QbVhJp4tuxz4s';

const getComid  = () => localStorage.getItem('Comid')  || DEFAULT_COMID;
const getMComid = () => localStorage.getItem('MComid') || localStorage.getItem('Comid') || DEFAULT_COMID;
const getFYear  = () => {
  try { return JSON.parse(localStorage.getItem('Companysetting'))?.[0]?.FYear || '2425'; }
  catch { return '2425'; }
};
const getToken = () =>
  localStorage.getItem('token')       ||
  localStorage.getItem('Token')       ||
  localStorage.getItem('bearerToken') ||
  localStorage.getItem('jwt')         ||
  DEFAULT_TOKEN;

// ── POST with query params (server expects POST + query string) ───────────────
async function postQuery(url, params = {}) {
  const query   = new URLSearchParams(params).toString();
  const fullUrl = BASE_URL + url + (query ? '?' + query : '');
  const res = await fetch(fullUrl, {
    method: 'POST',                          // ← POST (Postman screenshot பாத்தேன்)
    headers: {
      'Content-Type':  'application/json; charset=utf-8',
      'Authorization': `Bearer ${getToken()}`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${fullUrl}`);
  return res.json();
}

// ── POST with JSON body ───────────────────────────────────────────────────────
async function post(url, body = {}, extraHeaders = {}) {
  const fullUrl = BASE_URL + url;
  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json; charset=utf-8',
      'Authorization': `Bearer ${getToken()}`,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${fullUrl}`);
  return res.json();
}

// ── parse response — handle Data1 / data / Data / array ──────────────────────
function parseList(data) {
  return data?.Data1 || data?.data || data?.Data || (Array.isArray(data) ? data : []);
}

export const PurchaseApi = {

  // POST http://13.200.71.164:9001/api/SupplierApp/SelectSupplierAll?Comid=34&AccountType=SUPPLIER
  async getSuppliers() {
    const data = await postQuery('/SupplierApp/SelectSupplierAll', {
      Comid:       getComid(),
      AccountType: 'SUPPLIER',
    });
    return { ok: true, data: parseList(data) };
  },

  async getSupplierBalance(supplierId, tillDate) {
    const data = await postQuery('/Supplier/CurrentBalance', {
      Id:          supplierId,
      Comid:       getComid(),
      MComid:      getMComid(),
      TillDate:    tillDate,
      AccountType: 'SUPPLIER',
    });
    return data;
  },

  async getNextPurchaseNo() {
    const data = await postQuery('/Purchase/MaxPurchaseNo', {
      Comid: getComid(),
    });
    if (data.ok) return { ok: true, purchaseNo: data.No };
    return { ok: false };
  },

  async getProductByCode(code) {
    const data = await postQuery('/ItemMaster/SelectItemMasterbyCodeId', {
      code,
      Comid:     getMComid(),
      CComid:    getComid(),
      Id:        0,
      Batchwise: 0,
    });
    return { ok: true, data: parseList(data) };
  },

  async searchProducts(query) {
    const data = await postQuery('/ItemMaster/SelectItemMasterList', {
      Comid:      getMComid(),
      CComid:     getComid(),
      SearchText: query || '',
    });
    return { ok: true, data: parseList(data) };
  },

  async savePurchase(purchaseMaster) {
    const MainSet = JSON.parse(localStorage.getItem('Mainsetting') || '[{}]');
    const ms = MainSet[0] || {};
    return post('/Purchase/InsertPurchase', purchaseMaster, {
      'batchstockstatus':         String(ms.BatchWiseStock ? 1 : 0),
      'ItemMasterRateEditUpdate': String(ms.PurchaseEditItemmasterupdate || false),
      'ItemMasterRateUpdate':     String(ms.PurchaseItemmasterSave || false),
      'BatchPerfix':              ms.BatchNoPerfix || '',
      'BatchDigit':               String(ms.BatchNoDigit || 0),
      'CommonCompany':            localStorage.getItem('CommonCompany') || 'false',
      'CommonCompanyDiffStock':   String(ms.CommonCompanyDiffStock || false),
      'SupplierMulitipleAllow':   String(ms.SupplierMulitipleAllow || false),
      'MulipleMRP':               String(JSON.parse(localStorage.getItem('Companysetting') || '[{}]')[0]?.MultiMRP || false),
      'IdComList':                localStorage.getItem('IdComList') || '',
      'MirrorTable':              localStorage.getItem('MirrorTableOnline') || 'false',
      'PrintA4Invoice':           '0',
    });
  },

  async deletePurchase(id, stockList = []) {
    return post('/Purchase/DeletePurchase', stockList, {
      'Year':        getFYear(),
      'Comid':       getComid(),
      'Id':          String(id),
      'MirrorTable': localStorage.getItem('MirrorTableOnline') || 'false',
      'UpdateId':    '',
    });
  },

  async getPurchaseById(id) {
    return postQuery('/Purchase/EditPurchase', {
      Id:    id,
      Comid: getComid(),
      Year:  getFYear(),
    });
  },

  async getPurchaseList(fromDate, toDate, supplierId = 0) {
    return postQuery('/Purchase/SelectPurchase', {
      fromdate: fromDate,
      todate:   toDate,
      Id:       supplierId,
      Comid:    getComid(),
    });
  },
};