/**
 * Generates the React page modules from the legacy HTML template.
 * Run with: node tools/generate.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { htmlToJsx } from './htmlToJsx.js';
import { extractCards, matchElement, LEGACY_DIR } from './parseCards.js';
import { extractPage } from './extractContent.js';
import { PAGES, ROUTE_BY_FILE } from './pages.js';

const SRC = path.resolve(process.cwd(), 'src');
const CARD_TOKEN = (i) => `@@CARD_${i}@@`;
const PARTNER_TOKEN = '@@PARTNER@@';

const rewriteAsset = (value) =>
  /^(images|fonts)\//.test(value) ? `/${value}` : value;

function rewriteHref(value) {
  if (!value) return value;
  const [file, hash = ''] = value.split('#');
  const route = ROUTE_BY_FILE[file];
  if (route) return route + (hash ? `#${hash}` : '');
  return value;
}

const isInternalLink = (value) =>
  Boolean(value) && Object.prototype.hasOwnProperty.call(ROUTE_BY_FILE, value.split('#')[0]);

function transformAttr(attr, tag) {
  const name = attr.name.toLowerCase();
  let value = attr.value;

  if (tag === 'img' && name === 'data-src') return null;
  // Generated markup is uncontrolled; React needs the default* props here.
  if ((tag === 'input' || tag === 'textarea' || tag === 'select') && name === 'value') {
    return { name: 'defaultValue', value };
  }
  if (tag === 'input' && name === 'checked') return { name: 'defaultChecked', value: value ?? '' };
  if (tag === 'img' && name === 'class') {
    const classes = (value || '').split(/\s+/).filter((c) => c && c !== 'lazyload');
    if (!classes.length) return null;
    return { name: attr.name, value: classes.join(' ') };
  }

  if (['src', 'href', 'poster', 'data-bg', 'data-src'].includes(name) && value) {
    value = rewriteAsset(value);
    if (name === 'href') value = rewriteHref(value);
  }
  if (name === 'style' && value) {
    value = value.replace(/url\((["']?)(images\/[^)"']+)\1\)/g, (_, q, p) => `url(${q}/${p}${q})`);
  }
  return { name: attr.name, value };
}

/** `<a href="about-us.html">` becomes `<Link to="/about-us">`. */
function renameTag(tag, attrs) {
  if (tag !== 'a') return null;
  const href = attrs.find((a) => a.name.toLowerCase() === 'href');
  if (!href || !isInternalLink(href.value)) return null;
  return {
    name: 'Link',
    attrs: attrs.map((a) =>
      a.name.toLowerCase() === 'href'
        ? { name: 'to', value: rewriteHref(rewriteAsset(a.value)) }
        : a,
    ),
  };
}

export function convert(html) {
  return htmlToJsx(html, { transformAttr, renameTag });
}

// ---------------------------------------------------------------------------
// Property card data
// ---------------------------------------------------------------------------
const cardIndex = new Map(); // JSON key -> index in PROPERTIES
const properties = [];

function registerCard(data) {
  const record = {
    href: rewriteHref(data.href),
    image: rewriteAsset(data.image),
    imageAlt: data.imageAlt,
    tags: data.tags,
    tagListClass: data.tagListClass,
    location: data.location,
    locationInImage: data.locationInImage,
    locationTextClass: data.locationTextClass ?? undefined,
    title: data.title,
    titleClass: data.titleClass,
    titleLinkClass: data.titleLinkClass,
    meta: data.meta,
    description: data.description ?? undefined,
    descriptionClass: data.descriptionClass ?? undefined,
    avatar: rewriteAsset(data.avatar),
    avatarClass: data.avatarClass,
    agent: data.agent,
    price: data.price,
    priceTag: data.priceTag,
  };
  for (const key of Object.keys(record)) {
    if (record[key] === undefined || record[key] === null) delete record[key];
  }
  const key = JSON.stringify(record);
  if (!cardIndex.has(key)) {
    cardIndex.set(key, properties.length);
    properties.push(record);
  }
  return cardIndex.get(key);
}

function replaceCards(html) {
  const cards = [];
  const re = /<div class="homelengo-box[^"]*"[^>]*>/g;
  let out = '';
  let cursor = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    const range = matchElement(html, m.index);
    if (!range) continue;
    const source = html.slice(range[0], range[1]);
    const [parsed] = extractCards(source);
    if (!parsed) continue;
    const extraClass = parsed.data.className.trim().replace(/\s*wow fadeInUp\s*/, ' wow fadeInUp ').trim();
    const wowDelay = /data-wow-delay="([^"]+)"/.exec(m[0])?.[1];
    cards.push({ id: registerCard(parsed.data), className: extraClass, wowDelay });
    out += html.slice(cursor, range[0]) + CARD_TOKEN(cards.length - 1);
    cursor = range[1];
    re.lastIndex = range[1];
  }
  out += html.slice(cursor);
  return { html: out, cards };
}

