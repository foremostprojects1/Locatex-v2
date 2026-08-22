/**
 * Extracts the repeated `.homelengo-box` property-card markup from the legacy
 * template so it can be rendered by a single <PropertyCard /> component.
 */
import fs from 'node:fs';
import path from 'node:path';

export const LEGACY_DIR = path.resolve(
  process.cwd(),
  '../../../../homelengohtml-10/homelengohtml-10/homelengo-package/homelengo',
);

/** Returns [start, end) of the element that starts at `start` in `html`. */
export function matchElement(html, start) {
  const nameMatch = /^<([a-zA-Z][\w:-]*)/.exec(html.slice(start));
  if (!nameMatch) return null;
  const tag = nameMatch[1].toLowerCase();
  let depth = 0;
  let i = start;
  const openRe = new RegExp(`<${tag}(\\s|>|/)`, 'gi');
  const closeRe = new RegExp(`</${tag}\\s*>`, 'gi');
  while (i < html.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const open = openRe.exec(html);
    const close = closeRe.exec(html);
    if (!close) return null;
    if (open && open.index < close.index) {
      depth++;
      i = open.index + 1;
    } else {
      depth--;
      i = close.index + close[0].length;
      if (depth === 0) return [start, i];
    }
  }
  return null;
}

const text = (html) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

function pick(re, html, group = 1) {
  const m = re.exec(html);
  return m ? m[group] : null;
}

export function parseCard(html) {
  const card = {};
  card.className = pick(/^<div class="homelengo-box([^"]*)"/, html) || '';
  card.image = pick(/<img[^>]*?data-src="([^"]+)"/, html) || pick(/<div class="images-style">\s*<img[^>]*?src="([^"]+)"/, html);
  card.imageAlt = pick(/<div class="images-style">[\s\S]*?<img[^>]*?alt="([^"]*)"/, html) || 'img';
  card.href = pick(/<a href="([^"]+)" class="images-group"/, html);

  const tagBlock = pick(/<div class="top">([\s\S]*?)<\/div>/, html);
  card.tags = [];
  if (tagBlock) {
    const tagRe = /<li class="([^"]*)">([^<]*)<\/li>/g;
    let m;
    while ((m = tagRe.exec(tagBlock)) !== null) {
      card.tags.push({ className: m[1], label: m[2].trim() });
    }
    card.tagListClass = pick(/<ul class="([^"]*)">/, tagBlock) || 'd-flex gap-6';
  }

  const bottom = pick(/<div class="bottom">([\s\S]*?)<\/a>/, html);
  const locationDiv = pick(/<div class="location">([\s\S]*?)<\/div>/, html);
  card.location = bottom ? text(bottom) : locationDiv ? text(locationDiv) : null;
  card.locationInImage = Boolean(bottom);
  card.locationTextClass = locationDiv
    ? pick(/<span class="([^"]*)">/, locationDiv)
    : null;

  const titleAnchor = /<h6 class="([^"]*)"><a href="([^"]+)" class="([^"]*)">([\s\S]*?)<\/a>/.exec(html);
  if (titleAnchor) {
    card.titleClass = titleAnchor[1];
    card.href = card.href || titleAnchor[2];
    card.titleLinkClass = titleAnchor[3];
    card.title = text(titleAnchor[4]);
  }

  card.meta = [];
  const metaRe = /<li class="item">\s*<i class="icon ([^"]+)"><\/i>\s*<span class="text-variant-1">([^<]*)<\/span>\s*<span class="fw-6">([^<]*)<\/span>/g;
  let mm;
  while ((mm = metaRe.exec(html)) !== null) {
    card.meta.push({ icon: mm[1], label: mm[2].trim(), value: mm[3].trim() });
  }

  card.description = pick(/<p class="description[^"]*"[^>]*>([\s\S]*?)<\/p>/, html);
  if (card.description) card.description = text(card.description);
  card.descriptionClass = pick(/<p class="(description[^"]*)"/, html);

  card.avatar = pick(/<div class="avatar[^"]*">\s*<img src="([^"]+)"/, html);
  card.avatarClass = pick(/<div class="(avatar[^"]*)">/, html);
  card.agent = pick(/<div class="avatar[^"]*">[\s\S]*?<\/div>\s*<span>([^<]*)<\/span>/, html);
  card.price = pick(/<h6 class="price">([^<]*)<\/h6>/, html);
  card.priceTag = 'h6';
  if (!card.price) {
    card.price = pick(/<div class="price">([^<]*)<\/div>/, html);
    if (card.price) card.priceTag = 'div';
  }
  return card;
}

export function extractCards(html) {
  const cards = [];
  const re = /<div class="homelengo-box[^"]*">/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const range = matchElement(html, m.index);
    if (!range) continue;
    const source = html.slice(range[0], range[1]);
    cards.push({ start: range[0], end: range[1], source, data: parseCard(source) });
    re.lastIndex = range[1];
  }
  return cards;
}

if (process.argv[1] && process.argv[1].endsWith('parseCards.js')) {
  const files = fs.readdirSync(LEGACY_DIR).filter((f) => f.endsWith('.html'));
  const seen = new Map();
  let total = 0;
  const issues = [];
  for (const file of files) {
    const html = fs.readFileSync(path.join(LEGACY_DIR, file), 'utf8');
    for (const card of extractCards(html)) {
      total++;
      const key = JSON.stringify(card.data);
      if (!seen.has(key)) seen.set(key, { data: card.data, count: 0, files: new Set() });
      const entry = seen.get(key);
      entry.count++;
      entry.files.add(file);
      const d = card.data;
      if (!d.title || !d.image || !d.price || d.meta.length === 0) {
        issues.push({ file, data: d, source: card.source.slice(0, 200) });
      }
    }
  }
  console.log('total cards:', total, 'unique:', seen.size);
  console.log('incomplete parses:', issues.length);
  for (const issue of issues.slice(0, 5)) console.log(issue.file, JSON.stringify(issue.data).slice(0, 400));
  const sample = [...seen.values()].slice(0, 2);
  console.log(JSON.stringify(sample.map((s) => s.data), null, 1).slice(0, 2000));
}
