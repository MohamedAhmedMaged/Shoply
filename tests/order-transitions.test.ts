import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { OrderStatus, PaymentStatus } from "../src/types";

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["COMPLETED", "FAILED"],
  COMPLETED: ["REFUNDED"],
  FAILED: ["PENDING"],
  REFUNDED: [],
};

describe("Order & Payment State Machine Transitions", () => {
  it("allows valid order lifecycle transitions", () => {
    assert.ok(ORDER_STATUS_TRANSITIONS.PENDING.includes("CONFIRMED"));
    assert.ok(ORDER_STATUS_TRANSITIONS.CONFIRMED.includes("PROCESSING"));
    assert.ok(ORDER_STATUS_TRANSITIONS.PROCESSING.includes("SHIPPED"));
    assert.ok(ORDER_STATUS_TRANSITIONS.SHIPPED.includes("DELIVERED"));
    assert.ok(ORDER_STATUS_TRANSITIONS.DELIVERED.includes("REFUNDED"));
  });

  it("allows order cancellation from early stages", () => {
    assert.ok(ORDER_STATUS_TRANSITIONS.PENDING.includes("CANCELLED"));
    assert.ok(ORDER_STATUS_TRANSITIONS.CONFIRMED.includes("CANCELLED"));
    assert.ok(ORDER_STATUS_TRANSITIONS.PROCESSING.includes("CANCELLED"));
  });

  it("prevents cancelling delivered orders directly", () => {
    assert.ok(!ORDER_STATUS_TRANSITIONS.DELIVERED.includes("CANCELLED"));
  });

  it("treats CANCELLED and REFUNDED as terminal states", () => {
    assert.equal(ORDER_STATUS_TRANSITIONS.CANCELLED.length, 0);
    assert.equal(ORDER_STATUS_TRANSITIONS.REFUNDED.length, 0);
  });

  it("validates payment transitions", () => {
    assert.ok(PAYMENT_STATUS_TRANSITIONS.PENDING.includes("COMPLETED"));
    assert.ok(PAYMENT_STATUS_TRANSITIONS.PENDING.includes("FAILED"));
    assert.ok(PAYMENT_STATUS_TRANSITIONS.COMPLETED.includes("REFUNDED"));
    assert.equal(PAYMENT_STATUS_TRANSITIONS.REFUNDED.length, 0);
  });
});
