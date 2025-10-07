const fs = require('fs');
const path = 'src/app/dashboard/page.tsx';
let s = fs.readFileSync(path, 'utf8');

function addClass(cls) {
  // add a utility class to the first <main ... className="...">
  s = s.replace(
    /<main([^>]*?)className="([^"]*)"/,
    (m, a, classes) => {
      if (classes.includes(cls)) return m;
      return `<main${a}className="${classes} ${cls}"`;
    }
  );
}

// Ensure the grid props exist on <ResponsiveGridLayout ...>
function addGridProp(prop, valueLiteral) {
  // Insert prop if missing in the opening tag
  s = s.replace(
    /<ResponsiveGridLayout([^>]*)>/,
    (m, attrs) => (attrs.includes(prop) ? m : `<ResponsiveGridLayout${attrs} ${prop}={${valueLiteral}}>`),
  );
}

// Try a few grid component aliases just in case
function ensureOnComponent(openingTagName, cb) {
  const re = new RegExp(`<${openingTagName}([^>]*)>`);
  if (re.test(s)) {
    s = s.replace(re, (m, attrs) => cb(m, attrs));
    return true;
  }
  return false;
}

// 1) Make sure the page has vertical height so dragging/resizing works
addClass('min-h-screen');

/**
 * 2) Turn on drag/resize + improve UX on the grid.
 * We expect <ResponsiveGridLayout ...> in the file.
 * If your file uses a different name, feel free to re-run with that name.
 */
const injectProps = (m, attrs) => {
  // Add missing props
  const want = [
    ['isDraggable', 'true'],
    ['isResizable', 'true'],
    ['compactType', 'null'],
    ['preventCollision', 'false'],
  ];
  let out = `<ResponsiveGridLayout${attrs}`;
  for (const [k, v] of want) {
    if (!attrs.includes(`${k}=`)) out += ` ${k}={${v}}`;
  }
  out += '>';
  return out;
};

// Apply to ResponsiveGridLayout if present
let touched = false;
s = s.replace(/<ResponsiveGridLayout([^>]*)>/, (m, attrs) => {
  touched = true;
  return injectProps(m, attrs);
});

// Fallback: try ReactGridLayout (non-responsive) if used instead
if (!touched) {
  s = s.replace(/<ReactGridLayout([^>]*)>/, (m, attrs) => {
    touched = true;
    // Convert to ResponsiveGridLayout in place (optional). If you don’t want that, just inject props.
    return injectProps(m.replace('<ReactGridLayout', '<ResponsiveGridLayout'), attrs);
  });
}

// Optionally remove over-aggressive draggableCancel to allow easier grabbing
s = s.replace(/draggableCancel="[^"]*"/g, (m) => `/* ${m} */`);

fs.writeFileSync(path, s, 'utf8');
console.log('Patched:', path);
