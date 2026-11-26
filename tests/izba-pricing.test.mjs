import test from 'node:test';
import assert from 'node:assert/strict';
import { setupPrice, euro } from '../src/izba.ts';

test('Setup price: 349 € + 50 € per extra unit, quote above 5 units', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(setupPrice), [349, 399, 449, 499, 549]);
  assert.equal(setupPrice(6), null);
  assert.equal(euro(409), '409 €');
});
