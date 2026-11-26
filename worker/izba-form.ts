export type Submission = {
  links: string[];
  email: string;
  name: string;
  phone: string;
  units: string;
  message: string;
};

export type Parsed =
  | { ok: true; spam: boolean; data: Submission }
  | { ok: false; errors: Record<string, string> };

const text = (form: FormData, key: string, max: number) =>
  String(form.get(key) ?? '').trim().slice(0, max);

/** Accept pasted links with or without https://. */
function normalizeLink(raw: string) {
  const value = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(value);
    return url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
}

export function parseSubmission(form: FormData): Parsed {
  const errors: Record<string, string> = {};
  const raw = form.getAll('povezava').map((v) => String(v).trim()).filter(Boolean).slice(0, 5);
  const links = raw.map((v) => normalizeLink(v.slice(0, 500)));
  if (!raw.length) errors.povezava = 'Vpišite povezavo do oglasa.';
  else if (links.includes(null)) errors.povezava = 'Povezava ni veljavna. Prilepite jo iz brskalnika.';

  const email = text(form, 'email', 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Vpišite veljaven e-naslov.';

  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    // Hidden field that people never see; bots fill it in.
    spam: text(form, 'spletna_stran', 200) !== '',
    data: {
      links: links as string[],
      email,
      name: text(form, 'ime', 100),
      phone: text(form, 'telefon', 40),
      units: text(form, 'enote', 2),
      message: text(form, 'sporocilo', 2000),
    },
  };
}

export function buildEmail(data: Submission) {
  const units = data.units === '6' ? '6 ali več' : data.units || '—';
  const host = new URL(data.links[0]).hostname.replace(/^www\./, '');
  return {
    subject: `Izba: nov predogled (${host})`,
    text: [
      'Nova prijava za brezplačen predogled.',
      '',
      `Ime: ${data.name || '—'}`,
      `E-pošta: ${data.email}`,
      `Telefon: ${data.phone || '—'}`,
      `Število enot: ${units}`,
      '',
      'Povezave:',
      ...data.links.map((link) => `- ${link}`),
      '',
      'Sporočilo:',
      data.message || '—',
    ].join('\n'),
  };
}
