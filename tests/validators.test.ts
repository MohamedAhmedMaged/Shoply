import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  registerSchema,
  loginSchema,
  productSchema,
  checkoutSchema,
  contactSchema,
} from "../src/lib/validators";

describe("Zod Validators", () => {
  describe("registerSchema", () => {
    it("accepts valid registration input", () => {
      const res = registerSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "password123",
        role: "CUSTOMER",
      });
      assert.equal(res.success, true);
    });

    it("rejects password shorter than 8 characters", () => {
      const res = registerSchema.safeParse({
        name: "Jane Doe",
        email: "jane@example.com",
        password: "short",
      });
      assert.equal(res.success, false);
    });

    it("rejects invalid email formats", () => {
      const res = registerSchema.safeParse({
        name: "Jane Doe",
        email: "not-an-email",
        password: "password123",
      });
      assert.equal(res.success, false);
    });
  });

  describe("productSchema", () => {
    it("accepts valid product input", () => {
      const res = productSchema.safeParse({
        name: "Mechanical Keyboard",
        description: "High quality mechanical keyboard with tactile switches.",
        price: 99.99,
        images: ["https://example.com/keyboard.jpg"],
        categoryId: "cat_123",
        stock: 50,
      });
      assert.equal(res.success, true);
    });

    it("rejects non-positive price", () => {
      const res = productSchema.safeParse({
        name: "Product",
        description: "Valid description longer than 10 chars.",
        price: -10,
        images: ["https://example.com/img.jpg"],
        categoryId: "cat_123",
        stock: 10,
      });
      assert.equal(res.success, false);
    });

    it("rejects negative stock", () => {
      const res = productSchema.safeParse({
        name: "Product",
        description: "Valid description longer than 10 chars.",
        price: 25,
        images: ["https://example.com/img.jpg"],
        categoryId: "cat_123",
        stock: -5,
      });
      assert.equal(res.success, false);
    });

    it("rejects empty images array", () => {
      const res = productSchema.safeParse({
        name: "Product",
        description: "Valid description longer than 10 chars.",
        price: 25,
        images: [],
        categoryId: "cat_123",
        stock: 10,
      });
      assert.equal(res.success, false);
    });
  });

  describe("checkoutSchema", () => {
    it("accepts valid checkout payload", () => {
      const res = checkoutSchema.safeParse({
        email: "buyer@example.com",
        shippingAddress: {
          fullName: "John Smith",
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "US",
        },
        paymentMethod: "STRIPE",
      });
      assert.equal(res.success, true);
    });

    it("rejects invalid payment method", () => {
      const res = checkoutSchema.safeParse({
        email: "buyer@example.com",
        shippingAddress: {
          fullName: "John Smith",
          street: "123 Main St",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "US",
        },
        paymentMethod: "CRYPTO",
      });
      assert.equal(res.success, false);
    });
  });

  describe("contactSchema", () => {
    it("accepts valid contact submission", () => {
      const res = contactSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        subject: "Product Question",
        message: "Hello, when will the keyboard be back in stock?",
      });
      assert.equal(res.success, true);
    });

    it("rejects message shorter than 10 characters", () => {
      const res = contactSchema.safeParse({
        name: "Alice",
        email: "alice@example.com",
        subject: "Help",
        message: "Too short",
      });
      assert.equal(res.success, false);
    });
  });
});
