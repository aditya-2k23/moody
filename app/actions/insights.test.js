import { test } from 'node:test';
import assert from 'node:assert';
import { hashText } from '../../utils/hash.js';

test('hashText should generate a consistent 16-character hex hash', () => {
  const input = 'Hello World';
  const hash1 = hashText(input);
  const hash2 = hashText(input);

  assert.strictEqual(hash1, hash2, 'Hash should be consistent for the same input');
  assert.strictEqual(hash1.length, 16, 'Hash length should be 16 characters');
  assert.match(hash1, /^[0-9a-f]{16}$/, 'Hash should be a hex string');
});

test('hashText should trim whitespace from input', () => {
  const inputWithSpace = '  Hello World  ';
  const inputWithoutSpace = 'Hello World';

  const hashWithSpace = hashText(inputWithSpace);
  const hashWithoutSpace = hashText(inputWithoutSpace);

  assert.strictEqual(hashWithSpace, hashWithoutSpace, 'Hash should be the same after trimming whitespace');
});

test('hashText should generate different hashes for different inputs', () => {
  const input1 = 'Journal Entry 1';
  const input2 = 'Journal Entry 2';

  const hash1 = hashText(input1);
  const hash2 = hashText(input2);

  assert.notStrictEqual(hash1, hash2, 'Hashes should be different for different inputs');
});

test('hashText should handle empty or whitespace-only strings', () => {
  const emptyHash = hashText('');
  const spaceHash = hashText('   ');

  assert.strictEqual(emptyHash, spaceHash, 'Empty and whitespace-only strings should have the same hash');
  assert.strictEqual(emptyHash.length, 16, 'Empty hash should still be 16 characters');
});
