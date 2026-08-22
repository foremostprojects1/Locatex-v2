/**
 * Post-generation edits: the generator turns the legacy markup into JSX, this
 * script swaps the remaining widgets for their React components so the whole
 * migration can be reproduced from the original template in two commands.
 *
 * Run with: node tools/postprocess.mjs (after node tools/generate.js)
 */
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content);

const addImport = (source, statement) =>
  source.includes(statement) ? source : `${statement}\n${source}`;

/** Locates an element and its children, honouring nesting of the same tag. */
function findElement(source, start, tag = 'div') {
  const innerStart = source.indexOf('>', start) + 1;
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = re.exec(source)) !== null) {
    if (match[0] === `</${tag}>`) {
      depth -= 1;
      if (depth === 0) {
        return { start, end: match.index + match[0].length, innerStart, innerEnd: match.index };
      }
    } else {
      depth += 1;
    }
  }
  throw new Error(`unbalanced <${tag}> at ${start}`);
}

function replaceElement(source, marker, replace, tag = 'div') {
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`marker not found: ${marker}`);
  const element = findElement(source, start, tag);
  const replacement =
    typeof replace === 'function' ? replace(source.slice(element.innerStart, element.innerEnd)) : replace;
  return source.slice(0, element.start) + replacement + source.slice(element.end);
}

// ---------------------------------------------------------------------------
// Rotating hero headlines
// ---------------------------------------------------------------------------
const HEADLINES = {
  'src/pages/Home.jsx': ['slide', ['Dream Home', 'Perfect Home']],
  'src/pages/HomeV2.jsx': ['clip', ['Fits Perfectly', 'Fits Dream Home']],
  'src/pages/HomeV3.jsx': ['clip', ['Sanctuary', 'Safe House']],
  'src/pages/HomeV5.jsx': ['clip', ['Sanctuary', 'Safe House']],
};

for (const [file, [type, words]] of Object.entries(HEADLINES)) {
  const source = read(file);
  const updated = replaceElement(
    source,
    '<span className="tf-text s1 cd-words-wrapper">',
    `<AnimatedHeadline type="${type}" words={${JSON.stringify(words)}} />`,
    'span',
  );
  write(file, addImport(updated, "import AnimatedHeadline from '../components/common/AnimatedHeadline';"));
}

// ---------------------------------------------------------------------------
// Google maps
// ---------------------------------------------------------------------------
const MAP_PAGES = [
  'src/pages/Contact.jsx',
  'src/pages/HomeV4.jsx',
  'src/pages/HomeV6.jsx',
  'src/pages/TopmapGrid.jsx',
  'src/pages/TopmapList.jsx',
  'src/pages/PropertyHalfmapGrid.jsx',
  'src/pages/PropertyHalfmapList.jsx',
];
for (const file of MAP_PAGES) {
  const source = read(file)
    .replace(
      /<div id="map" className="top-map" data-map-zoom="(\d+)" data-map-scroll="true"><\/div>/,
      (_, zoom) => `<PropertyMap zoom={${zoom}} />`,
    )
    .replace(
      /<div id="map-contact" className="map-contact" data-map-zoom="(\d+)" data-map-scroll="true"><\/div>/,
      (_, zoom) => `<PropertyMap id="map-contact" className="map-contact" zoom={${zoom}} />`,
    );
  write(file, addImport(source, "import PropertyMap from '../components/common/PropertyMap';"));
}

// ---------------------------------------------------------------------------
// Dashboard: chart and date inputs
// ---------------------------------------------------------------------------
{
  const file = 'src/pages/Dashboard.jsx';
  const source = read(file)
    .replace('<canvas id="lineChart"></canvas>', '<DashboardChart />')
    .replace(/<input type="text" (id="datepicker\d")/g, '<input type="date" $1');
  write(file, addImport(source, "import DashboardChart from '../components/common/DashboardChart';"));
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------
function replaceForm(file, marker, replacement, importStatement) {
  const source = read(file);
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`form not found in ${file}`);
  const end = source.indexOf('</form>', start) + '</form>'.length;
  write(file, addImport(source.slice(0, start) + replacement + source.slice(end), importStatement));
}

replaceForm(
  'src/pages/Contact.jsx',
  '<form id="contactform"',
  '<ContactForm />',
  "import ContactForm from '../components/forms/ContactForm';",
);
replaceForm(
  'src/pages/BlogDetail.jsx',
  '<form method="post" id="contactform"',
  '<CommentForm />',
  "import CommentForm from '../components/forms/CommentForm';",
);

