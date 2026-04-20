import { describe, it, expect } from "vitest";
import { validateFullName, validateEmail, validatePassword } from "./validation.js";

// Preservation tests — these MUST PASS on unfixed code.
// They establish the baseline behavior that must be preserved after the fix.

describe("Preservation Tests (frontend)", () => {
  // Test 2.1 — Valid full name preservation
  // These inputs are NOT in the bug condition domain (valid alpha names, 3–20 chars).
  // Expected on unfixed code: validateFullName returns "" → test PASSES.
  describe("Test 2.1 — Valid full name preservation", () => {
    it('validateFullName("Jane") should return ""', () => {
      expect(validateFullName("Jane")).toBe("");
    });

    it('validateFullName("Jane Doe") should return ""', () => {
      expect(validateFullName("Jane Doe")).toBe("");
    });

    it('validateFullName("Alexander Hamilton") (18 chars) should return ""', () => {
      expect(validateFullName("Alexander Hamilton")).toBe("");
    });

    it('validateFullName("A B") (3 chars) should return ""', () => {
      expect(validateFullName("A B")).toBe("");
    });
  });

  // Test 2.2 — Valid Gmail email preservation
  // These inputs are NOT in the bug condition domain (valid @gmail.com addresses).
  // Expected on unfixed code: validateEmail returns "" → test PASSES.
  describe("Test 2.2 — Valid Gmail email preservation", () => {
    it('validateEmail("jane@gmail.com") should return ""', () => {
      expect(validateEmail("jane@gmail.com")).toBe("");
    });

    it('validateEmail("j.doe+tag@gmail.com") should return ""', () => {
      expect(validateEmail("j.doe+tag@gmail.com")).toBe("");
    });

    it('validateEmail("user123@gmail.com") should return ""', () => {
      expect(validateEmail("user123@gmail.com")).toBe("");
    });
  });

  // Test 2.3 — Valid password preservation
  // These inputs are NOT in the bug condition domain (passwords with all required classes).
  // Expected on unfixed code: validatePassword returns "" → test PASSES.
  describe("Test 2.3 — Valid password preservation", () => {
    it('validatePassword("Password1!") should return ""', () => {
      expect(validatePassword("Password1!")).toBe("");
    });

    it('validatePassword("Abcde1@fg") should return ""', () => {
      expect(validatePassword("Abcde1@fg")).toBe("");
    });

    it('validatePassword("Secure#9Pass") should return ""', () => {
      expect(validatePassword("Secure#9Pass")).toBe("");
    });
  });
});

// Bug condition exploration tests — these MUST FAIL on unfixed code.
// Failure confirms the bugs exist. DO NOT fix the code or tests when they fail.

describe("Bug Condition Exploration Tests (frontend)", () => {
  // Test 1.1 — Full name length overflow
  // Bug: fullNameMax is 50 instead of 20, so names up to 50 chars are accepted.
  // Expected on unfixed code: validateFullName returns "" (no error) → test FAILS.
  describe("Test 1.1 — Full name length overflow", () => {
    it('validateFullName("Alexander Hamilton Jr") (21 chars) should return a non-empty error', () => {
      const result = validateFullName("Alexander Hamilton Jr");
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });

    it('validateFullName("A".repeat(21)) should return a non-empty error', () => {
      const result = validateFullName("A".repeat(21));
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // Test 1.2 — Non-Gmail email
  // Bug: EMAIL_PATTERN accepts any domain, not just @gmail.com.
  // Expected on unfixed code: validateEmail returns "" (no error) → test FAILS.
  describe("Test 1.2 — Non-Gmail email", () => {
    it('validateEmail("user@company.com") should return a non-empty error', () => {
      const result = validateEmail("user@company.com");
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });

    it('validateEmail("user@yahoo.com") should return a non-empty error', () => {
      const result = validateEmail("user@yahoo.com");
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // Test 1.3 — Password missing special character
  // Bug: validatePassword has no special-character check.
  // Expected on unfixed code: validatePassword returns "" (no error) → test FAILS.
  describe("Test 1.3 — Password missing special character", () => {
    it('validatePassword("Password1") should return a non-empty error', () => {
      const result = validatePassword("Password1");
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });

    it('validatePassword("Abcdefg1") should return a non-empty error', () => {
      const result = validatePassword("Abcdefg1");
      expect(result).not.toBe("");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
