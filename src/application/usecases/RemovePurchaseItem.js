// RemovePurchaseItem.js
export class RemovePurchaseItem {
  /**
   * Removes item by rowId.
   * @param {object[]} currentItems
   * @param {string} rowId
   * @returns {object[]}
   */
  execute(currentItems, rowId) {
    return currentItems.filter(item => item.rowId !== rowId);
  }
}