{
  // The three password inputs of the profile page become <PasswordField />;
  // `{' '}` separators come from the whitespace of the original markup.
  const file = 'src/pages/MyProfile.jsx';
  const pattern =
    /<div className="box-password">(\{' '\}|\s)*<input type="password" className="form-contact style-1 password-field\d?" placeholder="Password" \/>(\{' '\}|\s)*<span className="show-pass\d?">(\{' '\}|\s)*<i className="icon-pass icon-eye"><\/i>(\{' '\}|\s)*<i className="icon-pass icon-eye-off"><\/i>(\{' '\}|\s)*<\/span>(\{' '\}|\s)*<\/div>/g;
  const source = read(file);
  const updated = source.replace(pattern, '<PasswordField />');
  if (updated === source) throw new Error('password fields not found in MyProfile');
  write(file, addImport(updated, "import PasswordField from '../components/forms/PasswordField';"));
}

// ---------------------------------------------------------------------------
// Add property: media uploads
// ---------------------------------------------------------------------------
{
  const file = 'src/pages/AddProperty.jsx';
  let source = read(file);
  let images = [];

  source = replaceElement(source, '<div className="box-img-upload">', (inner) => {
    images = [...inner.matchAll(/<img src="([^"]+)" alt="img" \/>/g)].map((match) => match[1]);
    return '';
  });
  source = replaceElement(
    source,
    '<div className="box-uploadfile text-center">',
    () => `<PhotoUploader images={${JSON.stringify(images)}} />`,
  );
  source = replaceElement(source, '<div className="box-floor-img uploadfile">', '<FloorImageUploader />');
  write(file, addImport(source, "import { PhotoUploader, FloorImageUploader } from '../components/forms/MediaUploader';"));
}

// ---------------------------------------------------------------------------
// Homepage 06: search popup driven by the header button
// ---------------------------------------------------------------------------
{
  const file = 'src/pages/HomeV6.jsx';
  let source = replaceElement(
    read('src/pages/HomeV6.jsx'),
    '<div className="search-popup-wrapper">',
    (inner) => `<SearchPopup>${inner}</SearchPopup>`,
  );
  source = source.replace('<div className="overlay2"></div>', '');
  write(file, addImport(source, "import SearchPopup from '../components/common/SearchPopup';"));
}

console.log('post-processing done');

// ---------------------------------------------------------------------------
// Grid/list listing pairs: the two pages only differ by the tab that is open,
// so they share one component parameterised by `defaultLayout`.
// ---------------------------------------------------------------------------
const LISTING_PAIRS = [
  { shared: 'SidebarListing', grid: 'SidebarGrid', list: 'SidebarList' },
  { shared: 'TopmapListing', grid: 'TopmapGrid', list: 'TopmapList' },
];

for (const pair of LISTING_PAIRS) {
  let source = read(`src/pages/${pair.grid}.jsx`);

  source = source.replace(
    `export default function ${pair.grid}() {`,
    `export default function ${pair.shared}({ defaultLayout = "grid" }) {\n  const isGrid = defaultLayout === "grid";`,
  );
  // Tab buttons
  source = source.replace(
    /href="#gridLayout"(\s+)className="nav-link-item active"/,
    'href="#gridLayout"$1className={`nav-link-item${isGrid ? " active" : ""}`}',
  );
  source = source.replace(
    /href="#listLayout"(\s+)className="nav-link-item"/,
    'href="#listLayout"$1className={`nav-link-item${isGrid ? "" : " active"}`}',
  );
  // Tab panes
  source = source.replace(
    /className="tab-pane active show"(\s+)id="gridLayout"/,
    'className={`tab-pane${isGrid ? " active show" : ""}`}$1id="gridLayout"',
  );
  source = source.replace(
    /<div className="tab-pane" id="listLayout"/,
    '<div className={`tab-pane${isGrid ? "" : " active show"}`} id="listLayout"',
  );
  write(`src/pages/${pair.shared}.jsx`, source);

  const wrapper = (name, layout) =>
    `import ${pair.shared} from "./${pair.shared}";\n\n` +
    `/** ${name} — the shared listing page with the ${layout} tab open. */\n` +
    `export default function ${name}() {\n  return <${pair.shared} defaultLayout="${layout}" />;\n}\n`;
  write(`src/pages/${pair.grid}.jsx`, wrapper(pair.grid, 'grid'));
  write(`src/pages/${pair.list}.jsx`, wrapper(pair.list, 'list'));
}

console.log('listing pairs merged');
