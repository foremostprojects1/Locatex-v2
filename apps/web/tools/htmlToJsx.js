/**
 * HTML -> JSX transformer used for the one-off migration of the Homelengo
 * static template into React. It is intentionally a raw tokenizer (not a DOM
 * parser) so that the original attribute casing of the many inline SVGs
 * survives the round trip.
 */

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

// HTML attribute -> JSX property name.
const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  usemap: 'useMap',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  autoplay: 'autoPlay',
  autocomplete: 'autoComplete',
  autofocus: 'autoFocus',
  novalidate: 'noValidate',
  contenteditable: 'contentEditable',
  spellcheck: 'spellCheck',
  srcset: 'srcSet',
  crossorigin: 'crossOrigin',
  datetime: 'dateTime',
  enctype: 'encType',
  formaction: 'formAction',
  accesskey: 'accessKey',
  charset: 'charSet',
  http_equiv: 'httpEquiv',
  marginwidth: 'marginWidth',
  marginheight: 'marginHeight',
  playsinline: 'playsInline',
  srclang: 'srcLang',
  referrerpolicy: 'referrerPolicy',
  inputmode: 'inputMode',
  autocapitalize: 'autoCapitalize',
  itemprop: 'itemProp',
  itemscope: 'itemScope',
  itemtype: 'itemType',
};

// SVG attributes that must keep/receive camelCase in JSX.
const SVG_ATTRS = [
  'viewBox', 'preserveAspectRatio', 'strokeWidth', 'strokeLinecap',
  'strokeLinejoin', 'strokeDasharray', 'strokeDashoffset', 'strokeMiterlimit',
  'strokeOpacity', 'fillOpacity', 'fillRule', 'clipRule', 'clipPath',
  'stopColor', 'stopOpacity', 'gradientUnits', 'gradientTransform',
  'patternUnits', 'patternContentUnits', 'markerEnd', 'markerStart',
  'markerMid', 'maskUnits', 'textAnchor', 'dominantBaseline', 'fontFamily',
  'fontSize', 'fontWeight', 'letterSpacing', 'baseProfile', 'xmlnsXlink',
  'xlinkHref', 'shapeRendering', 'colorInterpolationFilters', 'floodColor',
  'floodOpacity', 'stdDeviation', 'filterUnits', 'primitiveUnits',
];
const SVG_ATTR_MAP = Object.fromEntries(
  SVG_ATTRS.map((name) => [name.toLowerCase(), name]),
);

// SVG elements whose names are case sensitive in JSX.
const SVG_TAGS = [
  'clipPath', 'linearGradient', 'radialGradient', 'foreignObject', 'textPath',
  'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feDropShadow', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG',
  'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'animateMotion', 'animateTransform',
];
const SVG_TAG_MAP = Object.fromEntries(SVG_TAGS.map((tag) => [tag.toLowerCase(), tag]));

// Elements that may not contain text nodes: a stray `{' '}` there is invalid
// HTML and React warns about it.
const NO_TEXT_PARENTS = new Set([
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'select', 'optgroup',
  'ol', 'ul', 'dl', 'picture', 'video', 'audio',
]);

const BOOLEAN_ATTRS = new Set([
  'checked', 'selected', 'disabled', 'readOnly', 'required', 'multiple',
  'autoPlay', 'controls', 'loop', 'muted', 'open', 'hidden', 'defer', 'async',
  'noValidate', 'autoFocus', 'allowFullScreen', 'playsInline', 'reversed',
  'default', 'download',
]);

function toCamel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function jsxAttrName(rawName) {
  const lower = rawName.toLowerCase();
  if (lower.startsWith('data-') || lower.startsWith('aria-')) return rawName;
  if (lower === 'xmlns:xlink') return 'xmlnsXlink';
  if (lower === 'xlink:href') return 'xlinkHref';
  if (lower === 'http-equiv') return 'httpEquiv';
  if (ATTR_MAP[lower]) return ATTR_MAP[lower];
  if (SVG_ATTR_MAP[lower]) return SVG_ATTR_MAP[lower];
  if (lower.includes('-')) return toCamel(lower); // stroke-width -> strokeWidth
  if (lower.includes(':')) return rawName; // leave exotic namespaced attrs alone
  return rawName;
}

function styleToObject(value) {
  const entries = [];
  for (const decl of value.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop || !val) continue;
    const key = prop.startsWith('--') ? `'${prop}'` : toCamel(prop.toLowerCase());
    entries.push(`${key}: ${JSON.stringify(val)}`);
  }
  return entries.length ? `{{ ${entries.join(', ')} }}` : null;
}

/**
 * JSX drops the whitespace that surrounds a line break next to a tag, while
 * HTML collapses it into a single space. Text nodes are therefore re-emitted
 * with explicit `{' '}` separators so the rendered output keeps the spacing of
 * the original document.
 */
function escapeText(text, parentTag) {
  if (!text) return '';
  const escaped = text.replace(/[{}]/g, (ch) => `{'${ch}'}`);
  const collapsed = escaped.replace(/\s+/g, ' ');
  if (collapsed.trim() === '') {
    if (collapsed === '' || NO_TEXT_PARENTS.has(parentTag)) return '';
    return "{' '}";
  }

  const leading = /^\s/.test(escaped) ? "{' '}" : '';
  const trailing = /\s$/.test(escaped) ? "{' '}" : '';
  return leading + collapsed.trim() + trailing;
}

