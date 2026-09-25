# Performance Health Group — Website

Static website for **Performance Health Group LLC** (performancehealthgroup.org):
private-pay skilled nursing and RN-supervised aide services in Cecil and
Harford County, Maryland.

Plain HTML/CSS with a few lines of vanilla JS per page. No framework, no
build step. Hosted on **Cloudflare Pages**; every link is a normal same-tab
link in every browser (the site no longer lives inside Google Sites embeds).

## Structure

```
public/                    Everything that is deployed - the site root
  index.html               Homepage
  <path>/index.html        Every other page at its live URL
                           (e.g. services/skilled-nursing-rn/iv-therapy-infusion/)
  styles.css               Shared header, navigation and footer styles
  site.js                  Shared header/footer behaviour (mobile menu, year)
  assets/                  Photos, PHG logo, Figtree PHG webfont (woff2)
  404.html                 Not-found page (served automatically by Pages)
  robots.txt, sitemap.xml  All 40 content pages
  _redirects               Cloudflare Pages redirects (apex -> www, legacy URLs)
  _headers                 Cloudflare Pages response headers (security, noindex on portals, caching)
tools/
  partials/header.html     The ONE copy of the site header/navigation
  partials/footer.html     The ONE copy of the site footer
  sync-chrome.mjs          Writes both partials into every page (see below)
wrangler.toml              Cloudflare Pages settings for `wrangler pages deploy` / `wrangler pages dev`
```

Each page is a **self-contained document**: its styles are inline in its own
`<head>`, exactly as authored. The shared header and footer are the only
things every page has in common; they are stamped into each page between
`<!-- phg:header -->` / `<!-- phg:footer -->` markers.

## Editing the header or footer

1. Edit `tools/partials/header.html` or `tools/partials/footer.html`.
2. Run `node tools/sync-chrome.mjs` (Node 18+; nothing to install).
3. Commit. The script marks the current page in the navigation and footer
   (`aria-current="page"`) and keeps every page's canonical URL and `og:url`
   pointing at its own path. `node tools/sync-chrome.mjs --check` exits 1 if
   any page is out of date.

## Local preview

Links are root-relative, so serve `public/` (do not open the files directly):

```sh
python3 -m http.server 8000 --directory public
# open http://localhost:8000/
```

`_redirects` and `_headers` are only honoured by Cloudflare; to preview them
locally use `npx wrangler pages dev` (serves `public/` with the Pages runtime).

## Deploying (Cloudflare Pages)

Production deploys come from the Git integration: the Pages project is
connected to this GitHub repository, **no build command**, build output
directory **`public`**. Every push to the production branch deploys; every
other branch gets a preview URL.

Manual deploy from a laptop (needs `wrangler login` once):

```sh
npx wrangler pages deploy
```

## Page inventory

- Homepage, Services hub, Skilled Nursing (RN) + 10 sub-services,
  Aide & Support Services + 3 sub-services
- Service Areas hub, Cecil County + 5 towns, Harford County + 5 towns
- Pricing, About Us, Healthcare Professionals, FAQ, Request Care, Contact
- Privacy Policy, Terms of Use, Accessibility, Notice of Privacy Practices
- Client Portal and Employee Portal (`/clients/`, `/employees/`) — thin
  pages embedding the Google Apps Script web apps; `noindex`
- Redirects (in `_redirects`): `/home` → `/`, `/start-intake` → `/request-care/`,
  and the legacy `/services/ADLs`, `/services/Medication-Administration`,
  `/services/Phlebotomy`, `/services/Post-Discharge-Support`, `/services/WOC`,
  `/services/EKG`, `/services/Advance-Directives` paths → the current pages

## Provenance

Content, styles, fonts, images, structured data and scripts were recovered
from the Google Sites deployment, where each page was a complete
hand-authored HTML document inside a "Custom embed", with images and the
webfont base64-inlined. This repo is that same source, unpacked: assets
extracted to real files, links made root-relative, and the shared header and
footer added.

## Owner TODO carried from the source

- The footer omits the Maryland RSA licensure statement until the license
  number is issued and verified. Add it in `tools/partials/footer.html`
  (there is a marked comment) and run the sync script.
