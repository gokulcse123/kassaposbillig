import { PurchaseCalculator } from '../../domain/services/PurchaseCalculator.js';

export class CalculatePurchaseTotal {
  /**
   * Recalculates totals whenever items or overrides change.
   * @param {object[]} items
   * @param {object} overrides - { transAmt, otherPlus, otherSub, tcsPercent, igst }
   * @returns {object} totals object
   */
  execute(items, overrides = {}) {
    return PurchaseCalculator.calculateTotals(items, overrides);
  }
}
