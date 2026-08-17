# Performance Health Group — Website

Static website for **Performance Health Group LLC** (performancehealthgroup.org):
private-pay skilled nursing and RN-supervised aide services in Cecil and
Harford County, Maryland.

Plain HTML/CSS with a few lines of vanilla JS per page. No framework, no
build step.

## Local preview

Links are root-relative, so serve the repo root (don't open files directly):

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

## Structure

```
index.html            Homepage
<path>/index.html     Every other page, mirroring the live site's URLs
                      (e.g. services/skilled-nursing-rn/iv-therapy-infusion/)
styles.css            Shared site header/navigation only
assets/               Photos, PHG logo, Figtree PHG webfont (woff2) — deduplicated
404.html              Not-found page (picked up automatically by GitHub Pages)
robots.txt            Allows all crawlers, points at the sitemap
sitemap.xml           All 40 content pages
```

Each page is a **self-contained document**: its styles are inline in its own
`<head>`, exactly as authored upstream. Pages share no CSS with each other —
that is faithful to the source, where every page was written independently.
The only shared stylesheet is `styles.css`, which carries the site
header/navigation added for this standalone build (on Google Sites the top
nav came from the Sites chrome). The header highlights the active section
via `aria-current`.

## Page inventory (all ported)

- Homepage, Services hub, Skilled Nursing (RN) + 10 sub-services,
  Aide & Support Services + 3 sub-services
- Service Areas hub, Cecil County + 5 towns, Harford County + 5 towns
- Pricing, About Us, Healthcare Professionals, FAQ, Request Care, Contact
- Privacy Policy, Terms of Use, Accessibility, Notice of Privacy Practices
- Client Portal and Employee Portal (`/clients/`, `/employees/`) — thin
  pages embedding the same Google Apps Script web apps the live site uses
- Redirects: `/home` → `/`; see below for the rest

## Provenance

Content, styles, fonts, images, structured data, and scripts were recovered
from the live Google Sites deployment, where each page is a complete
hand-authored HTML document inside a "Custom embed" (`data-code` attribute),
with images and the webfont base64-inlined. This repo is that same source,
unpacked: assets extracted to real files (deduplicated by content hash),
links made root-relative, and the shared header added.

## Fixes applied on top of the live site

The live site has several broken links today. This build keeps the original
markup but adds redirect pages so they resolve:

- `/start-intake` — target of the homepage's primary CTA, **404 on the live
  site** → redirects to `/request-care/`.
- `/services/ADLs`, `/services/Medication-Administration`,
  `/services/Phlebotomy`, `/services/Post-Discharge-Support`,
  `/services/WOC` — legacy links still present in several page footers,
  **all 404 on the live site** → redirect to the current service pages.

Worth fixing at the source in a future pass (and on the live site).

## Known TODOs carried from the source

- The footer legal block on the homepage has a publisher note: add the
  verified Maryland RSA license number if required in public-facing copy.
