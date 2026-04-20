"use strict";

const { sanitizeRegistrationPayload } = require("./validation.js");

// Preservation tests — these MUST PASS on unfixed code.
// They establish the baseline behavior that must be preserved after the fix.

describe("Preservation Tests (backend)", () => {
  // Test 2.4 — Valid inputs preservation
  // These inputs are NOT in the bug condition domain (all fields valid).
  // Expected on unfixed code: no error thrown, payload returned correctly → test PASSES.
  describe("Test 2.4 — Valid inputs preservation", () => {
    it("sanitizeRegistrationPayload with all valid fields should not throw and return correct payload", () => {
      const validPayload = {
        organizationName: "Acme Corp",
        fullName: "Jane Doe",
        email: "jane@gmail.com",
        password: "Password1!"
      };

      let result;
      expect(() => {
        result = sanitizeRegistrationPayload(validPayload);
      }).not.toThrow();

      expect(result).toMatchObject({
        organizationName: "Acme Corp",
        fullName: "Jane Doe",
        email: "jane@gmail.com",
        password: "Password1!"
      });
    });
  });
});

// Bug condition exploration tests — these MUST FAIL on unfixed code.
// Failure confirms the bugs exist. DO NOT fix the code or tests when they fail.

describe("Bug Condition Exploration Tests (backend)", () => {
  // Test 1.4 — Full name length overflow
  // Bug: FIELD_LIMITS.fullName is 50 instead of 20, so names up to 50 chars are accepted.
  // Expected on unfixed code: no ValidationError thrown → test FAILS.
  describe("Test 1.4 — Full name length overflow", () => {
    it('sanitizeRegistrationPayload with fullName of 21 chars should throw a ValidationError', () => {
      expect(() =>
        sanitizeRegistrationPayload({
          organizationName: "Acme",
          fullName: "A".repeat(21),
          email: "jane@gmail.com",
          password: "Password1!"
        })
      ).toThrow(expect.objectContaining({ name: "ValidationError" }));
    });
  });

  // Test 1.5 — Non-Gmail email
  // Bug: EMAIL_PATTERN accepts any domain, not just @gmail.com.
  // Expected on unfixed code: no ValidationError thrown → test FAILS.
  describe("Test 1.5 — Non-Gmail email", () => {
    it('sanitizeRegistrationPayload with email "user@company.com" should throw a ValidationError', () => {
      expect(() =>
        sanitizeRegistrationPayload({
          organizationName: "Acme",
          fullName: "Jane Doe",
          email: "user@company.com",
          password: "Password1!"
        })
      ).toThrow(expect.objectContaining({ name: "ValidationError" }));
    });
  });

  // Test 1.6 — Password missing special character
  // Bug: validatePassword has no special-character check.
  // Expected on unfixed code: no ValidationError thrown → test FAILS.
  describe("Test 1.6 — Password missing special character", () => {
    it('sanitizeRegistrationPayload with password "Password1" (no special char) should throw a ValidationError', () => {
      expect(() =>
        sanitizeRegistrationPayload({
          organizationName: "Acme",
          fullName: "Jane Doe",
          email: "jane@gmail.com",
          password: "Password1"
        })
      ).toThrow(expect.objectContaining({ name: "ValidationError" }));
    });
  });
});
