/**
 * DOMAIN SERVICE: PurchaseCalculator
 * ALL math/calculation logic for purchase items and totals.
 * Pure functions — no side effects, no framework deps.
 */
export class PurchaseCalculator {
  /**
   * Calculate a single item's amounts based on rate + qty + discounts + tax.
   * Mirrors the original JS logic from PurchaseMaster.js
   */
  static calculateItemAmount(item, taxMode = 'exclusive') {
    const rate = parseFloat(item.purchaseRate) || 0;
    const qty = parseFloat(item.itemQty) || 0;
    const cdPer = parseFloat(item.cdPercent) || 0;
    const discPer = parseFloat(item.discountPercent) || 0;
    const taxPer = parseFloat(item.taxPercent) || 0;
    const cessPer = parseFloat(item.cessPercent) || 0;

    let basicAmt = this.round(rate * qty, 2);

    // CD (Cash Discount) deduction
    const cdAmount = this.round((basicAmt * cdPer) / 100, 2);
    const afterCd = this.round(basicAmt - cdAmount, 2);

    // Discount deduction
    const discAmt = this.round((afterCd * discPer) / 100, 2);
    const afterDisc = this.round(afterCd - discAmt, 2);

    let taxAmt = 0;
    let cessAmount = 0;
    let amount = 0;

    if (taxMode === 'exclusive') {
      taxAmt = this.round((afterDisc * taxPer) / 100, 2);
      cessAmount = this.round((afterDisc * cessPer) / 100, 2);
      amount = this.round(afterDisc + taxAmt + cessAmount, 2);
    } else {
      // inclusive: back-calculate tax out
      const divisor = 1 + taxPer / 100 + cessPer / 100;
      const baseAmt = this.round(afterDisc / divisor, 2);
      taxAmt = this.round((baseAmt * taxPer) / 100, 2);
      cessAmount = this.round((baseAmt * cessPer) / 100, 2);
      amount = afterDisc;
    }

    return {
      ...item,
      cdAmount,
      discountAmt: discAmt,
      taxAmt,
      cessAmount,
      amount,
    };
  }

  /**
   * Build GST summary grouped by tax slab (taxPercent).
   */
  static buildGstSummary(items, igst = false) {
    const map = {};
    for (const item of items) {
      const slab = item.taxPercent || 0;
      if (!map[slab]) {
        map[slab] = { taxPercent: slab, taxableAmt: 0, cgst: 0, sgst: 0, igstAmt: 0, cessAmt: 0 };
      }
      const taxable = this.round(item.amount - item.taxAmt - item.cessAmount, 2);
      map[slab].taxableAmt = this.round(map[slab].taxableAmt + taxable, 2);
      if (igst) {
        map[slab].igstAmt = this.round(map[slab].igstAmt + item.taxAmt, 2);
      } else {
        const half = this.round(item.taxAmt / 2, 2);
        map[slab].cgst = this.round(map[slab].cgst + half, 2);
        map[slab].sgst = this.round(map[slab].sgst + half, 2);
      }
      map[slab].cessAmt = this.round(map[slab].cessAmt + item.cessAmount, 2);
    }
    return Object.values(map).sort((a, b) => a.taxPercent - b.taxPercent);
  }

  /**
   * Calculate totals for the purchase footer.
   */
  static calculateTotals(items, overrides = {}) {
    const grossAmt = this.round(
      items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0),
      2
    );

    const totalTax = this.round(
      items.reduce((sum, i) => sum + (parseFloat(i.taxAmt) || 0), 0),
      2
    );

    const totalCess = this.round(
      items.reduce((sum, i) => sum + (parseFloat(i.cessAmount) || 0), 0),
      2
    );

    const totalCd = this.round(
      items.reduce((sum, i) => sum + (parseFloat(i.cdAmount) || 0), 0),
      2
    );

    const totalDisc = this.round(
      items.reduce((sum, i) => sum + (parseFloat(i.discountAmt) || 0), 0),
      2
    );

    const transAmt = parseFloat(overrides.transAmt) || 0;
    const otherPlus = parseFloat(overrides.otherPlus) || 0;
    const otherSub = parseFloat(overrides.otherSub) || 0;
    const tcsPercent = parseFloat(overrides.tcsPercent) || 0;

    const tcsAmt = this.round((grossAmt * tcsPercent) / 100, 2);

    const netAmt = this.round(
      grossAmt + transAmt + otherPlus - otherSub + tcsAmt,
      2
    );

    const igst = overrides.igst || false;
    const cgstAmt = igst ? 0 : this.round(totalTax / 2, 2);
    const sgstAmt = igst ? 0 : this.round(totalTax / 2, 2);
    const igstAmt = igst ? totalTax : 0;

    return {
      grossAmt,
      transAmt,
      displayAmt: grossAmt,
      cdAmt: totalCd,
      discAmt: totalDisc,
      cessAmt: totalCess,
      gstAmt: totalTax,
      cgstAmt,
      sgstAmt,
      igstAmt,
      otherPlus,
      otherSub,
      tcsPercent,
      tcsAmt,
      netAmt,
    };
  }

  /**
   * Calculate total item qty (sum of itemQty).
   */
  static totalItemQty(items) {
    return this.round(
      items.reduce((sum, i) => sum + (parseFloat(i.itemQty) || 0), 0),
      2
    );
  }

  static round(val, decimals = 2) {
    return Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
