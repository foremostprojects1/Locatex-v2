/** Splits a legacy page into the region that becomes the React page body. */
import { matchElement } from './parseCards.js';

const SHARED_BLOCK_MARKERS = [
  ['<!-- go top -->', '</div>'],
];

function removeElementAt(html, index) {
  const range = matchElement(html, index);
  if (!range) throw new Error('unbalanced element at ' + index);
  return html.slice(0, range[0]) + html.slice(range[1]);
}

function removeElementByMarker(html, marker, tagSearch = '<div') {
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return html;
  const elementIndex = html.indexOf(tagSearch, markerIndex + marker.length);
  if (elementIndex === -1) return html;
  return html.slice(0, markerIndex) + removeElementAt(html, elementIndex).slice(markerIndex + marker.length);
}

/** Removes the trailing `</div>` that closes a wrapper we no longer render. */
function dropLastCloseDiv(html) {
  const idx = html.lastIndexOf('</div>');
  if (idx === -1) return html;
  return html.slice(0, idx) + html.slice(idx + '</div>'.length);
}

function dropFirstCloseDiv(html) {
  const idx = html.indexOf('</div>');
  if (idx === -1) return html;
  return html.slice(0, idx) + html.slice(idx + '</div>'.length);
}

export function extractPage(html, page) {
  const bodyClass = /<body class="([^"]*)"/.exec(html)?.[1] ?? 'body';
  const headerIndex = html.indexOf('<header');
  const headerEnd = html.indexOf('</header>', headerIndex) + '</header>'.length;

  if (page.layout === 'dashboard') {
    const innerIndex = html.indexOf('<div class="main-content-inner');
    const innerClass = /<div class="(main-content-inner[^"]*)"/.exec(html)[1];
    const innerRange = matchElement(html, innerIndex);
    let inner = html.slice(innerRange[0], innerRange[1]);
    // Drop the wrapper's own tags plus the layout-owned "Show Dashboard" button.
    inner = inner.slice(inner.indexOf('>') + 1, inner.lastIndexOf('</div>'));
    const buttonIndex = inner.indexOf('<div class="button-show-hide show-mb">');
    if (buttonIndex !== -1) inner = removeElementAt(inner, buttonIndex);
    const footerClass = /<div class="(footer-dashboard[^"]*)"/.exec(html)[1];
    return { bodyClass, content: inner, innerClass, footerClass };
  }

  const pageEndMarker = html.indexOf('<!-- /#page -->');
  let content = html.slice(headerEnd, pageEndMarker);

  // The footer is rendered by the layout.
  const footerIndex = content.indexOf('<footer');
  if (footerIndex !== -1) content = removeElementAt(content, footerIndex);
  content = dropLastCloseDiv(content); // closes #page

  // Anything after `<!-- /#page -->` (page specific popups/overlays) is kept,
  // minus the blocks that became shared components.
  const bodyEnd = html.indexOf('</body>');
  let tail = html.slice(pageEndMarker + '<!-- /#page -->'.length, bodyEnd);
  tail = dropFirstCloseDiv(tail); // closes #wrapper
  for (const [marker] of SHARED_BLOCK_MARKERS) tail = removeElementByMarker(tail, marker);
  tail = removeElementByMarker(tail, '<!-- popup login -->');
  tail = removeElementByMarker(tail, '<!-- popup register -->');
  tail = tail.replace(/<script[\s\S]*?<\/script>/g, '');

  return { bodyClass, content: content + '\n' + tail };
}

/** Rough balance check to catch bad slicing before we emit JSX. */
export function checkBalance(html) {
  const stack = [];
  const re = /<\/?([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  const voids = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  const problems = [];
  let m;
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
  while ((m = re.exec(stripped)) !== null) {
    const tag = m[1].toLowerCase();
    if (voids.has(tag) || m[3] === '/') continue;
    if (m[0][1] === '/') {
      const idx = stack.lastIndexOf(tag);
      if (idx === -1) problems.push(`stray </${tag}>`);
      else stack.splice(idx, stack.length - idx);
    } else {
      stack.push(tag);
    }
  }
  if (stack.length) problems.push(`unclosed: ${stack.join(',')}`);
  return problems;
}