/** Parses the attribute string of a tag while preserving the original casing. */
function parseAttributes(source) {
  const attrs = [];
  const re = /([^\s=/>"']+)(\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    const name = match[1];
    const value = match[4] ?? match[5] ?? match[6] ?? null;
    attrs.push({ name, value });
  }
  return attrs;
}

/**
 * @param {string} html
 * @param {object} [options]
 * @param {(attr: {name: string, value: string|null}, tag: string) => ({name: string, value: string|null}|null)} [options.transformAttr]
 * @param {(tag: string, attrs: Array) => string|null} [options.renameTag]
 */
export function htmlToJsx(html, options = {}) {
  const { transformAttr, renameTag, keepComments = false } = options;
  let out = '';
  let i = 0;
  /** @type {Array<{orig: string, emitted: string}>} */
  const openStack = [];

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      out += escapeText(html.slice(i), openStack.at(-1)?.orig);
      break;
    }
    out += escapeText(html.slice(i, lt), openStack.at(-1)?.orig);

    // Comment
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt);
      const stop = end === -1 ? html.length : end + 3;
      if (keepComments) {
        const body = html.slice(lt + 4, end === -1 ? html.length : end);
        out += `{/*${body.replace(/\*\//g, '* /')}*/}`;
      }
      i = stop;
      continue;
    }

    // Doctype / processing instruction
    if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
      const end = html.indexOf('>', lt);
      i = end === -1 ? html.length : end + 1;
      continue;
    }

    // Closing tag
    if (html.startsWith('</', lt)) {
      const end = html.indexOf('>', lt);
      if (end === -1) { out += escapeText(html.slice(lt), openStack.at(-1)?.orig); break; }
      const name = html.slice(lt + 2, end).trim().toLowerCase();
      let emitted = SVG_TAG_MAP[name] ?? name;
      for (let k = openStack.length - 1; k >= 0; k--) {
        if (openStack[k].orig === name) {
          emitted = openStack[k].emitted;
          openStack.splice(k, 1);
          break;
        }
      }
      out += `</${emitted}>`;
      i = end + 1;
      continue;
    }

    // Opening tag
    const tagMatch = /^<([a-zA-Z][a-zA-Z0-9:-]*)/.exec(html.slice(lt));
    if (!tagMatch) {
      out += escapeText('<', openStack.at(-1)?.orig);
      i = lt + 1;
      continue;
    }
    const tagName = tagMatch[1];
    // Find the end of the tag, skipping over quoted attribute values.
    let j = lt + tagMatch[0].length;
    let quote = null;
    while (j < html.length) {
      const ch = html[j];
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        break;
      }
      j++;
    }
    const rawAttrs = html.slice(lt + tagMatch[0].length, j);
    const selfClosingInSource = /\/\s*$/.test(rawAttrs);
    const attrSource = rawAttrs.replace(/\/\s*$/, '');
    const lowerTag = tagName.toLowerCase();

    // <script> / <style> bodies are dropped: behaviour is migrated to React.
    if (lowerTag === 'script' || lowerTag === 'style') {
      const closeRe = new RegExp(`</${lowerTag}\\s*>`, 'i');
      const rest = html.slice(j);
      const closeMatch = closeRe.exec(rest);
      i = closeMatch ? j + closeMatch.index + closeMatch[0].length : html.length;
      continue;
    }

    let parsed = parseAttributes(attrSource);
    let emittedTag = SVG_TAG_MAP[lowerTag] ?? lowerTag;
    if (renameTag) {
      const renamed = renameTag(lowerTag, parsed);
      if (renamed) {
        emittedTag = renamed.name ?? emittedTag;
        parsed = renamed.attrs ?? parsed;
      }
    }
    const pieces = [];
    for (const attr of parsed) {
      let current = attr;
      if (transformAttr) {
        current = transformAttr(attr, lowerTag);
        if (!current) continue;
      }
      const name = jsxAttrName(current.name);
      const value = current.value;
      if (value === null || (value === '' && BOOLEAN_ATTRS.has(name))) {
        pieces.push(BOOLEAN_ATTRS.has(name) ? name : `${name}=""`);
        continue;
      }
      if (name === 'style') {
        const styleObject = styleToObject(value);
        if (styleObject) pieces.push(`style=${styleObject}`);
        continue;
      }
      if (value.includes('{{JSX:')) {
        // escape hatch used by callers to inject expressions
        pieces.push(`${name}={${value.replace('{{JSX:', '').replace('}}', '')}}`);
        continue;
      }
      const quoted = value.includes('"')
        ? `{${JSON.stringify(value)}}`
        : `"${value}"`;
      pieces.push(`${name}=${quoted}`);
    }

    const attrText = pieces.length ? ' ' + pieces.join(' ') : '';
    const isVoid = VOID_ELEMENTS.has(lowerTag);
    if (isVoid || selfClosingInSource) {
      out += `<${emittedTag}${attrText} />`;
    } else {
      out += `<${emittedTag}${attrText}>`;
      openStack.push({ orig: lowerTag, emitted: emittedTag });
    }
    i = j + 1;
  }

  // React requires textarea content to be passed as a prop.
  return out.replace(/<textarea([^>]*)>([\s\S]*?)<\/textarea>/g, (match, attrs, content) => {
    const text = content.replace(/\{' '\}/g, ' ').trim();
    return text
      ? `<textarea${attrs} defaultValue={${JSON.stringify(text)}} />`
      : `<textarea${attrs} />`;
  });
}

export { VOID_ELEMENTS };
