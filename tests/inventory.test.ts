import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  InsufficientStockError,
  InactiveProductError,
} from "../src/features/inventory/inventory.service";

describe("Inventory Error Classes & Domain Logic", () => {
  it("creates InsufficientStockError with correct properties", () => {
    const err = new InsufficientStockError("prod-123", 5, 2);
    assert.equal(err.name, "InsufficientStockError");
    assert.equal(err.productId, "prod-123");
    assert.equal(err.requested, 5);
    assert.equal(err.available, 2);
    assert.ok(err.message.includes("requested 5, only 2 available"));
  });

  it("creates InactiveProductError with correct properties", () => {
    const err = new InactiveProductError("prod-456");
    assert.equal(err.name, "InactiveProductError");
    assert.ok(err.message.includes("prod-456"));
    assert.ok(err.message.includes("not available for purchase"));
  });
});
