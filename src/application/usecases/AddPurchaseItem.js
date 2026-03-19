import { PurchaseItem } from '../../domain/entities/PurchaseItem.js';
import { PurchaseCalculator } from '../../domain/services/PurchaseCalculator.js';

export class AddPurchaseItem {
  /**
   * Adds a new item to the items array and returns the updated list.
   * @param {PurchaseItem[]} currentItems
   * @param {object} itemData  - raw item fields
   * @param {'exclusive'|'inclusive'} taxMode
   * @returns {PurchaseItem[]}
   */
  execute(currentItems, itemData, taxMode = 'exclusive') {
    const newItem = new PurchaseItem(itemData);
    const calculated = PurchaseCalculator.calculateItemAmount(newItem, taxMode);
    return [...currentItems, { ...newItem, ...calculated }];
  }
}
