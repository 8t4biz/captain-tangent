/**
 * Test suite for decisionRules.ts
 *
 * To run these tests, install vitest:
 * npm install -D vitest
 *
 * Then add to package.json scripts:
 * "test": "vitest"
 *
 * For now, this file serves as documentation of expected behavior
 * and can be manually verified by importing and calling the test functions.
 */

import { computeVerdict } from '../decisionRules';
import type { TestInput } from '../types';

// Simple test helpers
function assertEquals<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

// Test 1: Double-Down for strong result with low/medium effort
export function testDoubleDownStrongResult() {
  const input: TestInput = {
    type: 'landing',
    effort: 'S',
    target: 10,
    result: 12,
    n: 150,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, 'Double-Down', 'Verdict should be Double-Down');
  assertEquals(output.rationale, 'Strong result on low/medium effort.', 'Rationale should match');
  assertEquals(output.evidenceLevel, 'high', 'Evidence level should be high');

  console.log('✓ testDoubleDownStrongResult passed');
}

// Test 2: Kill for underperforming test with low sample
export function testKillUnderperforming() {
  const input: TestInput = {
    type: 'form',
    effort: 'M',
    target: 10,
    result: 3,
    n: 50,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, 'Kill', 'Verdict should be Kill');
  assertEquals(output.rationale, 'Low sample and underperforming.', 'Rationale should match');
  assertEquals(output.evidenceLevel, 'medium', 'Evidence level should be medium');

  console.log('✓ testKillUnderperforming passed');
}

// Test 3: Iterate for mixed results
export function testIterateMixedResults() {
  const input: TestInput = {
    type: 'micro-app',
    effort: 'L',
    target: 10,
    result: 8,
    n: 100,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, 'Iterate', 'Verdict should be Iterate');
  assertEquals(output.rationale, 'Mixed or inconclusive.', 'Rationale should match');
  assertEquals(output.evidenceLevel, 'medium', 'Evidence level should be medium');

  console.log('✓ testIterateMixedResults passed');
}

// Test 4: High confidence with low effort
export function testHighConfidenceLowEffort() {
  const input: TestInput = {
    type: 'landing',
    effort: 'S',
    target: 10,
    confidence: 85,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, 'Double-Down', 'Verdict should be Double-Down');
  assertEquals(output.rationale, 'High confidence with low/medium effort.', 'Rationale should match');
  assertEquals(output.evidenceLevel, 'high', 'Evidence level should be high');

  console.log('✓ testHighConfidenceLowEffort passed');
}

// Test 5: Low confidence should kill
export function testLowConfidence() {
  const input: TestInput = {
    type: 'form',
    effort: 'L',
    target: 10,
    confidence: 25,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, 'Kill', 'Verdict should be Kill');
  assertEquals(output.rationale, 'Low confidence.', 'Rationale should match');
  assertEquals(output.evidenceLevel, 'low', 'Evidence level should be low');

  console.log('✓ testLowConfidence passed');
}

// Test 6: Medium confidence should iterate
export function testMediumConfidence() {
  const input: TestInput = {
    type: 'micro-app',
    effort: 'M',
    target: 10,
    confidence: 55,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, 'Iterate', 'Verdict should be Iterate');
  assertEquals(output.rationale, 'Medium confidence, needs testing.', 'Rationale should match');
  assertEquals(output.evidenceLevel, 'medium', 'Evidence level should be medium');

  console.log('✓ testMediumConfidence passed');
}

// Test 7: Evidence level categorization
export function testEvidenceLevelCategorization() {
  const lowSample: TestInput = {
    type: 'landing',
    effort: 'M',
    target: 10,
    result: 8,
    n: 30,
  };

  const mediumSample: TestInput = {
    type: 'landing',
    effort: 'M',
    target: 10,
    result: 8,
    n: 100,
  };

  const highSample: TestInput = {
    type: 'landing',
    effort: 'M',
    target: 10,
    result: 8,
    n: 200,
  };

  assertEquals(computeVerdict(lowSample).evidenceLevel, 'low', 'Low sample should have low evidence');
  assertEquals(computeVerdict(mediumSample).evidenceLevel, 'medium', 'Medium sample should have medium evidence');
  assertEquals(computeVerdict(highSample).evidenceLevel, 'high', 'High sample should have high evidence');

  console.log('✓ testEvidenceLevelCategorization passed');
}

// Test 8: Missing data edge case
export function testMissingData() {
  const input: TestInput = {
    type: 'landing',
    effort: 'M',
    target: 10,
  };

  const output = computeVerdict(input);

  assertEquals(output.verdict, null, 'Verdict should be null');
  assertEquals(output.rationale, '', 'Rationale should be empty');
  assertEquals(output.evidenceLevel, 'low', 'Evidence level should be low');

  console.log('✓ testMissingData passed');
}

// Run all tests
export function runAllTests() {
  console.log('Running decisionRules test suite...\n');

  try {
    testDoubleDownStrongResult();
    testKillUnderperforming();
    testIterateMixedResults();
    testHighConfidenceLowEffort();
    testLowConfidence();
    testMediumConfidence();
    testEvidenceLevelCategorization();
    testMissingData();

    console.log('\n✓ All tests passed!');
    return true;
  } catch (error) {
    console.error('\n✗ Test suite failed:', error);
    return false;
  }
}

// Auto-run tests if executed directly (e.g., via ts-node or in browser console)
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
}
