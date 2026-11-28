import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('Home is a simple cartoon box stack even before JavaScript runs', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  assert.match(html, /<html lang="sl"/);
  assert.match(html, /content="noindex,follow"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, />kmalu<\/h1>/);
  assert.doesNotMatch(html, /<header\b|<footer\b|id="delo"|Košček za koščkom/);
  assert.match(html, /alt="Kompozitor"/, 'The studio signature must be visible');
  assert.ok(!html.includes('type="range"') && !html.includes('Preludij'), 'No timeline or technical display');
  const art = html.match(/<svg\b[^>]*data-box-loop[^>]*>([\s\S]*?)<\/svg>/)?.[1] ?? '';
  const cartons = art.split('data-carton').slice(1);
  assert.equal(cartons.length, 3, 'Two base boxes and one on top');
  const blueFront = cartons[0].match(/<path\b[^>]*fill="#91b4d3"[^>]*>\s*<animate\b[^>]*values="([^"]+)"/)?.[1];
  assert.ok(blueFront, 'Blue front panel has a folding track');
  const flatFront = 'M-40 0L40 1L18 14L-62 13Z';
  assert.equal(blueFront.split(';').at(-1), flatFront, 'Blue box unfolds all the way at the end of the loop');
  for (const carton of cartons) {
    assert.match(carton, /<path\b[^>]* d="M/, 'The box is already drawn in the static page');
    assert.match(carton, /<animate\b[^>]*attributeName="d"/, 'Its panels fold, not just the whole box moving');
  }
});
for(const path of ['indeks/','studio/'])test('Prototype /'+path,()=>{const html=readFileSync('dist/'+path+'index.html','utf8');assert.match(html,/<html lang="sl"/);assert.equal((html.match(/<h1\b/g)||[]).length,1); for(const text of ['Booking.com','Airbnb','mailto:anze@kompozitor.si','arborbled.si','new-bton.stravs-a','nature-nook.si','apartments-olga.si','apartments-bassanese.stravs-a','ingreen-house.si','studio-miska.stravs-a','<picture','srcset=','noindex'])assert.ok(html.includes(text),text);});test('Published articles are built, listed in the sitemap and linked from the homepage', () => {
  const sitemap = readFileSync('dist/izba/sitemap.xml', 'utf8');
  for (const path of ['', 'clanki/', 'clanki/konec-prevlade-rezervacijskih-platform/']) assert.ok(sitemap.includes(`<loc>https://izba.kompozitor.si/${path}</loc>`), path);
  const article = readFileSync('dist/izba/clanki/konec-prevlade-rezervacijskih-platform/index.html', 'utf8');
  assert.match(article, /<link rel="canonical" href="https:\/\/izba\.kompozitor\.si\/clanki\/konec-prevlade-rezervacijskih-platform\/"/);
  assert.match(article, /"@type":"BlogPosting"/);
  assert.match(readFileSync('dist/izba/index.html', 'utf8'), /href="\/clanki\/"/);
});
