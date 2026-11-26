import { buildEmail, parseSubmission } from './izba-form';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  EMAIL: {
    send(message: { from: { email: string; name: string }; to: string; replyTo: string; subject: string; text: string }): Promise<unknown>;
  };
}

const FROM = { email: 'izba@kompozitor.si', name: 'Izba' };
const TO = 'anze@kompozitor.si';

function reply(request: Request, status: number, body: Record<string, unknown>) {
  if (request.headers.get('Accept')?.includes('application/json')) return Response.json(body, { status });
  // Fallback for browsers without JavaScript: a plain page with a way back.
  const message = status === 200
    ? 'Hvala! Prejeli smo vašo nastanitev. Predogled vam pošljemo v 3 delovnih dneh.'
    : `Pošiljanje ni uspelo. Pišite nam na ${TO}.`;
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Izba</title><p>${message}</p><p><a href="/izba/">Nazaj na Izbo</a></p>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function handleIzba(request: Request, env: Env) {
  if (Number(request.headers.get('Content-Length') ?? 0) > 20_000) return reply(request, 413, { ok: false });
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(request, 400, { ok: false });
  }
  const parsed = parseSubmission(form);
  if (!parsed.ok) return reply(request, 400, { ok: false, errors: parsed.errors });
  if (parsed.spam) return reply(request, 200, { ok: true });
  try {
    await env.EMAIL.send({ from: FROM, to: TO, replyTo: parsed.data.email, ...buildEmail(parsed.data) });
  } catch (error) {
    console.error('Izba form: sending failed', error);
    return reply(request, 502, { ok: false });
  }
  return reply(request, 200, { ok: true });
}

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/izba') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      return handleIzba(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
