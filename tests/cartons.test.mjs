import test from 'node:test';
import assert from 'node:assert/strict';
import { cartons, jump, LANDED, PERIOD } from '../src/lib/cartons.ts';

test('The base lands first, all three boxes hold, and the top leaves first', () => {
  const cues = cartons.map(box => {
    const { move } = jump(box);
    const points = move.values.split(';');
    const times = move.keyTimes.split(';').map(t => Number(t) * PERIOD);
    assert.equal(points[0], box.from.join(' '));
    assert.equal(points.at(-1), points[0], 'No jump at the loop seam');
    assert.equal(times.length, points.length);
    assert.ok(times.every((t, i) => !i || t > times[i - 1]));
    const hold = times.findLastIndex(t => t <= LANDED);
    assert.equal(points[hold], box.to.join(' '));
    assert.equal(points[hold + 1], points[hold], 'Holds still until the return trip');
    return { landed: times[hold], leaves: times[hold + 1] };
  });
  for (const base of cues.slice(0, 2)) {
    assert.ok(base.landed < cues[2].landed && base.leaves > cues[2].leaves);
  }
});
