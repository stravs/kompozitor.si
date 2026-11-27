import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const file = 'dist/izba/index.html';
test('Research proposal is a coherent, honest sales preview', () => {
  assert.ok(existsSync(file), 'Missing consolidated proposal');
  const html = readFileSync(file, 'utf8');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<span aria-hidden="true"[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(heading, 'Iz vašega Booking.com/Airbnb oglasa do spletne strani po meri.');
  assert.doesNotMatch(html, /noindex/, 'Izba is live in search');
  assert.match(html, /rel="canonical" href="https:\/\/izba\.kompozitor\.si\/"/);
  assert.ok(!html.includes('Primerjava prototipov'));
  const sections = ['primer', 'postopek', 'ponudba', 'cene', 'vzdrzevanje', 'vprasanja', 'stik'];
  const positions = sections.map(id => html.indexOf(`id="${id}"`));
  assert.ok(positions.every((p, i) => p > 0 && (i === 0 || p > positions[i - 1])));
  const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
  assert.match(header, /href="#cene"/);
  assert.doesNotMatch(header, /class="[^"]*\bhidden\b/);
  const calc = html.match(/<div\b[^>]*data-calc[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  assert.deepEqual([...calc.matchAll(/<input\b[^>]*type="radio"[^>]*value="(\d+)"/g)].map(([, v]) => v), ['1', '2', '3', '4', '5', '6']);
  assert.match(calc, /value="1"[^>]*checked/);
  assert.match(calc, /data-out="setup"[^>]*>349 €</);
  assert.match(calc, /Vzdrževanje<\/p>[\s\S]*?>60 €<\/p>[\s\S]*?\+ domena/);
  assert.doesNotMatch(html, /90 €\/leto|60 ali 90 €/);
  const contact = html.match(/<section\b[^>]*id="stik"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const form = contact.match(/<form\b[^>]*>/)?.[0] ?? '';
  assert.match(form, /action="\/api\/izba"/, 'Form posts to the Worker that delivers it');
  assert.match(form, /method="post"/);
  for (const name of ['povezava', 'email', 'ime', 'telefon', 'enote', 'sporocilo']) assert.match(contact, new RegExp(`name="${name}"`), name);
  assert.match(contact, /href="tel:\+38669678887"/);
  assert.match(contact, /href="mailto:anze@kompozitor\.si"/);
  assert.doesNotMatch(contact, /Za Izbo stoji/);
  assert.match(html, /loading="eager"/);
  assert.match(html, /srcset=/);
});

test('Pricing links to what the annual maintenance fee covers', () => {
  const html = readFileSync(file, 'utf8');
  assert.doesNotMatch(html, /name="paleta"/);
  assert.match(html, /href="#vzdrzevanje"/);
  const maintenance = html.match(/<section\b[^>]*id="vzdrzevanje"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  for (const item of ['dosegljiva', 'ključavnica', 'ne deluje', 'fotografijo', 'besedilo', 'ceno', 'brez doplačila', 'dogovorjeni obseg']) assert.ok(maintenance.includes(item), item);
  assert.match(maintenance, /href="mailto:anze@kompozitor\.si(?:\?[^"]*)?"/);
});

test('Hero showcase slides lead to their projects on the page', () => {
  const html = readFileSync(file, 'utf8');
  const hero = html.match(/<main\b[^>]*>\s*<section\b[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const feature = hero.match(/<figure\b[^>]*>([\s\S]*?)<\/figure>/)?.[1] ?? '';
  const targets = [...feature.matchAll(/<a\b[^>]*href="#([^"]+)"/g)].map(([, id]) => id);
  assert.deepEqual(targets, ['ingreen', 'nature-nook', 'apartments-olga']);
  for (const id of targets) assert.match(html, new RegExp(`<article\\b[^>]*id="${id}"`));
  assert.doesNotMatch(feature, /href="https?:/);
});

test('Selected work links to Nature Nook, Apartments Olga, InGreen, and Rose in Winter in order', () => {
  const html = readFileSync(file, 'utf8');
  const section = html.match(/<section\b[^>]*\bid="primer"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
  const title = section.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '';
  assert.ok(title, 'Selected work needs a heading');
  assert.doesNotMatch(title, /\b(?:trije|tri|3)\b/i);
  assert.doesNotMatch(section, />\s*0[1-9]\s*\/\s*<\/span>/, 'Project cards should not be numbered');
  const articles = [...section.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article>/g)];
  const cards = articles.map(([, , card]) => card);
  const expected = [
    ['Nature Nook', 'https://nature-nook.si/'],
    ['Apartments Olga', 'https://apartments-olga.si/'],
    ['InGreen', 'https://ingreen-house.si/'],
    ['Rose in Winter', 'https://roseinwinter.com/'],
  ];
  assert.deepEqual(articles.map(([, attrs]) => attrs.match(/aria-label="([^"]*)"/)?.[1]), expected.map(([name]) => name));
  const radios = [...section.matchAll(/<input\b[^>]*name="projekt"[^>]*>/g)].map(([tag]) => tag);
  assert.deepEqual(radios.map(tag => tag.match(/value="([^"]+)"/)?.[1]), ['nature-nook', 'apartments-olga', 'ingreen', 'rose-in-winter'], 'Projects switch without JS');
  assert.deepEqual(radios.map(tag => /\bchecked\b/.test(tag)), [true, false, false, false]);
  expected.forEach(([name, url], i) => {
    assert.ok(cards[i].includes(`href="${url}"`), `${name} must link to the project`);
    assert.match(cards[i], /<img\b[^>]*src="[^"]*-full-desktop[^"]*"/);
    assert.match(cards[i], /<img\b[^>]*src="[^"]*-full-mobile[^"]*"/);
    const panes = [...cards[i].matchAll(/<div\b[^>]*role="region"[^>]*tabindex="0"[^>]*aria-label="([^"]+)"[^>]*overflow-y-auto/g)];
    assert.deepEqual(panes.map(([, label]) => label), [`Računalniški predogled: ${name}`, `Mobilni predogled: ${name}`], 'Both previews scroll');
  });
});

test('Izba head: link preview, structured data, font preload, inline CSS', () => {
  const html = readFileSync(file, 'utf8');
  const og = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert.match(og ?? '', /^https:\/\/izba\.kompozitor\.si\/_astro\/[^"]+\.jpg$/);
  assert.ok(existsSync('dist' + new URL(og).pathname), 'og:image file must be built');
  assert.match(html, /<meta property="og:url" content="https:\/\/izba\.kompozitor\.si\/"/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/);
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld['@type'], 'Service');
  assert.equal(ld.url, 'https://izba.kompozitor.si/');
  for (const href of html.match(/<link rel="preload" href="[^"]+" as="font"/g) ?? []) {
    assert.ok(existsSync('dist' + href.match(/href="([^"]+)"/)[1]), href);
  }
  assert.equal((html.match(/as="font"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /<link rel="stylesheet"/);
  // Only the first hero slide loads eagerly.
  assert.equal((html.match(/fetchpriority="high"/g) ?? []).length, 1);
});
