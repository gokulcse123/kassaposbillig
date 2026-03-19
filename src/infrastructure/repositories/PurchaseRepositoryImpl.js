import { PurchaseRepository } from '../../domain/repositories/PurchaseRepository.js';
import { PurchaseApi } from '../api/PurchaseApi.js';

export class PurchaseRepositoryImpl extends PurchaseRepository {
  async getNextPurchaseNo() {
    return PurchaseApi.getNextPurchaseNo();
  }

  async getSuppliers() {
    return PurchaseApi.getSuppliers();
  }

  async getProducts(query) {
    return PurchaseApi.getProducts(query);
  }

  async getPurchaseTypes() {
    return PurchaseApi.getPurchaseTypes();
  }

  async savePurchase(purchase) {
    return PurchaseApi.savePurchase(purchase);
  }

  async updatePurchase(id, purchase) {
    return PurchaseApi.updatePurchase(id, purchase);
  }

  async deletePurchase(id, stockList) {
    return PurchaseApi.deletePurchase(id, stockList);
  }

  async getPurchaseById(id) {
    return PurchaseApi.getPurchaseById(id);
  }

  async getPurchaseList(filters) {
    return PurchaseApi.getPurchaseList(filters);
  }
}
