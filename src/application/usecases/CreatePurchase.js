// ─── CreatePurchase.js ────────────────────────────────────────────────────────
import { Purchase } from '../../domain/entities/Purchase.js';
import { PurchaseDTO } from '../dto/PurchaseDTO.js';

export class CreatePurchase {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(purchaseData) {
    const payload = PurchaseDTO.toSavePayload(new Purchase(purchaseData));
    const result = await this.repository.savePurchase(payload);
    return result;
  }
}
