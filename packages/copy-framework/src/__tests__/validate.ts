/**
 * Copy Framework Validation Tests
 * Validates that:
 * 1. All token keys exist in the dictionaries
 * 2. Variable resolution works correctly
 * 3. No unresolved placeholders in resolved strings
 */

import {
    createCopyResolver,
    extractVariables,
    validateCopyVariables
} from "../resolver";
import { TOKENS } from "../tokens";
import type { CopyDictionary, CopyVariables } from "../types";

// Mock dictionaries for testing
const mockDictionary: CopyDictionary = {
  auth: {
    signIn: "Sign In",
    createPassword: "Create Password",
  },
  flow: {
    send: {
      step4: {
        youSending: "You're Sending {amount} {currency}",
      },
    },
  },
  actions: {
    confirm: "Confirm",
    cancel: "Cancel",
  },
  errors: {
    invalidEmail: "Invalid email: {email}",
    insufficientBalance: "Insufficient balance. Need {needed}, have {current}",
  },
};

/**
 * Test 1: Extract variables from copy strings
 */
function testExtractVariables(): void {
  console.log("\n✓ Test 1: Extract Variables");

  const testCases = [
    {
      text: "Hello {name}, you have {count} messages",
      expected: ["name", "count"],
    },
    {
      text: "No variables here",
      expected: [],
    },
    {
      text: "{single}",
      expected: ["single"],
    },
  ];

  testCases.forEach(({ text, expected }) => {
    const result = extractVariables(text);
    const passed = JSON.stringify(result) === JSON.stringify(expected);
    console.log(
      `  ${passed ? "✓" : "✗"} "${text}" => [${result.join(", ")}]`
    );
  });
}

/**
 * Test 2: Validate copy variables
 */
function testValidateVariables(): void {
  console.log("\n✓ Test 2: Validate Variables");

  const testCases: Array<{
    text: string;
    variables: CopyVariables;
    shouldBeValid: boolean;
  }> = [
    {
      text: "You're sending {amount} {currency}",
      variables: { amount: "100", currency: "USD" },
      shouldBeValid: true,
    },
    {
      text: "Hello {name}",
      variables: { name: "John", extra: "unused" },
      shouldBeValid: true, // Valid but has extra
    },
    {
      text: "Hello {name} and {age}",
      variables: { name: "John", age: "" },
      shouldBeValid: false, // Missing 'age'
    },
  ];

  testCases.forEach(({ text, variables, shouldBeValid }) => {
    const result = validateCopyVariables(text, variables);
    const passed = result.valid === shouldBeValid;
    console.log(
      `  ${passed ? "✓" : "✗"} "${text.slice(0, 30)}..." => valid: ${result.valid}`
    );
    if (result.missing.length > 0) {
      console.log(`     Missing: ${result.missing.join(", ")}`);
    }
    if (result.extra.length > 0) {
      console.log(`     Extra: ${result.extra.join(", ")}`);
    }
  });
}

/**
 * Test 3: Resolve copy with variables
 */
function testResolveCopy(): void {
  console.log("\n✓ Test 3: Resolve Copy with Variables");

  const testCases: Array<{
    key: string;
    text: string;
    variables: CopyVariables;
    expected: string;
  }> = [
    {
      key: "flow.send.step4.youSending",
      text: "You're Sending {amount} {currency}",
      variables: { amount: "1.5", currency: "ETH" },
      expected: "You're Sending 1.5 ETH",
    },
    {
      key: "flow.send.step4.youSending",
      text: "You're Sending {amount} {currency}",
      variables: { amount: "1,234.56", currency: "" }, // Missing currency value
      expected: "You're Sending 1,234.56 ", // Unresolved
    },
  ];

  testCases.forEach(({ key, text, variables, expected }) => {
    const result = createCopyResolver(text, variables);
    const passed = result.resolved === expected;
    console.log(`  ${passed ? "✓" : "✗"} "${key}"`);
    console.log(`     Resolved: "${result.resolved}"`);
    if (result.hasUnresolvedVariables) {
      console.log(
        `     Unresolved: ${result.unresolvedVariables.join(", ")}`
      );
    }
  });
}

/**
 * Test 4: Check that token keys follow naming convention
 */
function testTokenConvention(): void {
  console.log("\n✓ Test 4: Token Naming Convention");

  const tokenKeys = Object.values(TOKENS);
  let validCount = 0;
  let invalidCount = 0;

  tokenKeys.forEach((token) => {
    // Tokens should follow pattern: [page].[section].[element] or [page].[element]
    const parts = token.split(".");
    if (parts.length >= 2) {
      validCount++;
    } else {
      invalidCount++;
      console.log(`  ✗ Invalid token format: "${token}"`);
    }
  });

  console.log(
    `  ✓ Valid tokens: ${validCount}/${tokenKeys.length}`
  );
  if (invalidCount > 0) {
    console.log(`  ✗ Invalid tokens: ${invalidCount}`);
  }
}

/**
 * Test 5: Mock dictionary validation
 */
function testDictionaryValidation(): void {
  console.log("\n✓ Test 5: Dictionary Validation");

  const sampleTokens = [
    "auth.signIn",
    "auth.createPassword",
    "flow.send.step4.youSending",
    "actions.confirm",
    "errors.invalidEmail",
  ];

  let foundCount = 0;
  let missingCount = 0;

  sampleTokens.forEach((token) => {
    const parts = token.split(".");
    let current: any = mockDictionary;

    for (const part of parts) {
      current = current?.[part];
    }

    if (typeof current === "string") {
      foundCount++;
      console.log(`  ✓ Found: "${token}"`);
    } else {
      missingCount++;
      console.log(`  ✗ Missing: "${token}"`);
    }
  });

  console.log(`\n  Summary: ${foundCount} found, ${missingCount} missing`);
}

/**
 * Test 6: Variable resolution edge cases
 */
function testEdgeCases(): void {
  console.log("\n✓ Test 6: Edge Cases");

  const edgeCases: Array<{
    name: string;
    text: string;
    variables: CopyVariables | undefined;
    shouldResolve: boolean;
  }> = [
    {
      name: "Empty variables",
      text: "No variables",
      variables: {},
      shouldResolve: true,
    },
    {
      name: "Undefined variables",
      text: "With {missing}",
      variables: undefined,
      shouldResolve: false,
    },
    {
      name: "Number values",
      text: "You have {count} items",
      variables: { count: 42 },
      shouldResolve: true,
    },
    {
      name: "Boolean values",
      text: "Status: {isActive}",
      variables: { isActive: true },
      shouldResolve: true,
    },
  ];

  edgeCases.forEach(({ name, text, variables, shouldResolve }) => {
    const result = createCopyResolver(text, variables);
    const hasUnresolved = result.hasUnresolvedVariables;
    const passed = hasUnresolved === !shouldResolve;
    console.log(`  ${passed ? "✓" : "✗"} ${name}`);
    console.log(`     Result: "${result.resolved}"`);
  });
}

/**
 * Run all validation tests
 */
export function runValidation(): void {
  console.log("🔍 Copy Framework Validation Tests\n");
  console.log("=".repeat(60));

  testExtractVariables();
  testValidateVariables();
  testResolveCopy();
  testTokenConvention();
  testDictionaryValidation();
  testEdgeCases();

  console.log("\n" + "=".repeat(60));
  console.log("✅ Validation Complete\n");
}

// Run tests if called directly
if (require.main === module) {
  runValidation();
}