// ---------------------------------------------------------------------------
// Interactive widgets whose markup was pre-rendered in the static template
// ---------------------------------------------------------------------------
const SELECT_TOKEN = (i) => `@@SELECT_${i}@@`;
const RANGE_TOKEN = (i) => `@@RANGE_${i}@@`;

/** `.nice-select` markup -> <NiceSelect /> */
function replaceNiceSelects(html) {
  const selects = [];
  const re = /<div class="(nice-select[^"]*)"[^>]*>/g;
  let out = '';
  let cursor = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    const range = matchElement(html, m.index);
    if (!range) continue;
    const source = html.slice(range[0], range[1]);
    const options = [];
    const optionRe = /<li data-value(?:="([^"]*)")?[^>]*class="option([^"]*)"[^>]*>([\s\S]*?)<\/li>/g;
    let optionMatch;
    while ((optionMatch = optionRe.exec(source)) !== null) {
      options.push({
        value: optionMatch[1] ?? '',
        label: optionMatch[3].replace(/<[^>]*>/g, '').trim(),
        selected: optionMatch[2].includes('selected'),
      });
    }
    if (!options.length) continue;
    const current = /<span class="current">([\s\S]*?)<\/span>/.exec(source)?.[1].trim();
    const extraClass = m[1].replace('nice-select', '').trim();
    selects.push({ options, current, extraClass });
    out += html.slice(cursor, range[0]) + SELECT_TOKEN(selects.length - 1);
    cursor = range[1];
    re.lastIndex = range[1];
  }
  out += html.slice(cursor);
  return { html: out, selects };
}

/** `.widget-price` markup -> <RangeSliderWidget /> */
const RANGE_CONFIG = {
  'slider-range': {
    min: 100,
    max: 650000,
    start: [100, 650000],
    format: { prefix: '$' },
    inputNames: ['min-value', 'max-value'],
  },
  'slider-range2': {
    min: 20,
    max: 2000,
    start: [500, 1500],
    format: { postfix: ' SqFt' },
    inputNames: ['min-value2', 'max-value2'],
  },
};

function replaceRangeWidgets(html) {
  const widgets = [];
  const re = /<div class="([^"]*\bwidget-price\b[^"]*)">/g;
  let out = '';
  let cursor = 0;
  let m;
  while ((m = re.exec(html)) !== null) {
    const range = matchElement(html, m.index);
    if (!range) continue;
    const source = html.slice(range[0], range[1]);
    const sliderId = /<div id="(slider-range2?)"><\/div>/.exec(source)?.[1];
    if (!sliderId || !RANGE_CONFIG[sliderId]) continue;
    widgets.push({
      className: m[1],
      title: /<span class="title-price[^"]*">([^<]*)<\/span>/.exec(source)?.[1] ?? 'Price:',
      valueClassName: /<div class="caption-price">\s*<span[^>]*class="([^"]*)"/.exec(source)?.[1] ?? 'fw-6',
      ...RANGE_CONFIG[sliderId],
    });
    out += html.slice(cursor, range[0]) + RANGE_TOKEN(widgets.length - 1);
    cursor = range[1];
    re.lastIndex = range[1];
  }
  out += html.slice(cursor);
  return { html: out, widgets };
}

