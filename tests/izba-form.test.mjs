import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSubmission, buildEmail } from '../worker/izba-form.ts';
import worker from '../worker/index.ts';

const form = (entries) => {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
};

test('Requires a listing link and a valid email', () => {
  const result = parseSubmission(form([['povezava', ''], ['email', 'nope']]));
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result.errors).sort(), ['email', 'povezava']);
});

test('Accepts links without https, ignores empty extra links', () => {
  const result = parseSubmission(form([
    ['povezava', 'www.booking.com/hotel/si/nature-nook.html'],
    ['povezava', ''],
    ['povezava', 'https://www.airbnb.com/rooms/123'],
    ['email', 'gost@example.com'],
    ['enote', '6'],
  ]));
  assert.equal(result.ok, true);
  assert.equal(result.spam, false);
  assert.deepEqual(result.data.links, ['https://www.booking.com/hotel/si/nature-nook.html', 'https://www.airbnb.com/rooms/123']);
  const mail = buildEmail(result.data);
  assert.equal(mail.subject, 'Izba: nov predogled (booking.com)');
  assert.match(mail.text, /Število enot: 6 ali več/);
  assert.match(mail.text, /- https:\/\/www\.airbnb\.com\/rooms\/123/);
});

test('Rejects text that is not a link', () => {
  const result = parseSubmission(form([['povezava', 'moj apartma'], ['email', 'a@b.si']]));
  assert.equal(result.ok, false);
  assert.ok(result.errors.povezava);
});

test('Flags the hidden honeypot field as spam', () => {
  const result = parseSubmission(form([['povezava', 'booking.com/x'], ['email', 'a@b.si'], ['spletna_stran', 'http://spam']]));
  assert.equal(result.ok, true);
  assert.equal(result.spam, true);
});

test('Logs the email failure code without exposing it to the visitor', async (t) => {
  const log = t.mock.method(console, 'error', () => {});
  const request = new Request('https://izba.kompozitor.si/api/izba', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: form([['povezava', 'booking.com/x'], ['email', 'gost@example.com']]),
  });
  const response = await worker.fetch(request, {
    EMAIL: {
      async send() {
        throw Object.assign(new Error('Delivery error for gost@example.com'), { code: 'E_SENDER_DOMAIN_NOT_CONFIGURED' });
      },
    },
  });
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false });
  assert.deepEqual(log.mock.calls.map(({ arguments: args }) => args), [
    ['Izba form: sending failed (E_SENDER_DOMAIN_NOT_CONFIGURED)'],
  ]);
});
