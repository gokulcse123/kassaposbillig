/**
 * ABSTRACT CONTRACT: PurchaseRepository
 * All methods throw — concrete impl in infrastructure layer must override.
 */
export class PurchaseRepository {
  async getNextPurchaseNo() {
    throw new Error('Not implemented');
  }

  async getSuppliers() {
    throw new Error('Not implemented');
  }

  async getProducts(query) {
    throw new Error('Not implemented');
  }

  async getPurchaseTypes() {
    throw new Error('Not implemented');
  }

  async savePurchase(purchase) {
    throw new Error('Not implemented');
  }

  async updatePurchase(purchase) {
    throw new Error('Not implemented');
  }

  async deletePurchase(id, stockList) {
    throw new Error('Not implemented');
  }

  async getPurchaseById(id) {
    throw new Error('Not implemented');
  }

  async getPurchaseList(filters) {
    throw new Error('Not implemented');
  }

  async getGstSummary(items) {
    throw new Error('Not implemented');
  }
}
