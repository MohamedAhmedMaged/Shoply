import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount } from "../src/features/coupons/services/coupon.service";

describe("Coupon Discount Calculations", () => {
  it("calculates percentage discount accurately", () => {
    const discount = calculateDiscount("PERCENTAGE", 20, 100);
    assert.equal(discount, 20);
  });

  it("calculates fractional percentage discount with proper rounding", () => {
    const discount = calculateDiscount("PERCENTAGE", 15, 49.99);
    assert.equal(discount, 7.5);
  });

  it("respects maxDiscount cap for percentage discounts", () => {
    const discount = calculateDiscount("PERCENTAGE", 50, 200, 30);
    assert.equal(discount, 30);
  });

  it("does not cap percentage discount if below maxDiscount", () => {
    const discount = calculateDiscount("PERCENTAGE", 10, 100, 30);
    assert.equal(discount, 10);
  });

  it("calculates fixed discount accurately", () => {
    const discount = calculateDiscount("FIXED", 15, 100);
    assert.equal(discount, 15);
  });

  it("clamps fixed discount to subtotal so total is never negative", () => {
    const discount = calculateDiscount("FIXED", 50, 30);
    assert.equal(discount, 30);
  });

  it("returns 0 discount for 0 subtotal", () => {
    const discount = calculateDiscount("PERCENTAGE", 20, 0);
    assert.equal(discount, 0);
  });
});
