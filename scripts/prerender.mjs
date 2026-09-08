// Post-build: inject server-rendered HTML for the public marketing routes into
// per-route index.html files, so crawlers and LLM fetchers get real content (not an
// empty SPA shell). Resilient: any failure is logged and skipped - the SPA still ships.
//
// It also merges the /answers pages into the two machine-readable files that
// have to list them, dist/sitemap.xml and dist/llms.txt. Those are generated
// here rather than hand-maintained so that dropping a markdown file into
// src/content/answers is the whole publishing step. The copies under public/
// stay the hand-written source of everything except the answer entries.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = 'dist';
const SSR_ENTRY = path.resolve('.prerender/entry-prerender.js');
const SITE_ORIGIN = 'https://makeyourmindup.ai';

/** Escape a string for use inside a double-quoted HTML attribute. */
function attr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Rewrite the document head for one route.
 *
 * Opt-in: a route with no head metadata keeps the template's own tags byte for
 * byte, so this cannot quietly change the pages that were prerendered before
 * /answers existed. A tag that is not found is left alone rather than appended,
 * because a duplicate title tag is worse than a generic one.
 */
function applyHead(html, head) {
  const title = attr(head.title);
  const description = attr(head.description);
  const canonical = attr(head.canonical);
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${description}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${canonical}$2`);
}

/**
 * Merge the answer URLs into the shipped sitemap.
 *
 * public/sitemap.xml stays the hand-maintained list of the fixed public pages.
 * Any answer entry already present is dropped first, so a rebuild is idempotent
 * and a deleted markdown file leaves no orphan URL behind.
 */
function writeSitemap(entries) {
  const file = path.join(DIST, 'sitemap.xml');
  if (!fs.existsSync(file)) {
    console.warn('[prerender] no dist/sitemap.xml; skipping sitemap merge');
    return;
  }
  let xml = fs.readFileSync(file, 'utf-8');
  xml = xml.replace(
    new RegExp(`[ \\t]*<url>(?:(?!</url>)[\\s\\S])*?<loc>${SITE_ORIGIN}/answers[^<]*</loc>[\\s\\S]*?</url>\\r?\\n`, 'g'),
    '',
  );

  const rows = [
    `  <url>\n    <loc>${SITE_ORIGIN}/answers</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    ...entries.map((entry) => {
      const day = String(entry.publishedAt).slice(0, 10);
      const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(day) ? `\n    <lastmod>${day}</lastmod>` : '';
      return `  <url>\n    <loc>${entry.url}</loc>${lastmod}\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
    }),
  ];

  const merged = xml.replace('</urlset>', `${rows.join('\n')}\n</urlset>`);
  fs.writeFileSync(file, merged);
  console.log(`[prerender] sitemap: ${entries.length + 1} answer URLs merged`);
}

/**
 * Fill in the Answers section of the shipped llms.txt.
 *
 * public/llms.txt owns the heading and the sentence under it, so the voice of
 * the document stays hand-written; this only replaces the list items in that
 * one section. Every other section, Claim boundary included, is untouched.
 */
function writeLlmsTxt(entries) {
  const file = path.join(DIST, 'llms.txt');
  if (!fs.existsSync(file)) {
    console.warn('[prerender] no dist/llms.txt; skipping answer listing');
    return;
  }
  const text = fs.readFileSync(file, 'utf-8');
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => /^## Answers\s*$/.test(line));
  if (start === -1) {
    console.warn('[prerender] llms.txt has no "## Answers" section; skipping answer listing');
    return;
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }

  // Keep the hand-written prose in the section, replace the generated list.
  const kept = lines.slice(start, end).filter((line) => !/^- /.test(line));
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
  const listed = entries.map((entry) => `- [${entry.title}](${entry.url}): ${entry.question}`);
  const rebuilt = [...kept, ...(listed.length ? ['', ...listed] : []), ''];

  fs.writeFileSync(file, [...lines.slice(0, start), ...rebuilt, ...lines.slice(end)].join('\n'));
  console.log(`[prerender] llms.txt: ${entries.length} answer pages listed`);
}

async function main() {
  const templatePath = path.join(DIST, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.warn('[prerender] no dist/index.html; skipping');
    return;
  }
  if (!fs.existsSync(SSR_ENTRY)) {
    console.warn('[prerender] no SSR bundle; skipping');
    return;
  }
  const template = fs.readFileSync(templatePath, 'utf-8');
  const { render, ROUTE_PATHS, getRouteHead, ANSWER_ENTRIES } = await import(pathToFileURL(SSR_ENTRY).href);

  // Swap the existing visually-hidden crawler block (<main class="ctrl-seo">) for the
  // route's real rendered content, per route. Crawlers/LLMs get route-specific HTML;
  // humans still see the boot splash then the live React app (which replaces #root).
  const SEO_BLOCK = /<main class="ctrl-seo">[\s\S]*?<\/main>/;
  if (!SEO_BLOCK.test(template)) {
    console.warn('[prerender] ctrl-seo block not found in template; skipping');
    return;
  }
  let ok = 0;
  for (const url of ROUTE_PATHS) {
    try {
      const html = render(url);
      if (!html) continue;
      let page = template.replace(SEO_BLOCK, `<main class="ctrl-seo">${html}</main>`);
      const head = typeof getRouteHead === 'function' ? getRouteHead(url) : null;
      if (head) page = applyHead(page, head);
      const outDir = url === '/' ? DIST : path.join(DIST, url.replace(/^\//, ''));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), page);
      console.log(`[prerender] ${url} -> ${path.join(outDir, 'index.html')} (${html.length} chars)`);
      ok++;
    } catch (e) {
      console.warn(`[prerender] ${url} failed (skipped):`, e?.message ?? e);
    }
  }
  console.log(`[prerender] done: ${ok}/${ROUTE_PATHS.length} routes`);

  const entries = Array.isArray(ANSWER_ENTRIES) ? ANSWER_ENTRIES : [];
  try {
    writeSitemap(entries);
  } catch (e) {
    console.warn('[prerender] sitemap merge failed (skipped):', e?.message ?? e);
  }
  try {
    writeLlmsTxt(entries);
  } catch (e) {
    console.warn('[prerender] llms.txt merge failed (skipped):', e?.message ?? e);
  }
}

main().catch((e) => {
  console.warn('[prerender] aborted (SPA still ships):', e?.message ?? e);
});
