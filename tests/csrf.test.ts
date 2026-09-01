import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCsrfToken, generateCsrfToken } from "../src/lib/csrf";
import { NextRequest } from "next/server";

describe("CSRF Protection", () => {
  it("generates a 64-character hex CSRF token", () => {
    const token = generateCsrfToken();
    assert.equal(typeof token, "string");
    assert.equal(token.length, 64);
  });

  it("skips CSRF check for GET, HEAD, and OPTIONS requests", () => {
    const getReq = new NextRequest("http://localhost:3000/api/checkout", { method: "GET" });
    assert.equal(validateCsrfToken(getReq), true);

    const headReq = new NextRequest("http://localhost:3000/api/checkout", { method: "HEAD" });
    assert.equal(validateCsrfToken(headReq), true);

    const optionsReq = new NextRequest("http://localhost:3000/api/checkout", { method: "OPTIONS" });
    assert.equal(validateCsrfToken(optionsReq), true);
  });

  it("fails when CSRF header or cookie is missing", () => {
    const reqNoHeader = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { cookie: "csrf-token=abc123" },
    });
    assert.equal(validateCsrfToken(reqNoHeader), false);

    const reqNoCookie = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: { "x-csrf-token": "abc123" },
    });
    assert.equal(validateCsrfToken(reqNoCookie), false);
  });

  it("safely rejects mismatched length tokens without throwing RangeError", () => {
    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "x-csrf-token": "short",
        cookie: "csrf-token=much-longer-token-that-would-previously-crash",
      },
    });

    assert.doesNotThrow(() => {
      const isValid = validateCsrfToken(req);
      assert.equal(isValid, false);
    });
  });

  it("accepts identical token in header and cookie", () => {
    const token = generateCsrfToken();
    const req = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "x-csrf-token": token,
        cookie: `csrf-token=${token}`,
      },
    });
    assert.equal(validateCsrfToken(req), true);
  });
});
