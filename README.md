# Performance Health Group — Website

Static website for **Performance Health Group LLC** (performancehealthgroup.org):
private-pay skilled nursing and RN-supervised aide services in Cecil and
Harford County, Maryland.

Plain HTML/CSS with a few lines of vanilla JS. No framework, no build step.

## Local preview

Links are root-relative, so serve the repo root (don't open files directly):

```sh
python3 -m http.server 8000
# open http://localhost:8000/
```

## Structure

```
index.html        Homepage (hero, proof band, services, process, scope, FAQ, intake CTA)
styles.css        Site-wide stylesheet (design tokens in :root) + site header
assets/           Hero photo, PHG logo, Figtree PHG webfont (woff2)
```

Pages mirror the live site's URL structure: each page lives at
`<path>/index.html` so URLs like `/services/skilled-nursing-rn/` work on any
static host.

## Provenance

Content, styles, fonts, and images were recovered from the live Google Sites
deployment, where each page is a complete hand-authored HTML document inside a
"Custom embed" (with images and the webfont base64-inlined). This repo is that
same source, unpacked: assets extracted to real files, shared CSS in one
stylesheet, and links made root-relative.

The site header/navigation is new to this repo — on Google Sites the top nav
was provided by the Sites chrome. It is built from the live site's nav
structure in the page's own design system.

## Page status

- [x] `/` Homepage
- [ ] `/services/` + Skilled Nursing (RN) and Aide & Support Services (13 pages)
- [ ] `/service-areas/` + Cecil and Harford County town pages (12 pages)
- [ ] `/pricing/`, `/about-us/`, `/healthcare-professionals/`, `/faq/`,
      `/request-care/`, `/contact/`
- [ ] `/clients/`, `/employees/` (portal pages)

## Known issues carried from the live site

- The primary CTA links to `/start-intake`, which returns **404 on the live
  site** (the nav's "Request Care" page at `/request-care` appears to be the
  working intake). Kept as-is pending a decision.
- The footer legal block has a publisher TODO: add the verified Maryland RSA
  license number if required in public-facing copy.
