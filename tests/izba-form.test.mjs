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

const submission = () => new Request('https://izba.kompozitor.si/api/izba', {
  method: 'POST',
  headers: { Accept: 'application/json' },
  body: form([['povezava', 'booking.com/x'], ['email', 'gost@example.com'], ['to', 'other@example.com']]),
});

test('Sends to the private recipient setting and uses the visitor as Reply-To', async () => {
  const sent = [];
  const response = await worker.fetch(submission(), {
    IZBA_RECIPIENT: 'inbox@example.com',
    EMAIL: { send: async (message) => sent.push(message) },
  });
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'inbox@example.com');
  assert.equal(sent[0].from.email, 'anze@kompozitor.si');
  assert.equal(sent[0].replyTo, 'gost@example.com');
});

test('Does not send without one configured recipient', async () => {
  const EMAIL = { send: async () => assert.fail('Must not send') };
  for (const IZBA_RECIPIENT of [undefined, 'one@example.com,two@example.com']) {
    const response = await worker.fetch(submission(), { EMAIL, IZBA_RECIPIENT });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false });
  }
});

test('Logs the email failure code without exposing it to the visitor', async (t) => {
  const log = t.mock.method(console, 'error', () => {});
  const response = await worker.fetch(submission(), {
    IZBA_RECIPIENT: 'inbox@example.com',
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

test('Redirects legacy Izba URLs on the apex to the subdomain, not preview URLs', async () => {
  const env = { ASSETS: { fetch: () => new Response('preview') } };
  for (const path of ['/izba', '/izba/', '/izba/index.html']) {
    const response = await worker.fetch(new Request(`https://kompozitor.si${path}?ref=test`), env);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('Location'), 'https://izba.kompozitor.si/?ref=test');
  }
  const preview = await worker.fetch(new Request('https://kompozitor-si.example.workers.dev/izba/'), env);
  assert.equal(await preview.text(), 'preview');
});