function replacePartnerSection(html) {
  const marker = html.indexOf('<!-- partner -->');
  if (marker === -1) return { html, found: false, withPagination: false };
  const sectionIndex = html.indexOf('<section', marker);
  const range = matchElement(html, sectionIndex);
  if (!range) return { html, found: false, withPagination: false };
  const source = html.slice(range[0], range[1]);
  if (!source.includes('tf-sw-partner')) return { html, found: false, withPagination: false };
  const withPagination = source.includes('sw-pagination-partner');
  return {
    html: html.slice(0, range[0]) + PARTNER_TOKEN + html.slice(range[1]),
    found: true,
    withPagination,
    source,
  };
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------
function indentBody(jsx) {
  // Prettier reformats the emitted files afterwards; keep it simple here.
  return jsx
    .split('\n')
    .map((line) => (line.trim() ? '      ' + line.trim() : ''))
    .join('\n');
}

function emitPage(page) {
  const html = fs.readFileSync(path.join(LEGACY_DIR, page.file), 'utf8');
  const extracted = extractPage(html, page);

  const partner = replacePartnerSection(extracted.content);
  const { html: withCards, cards } = replaceCards(partner.html);
  const { html: withSelects, selects } = replaceNiceSelects(withCards);
  const { html: withTokens, widgets } = replaceRangeWidgets(withSelects);
  let jsx = convert(withTokens);

  jsx = jsx.replace(/@@SELECT_(\d+)@@/g, (_, i) => {
    const select = selects[Number(i)];
    const options = select.options
      .map((option) => `{ value: ${JSON.stringify(option.value)}, label: ${JSON.stringify(option.label)} }`)
      .join(', ');
    const selected = select.options.find((option) => option.selected)
      ?? select.options.find((option) => option.label === select.current);
    const props = [`options={[${options}]}`];
    if (select.extraClass) props.unshift(`className="${select.extraClass}"`);
    if (selected) props.push(`defaultValue=${JSON.stringify(selected.value)}`);
    return `<NiceSelect ${props.join(' ')} />`;
  });

  jsx = jsx.replace(/@@RANGE_(\d+)@@/g, (_, i) => {
    const widget = widgets[Number(i)];
    const props = [
      `title="${widget.title}"`,
      `min={${widget.min}}`,
      `max={${widget.max}}`,
      `start={[${widget.start.join(', ')}]}`,
      `format={${JSON.stringify(widget.format).replace(/"([^"]+)":/g, '$1: ').replace(/"/g, "'")}}`,
      `inputNames={[${widget.inputNames.map((name) => `'${name}'`).join(', ')}]}`,
    ];
    if (widget.valueClassName !== 'fw-6') props.push(`valueClassName="${widget.valueClassName}"`);
    if (widget.className !== 'widget-price') props.push(`className="${widget.className}"`);
    return `<RangeSliderWidget ${props.join(' ')} />`;
  });

  jsx = jsx.replace(/@@CARD_(\d+)@@/g, (_, i) => {
    const card = cards[Number(i)];
    const props = [`property={PROPERTIES[${card.id}]}`];
    if (card.className) props.push(`className="${card.className}"`);
    if (card.wowDelay) props.push(`wowDelay="${card.wowDelay}"`);
    return `<PropertyCard ${props.join(' ')} />`;
  });
  jsx = jsx.replace(PARTNER_TOKEN, partner.withPagination ? '<PartnerSection showPagination />' : '<PartnerSection />');

  const imports = [];
  if (/<Link[\s>]/.test(jsx)) imports.push("import { Link } from 'react-router-dom';");
  if (cards.length) {
    imports.push("import PropertyCard from '../components/common/PropertyCard';");
    imports.push("import { PROPERTIES } from '../data/properties';");
  }
  if (selects.length) imports.push("import NiceSelect from '../components/common/NiceSelect';");
  if (widgets.length) imports.push("import RangeSliderWidget from '../components/common/RangeSliderWidget';");
  if (partner.found) imports.push("import PartnerSection from '../components/sections/PartnerSection';");

  const body = `${imports.join('\n')}

export default function ${page.name}() {
  return (
    <>
${indentBody(jsx)}
    </>
  );
}
`;
  const outDir = path.join(SRC, 'pages');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${page.name}.jsx`), body);
  return { cards: cards.length, partner: partner.found, extracted, partnerSource: partner.source };
}

function main() {
  let partnerSource = null;
  const meta = [];
  for (const page of PAGES) {
    const result = emitPage(page);
    if (result.partnerSource && !partnerSource) partnerSource = result.partnerSource;
    meta.push({
      ...page,
      bodyClass: result.extracted.bodyClass,
      innerClass: result.extracted.innerClass,
      footerClass: result.extracted.footerClass,
      cards: result.cards,
    });
    console.log(page.name.padEnd(22), 'cards:', String(result.cards).padStart(3), result.partner ? 'partner' : '');
  }

  fs.mkdirSync(path.join(SRC, 'data'), { recursive: true });
  fs.writeFileSync(
    path.join(SRC, 'data', 'properties.js'),
    `/**\n * Listing data extracted from the repeated \`.homelengo-box\` markup of the\n * static template. The pages reference these entries by index through\n * <PropertyCard property={PROPERTIES[n]} />.\n */\nexport const PROPERTIES = ${JSON.stringify(properties, null, 2)};\n`,
  );

  if (partnerSource) {
    fs.mkdirSync(path.join(SRC, 'components', 'sections'), { recursive: true });
    // Some pages render pagination bullets as the last child of the carousel.
    let source = partnerSource.replace(
      /\s*<div class="sw-pagination sw-pagination-partner text-center"><\/div>/,
      '',
    );
    const swiperIndex = source.indexOf('<div dir="ltr" class="swiper tf-sw-partner');
    const swiper = matchElement(source, swiperIndex);
    const closingIndex = source.lastIndexOf('</div>', swiper[1]);
    source = source.slice(0, closingIndex) + '@@PAGINATION@@' + source.slice(closingIndex);

    const jsx = convert(source).replace(
      '@@PAGINATION@@',
      '{showPagination && (<div className="sw-pagination sw-pagination-partner text-center" />)}',
    );

    fs.writeFileSync(
      path.join(SRC, 'components', 'sections', 'PartnerSection.jsx'),
      `/** "Trusted by over 150+ major companies" logo carousel. */
export default function PartnerSection({ showPagination = false }) {
  return (
${indentBody(jsx).replace(/\n\s*\n/g, '\n')}
  );
}
`,
    );
  }

  fs.writeFileSync(path.join(process.cwd(), 'tools', 'page-meta.json'), JSON.stringify(meta, null, 2));
  console.log('\nunique properties:', properties.length);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
