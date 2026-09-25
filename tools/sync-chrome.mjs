#!/usr/bin/env node
/**
 * Writes the shared site chrome into every page under public/.
 *
 *   node tools/sync-chrome.mjs          # apply
 *   node tools/sync-chrome.mjs --check  # exit 1 if any page would change
 *
 * Source of truth: tools/partials/header.html and tools/partials/footer.html.
 * Each page carries the result between <!-- phg:header --> ... <!-- /phg:header -->
 * and <!-- phg:footer --> ... <!-- /phg:footer --> markers; the script replaces
 * whatever is between them, marks the current page (aria-current="page") in the
 * navigation and footer, and normalizes the page's canonical URL and og:url to
 * its own path. Pages stay plain static HTML - no build step is needed to serve.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const SITE = 'https://www.performancehealthgroup.org';
const CHECK = process.argv.includes('--check');

const header = readFileSync(join(ROOT, 'tools/partials/header.html'), 'utf8').trim();
const footer = readFileSync(join(ROOT, 'tools/partials/footer.html'), 'utf8').trim();

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const LINK = /<a (class="[^"]*" )?href="([^"]+)">/;

/** Marks the current section in the navigation. */
function markHeader(html, path) {
  let prevWasMenuLi = false;
  return html.split('\n').map((line) => {
    const m = line.match(LINK);
    if (m && !/header-brand|nav-cta/.test(line)) {
      const href = m[2];
      const isTop = /^\s*<li[ >]/.test(line) || prevWasMenuLi;
      const current = isTop ? (href === '/' ? path === '/' : path.startsWith(href)) : href === path;
      if (current) line = line.replace(LINK, (s) => s.replace(/>$/, ' aria-current="page">'));
    }
    prevWasMenuLi = /<li class="has-menu">/.test(line);
    return line;
  }).join('\n');
}

/** Marks the current page in the footer link columns. */
function markFooter(html, path) {
  return html.split('\n').map((line) => {
    const m = line.match(LINK);
    if (m && !/phg-footer__name/.test(line) && m[2] === path) {
      line = line.replace(LINK, (s) => s.replace(/>$/, ' aria-current="page">'));
    }
    return line;
  }).join('\n');
}

const pages = walk(PUB).filter((f) => f.endsWith('.html') && !f.endsWith('404.html'));
let changed = 0;
const problems = [];

for (const file of pages) {
  const rel = relative(PUB, file).split('\\').join('/');
  const path = '/' + (rel === 'index.html' ? '' : rel.replace(/index\.html$/, ''));
  const before = readFileSync(file, 'utf8');
  let html = before;

  const H = '<!-- phg:header -->\n' + markHeader(header, path) + '\n<!-- /phg:header -->';
  if (/<!-- phg:header -->[\s\S]*?<!-- \/phg:header -->/.test(html)) {
    html = html.replace(/<!-- phg:header -->[\s\S]*?<!-- \/phg:header -->/, () => H);
  } else if (/<header class="site-header">[\s\S]*?<\/header>/.test(html)) {
    html = html.replace(/<header class="site-header">[\s\S]*?<\/header>/, () => H);
  } else {
    problems.push(rel + ': no site header found');
  }

  const F = '<!-- phg:footer -->\n' + markFooter(footer, path) + '\n<!-- /phg:footer -->';
  if (/<!-- phg:footer -->[\s\S]*?<!-- \/phg:footer -->/.test(html)) {
    html = html.replace(/<!-- phg:footer -->[\s\S]*?<!-- \/phg:footer -->/, () => F);
  } else if (/<footer class="site-footer">[\s\S]*?<\/footer>/.test(html)) {
    html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, () => F);
  } else if (/<!-- Site header script/.test(html)) {
    html = html.replace(/[ \t]*<!-- Site header script/, () => F + '\n\n  <!-- Site header script');
  } else {
    html = html.replace(/<\/body>/, () => F + '\n</body>');
  }

  // The inline nav script of the first standalone build is now /site.js (loaded by the footer).
  html = html.replace(/\n?[ \t]*<!-- Site header script \(standalone static site\) -->\s*<script>[\s\S]*?<\/script>[ \t]*\n/, '\n');

  const canonical = SITE + path;
  html = html.replace(/<link rel="canonical" href="[^"]*">/, () => '<link rel="canonical" href="' + canonical + '">');
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, (s, a, b) => a + canonical + b);

  if (html !== before) {
    changed++;
    if (!CHECK) writeFileSync(file, html);
    else console.log('would change: ' + rel);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(2);
}
console.log((CHECK ? 'pages that would change: ' : 'pages updated: ') + changed + ' of ' + pages.length);
if (CHECK && changed) process.exit(1);
