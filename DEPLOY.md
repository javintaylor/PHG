# Deploying performancehealthgroup.org on Cloudflare Pages

The site is plain static files in `public/`. Cloudflare Pages serves them,
applies `public/_redirects` and `public/_headers`, and redeploys on every
push to the production branch. Nothing runs on a server and no PHI touches
Cloudflare: the portals stay Google Apps Script web apps, embedded by
`/clients/` and `/employees/` exactly as before.

Do the steps in order. Steps 1–2 can be done and tested before anything
about the live domain changes.

## 1. Create the Pages project (one time)

1. Sign in at dash.cloudflare.com (free plan is enough).
2. **Workers & Pages → Create → Pages → Connect to Git** → authorize GitHub
   → choose **javintaylor/PHG**.
3. Settings:
   - Project name: `performancehealthgroup` (gives `performancehealthgroup.pages.dev`)
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `public`
4. **Save and Deploy.** The first deploy takes about a minute.

The production branch must contain this site. Merge the branch
`claude/new-session-cyc5rt` into `main` (a pull request on GitHub, or
`git checkout main && git merge claude/new-session-cyc5rt && git push`).
Until then you can point the production branch at `claude/new-session-cyc5rt`
in the project settings, but `main` is the clean long-term choice.

## 2. Check the preview on the pages.dev address

Open `https://performancehealthgroup.pages.dev/` and confirm:

- Every menu link and button opens in the **same tab** (Chrome and Safari).
- `/home` and `/start-intake` redirect (to `/` and `/request-care/`).
- `/clients/` and `/employees/` show the portals. If a portal frame is blank,
  the Apps Script `doGet` must return
  `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`.
- Submit a test Request Care form; it posts to the Client Operations web
  app, which already accepts requests from any origin.

## 3. Add the domain to Cloudflare (DNS)

1. **Dashboard → Add a domain** → `performancehealthgroup.org` → Free plan.
2. Cloudflare scans the current DNS records and lists them. **Before
   continuing, compare that list with the registrar's DNS page** and add
   anything missing. Email records are the ones that matter:
   - MX records (Google Workspace uses `ASPMX.L.GOOGLE.COM` and the ALT
     servers, or a single `SMTP.GOOGLE.COM`)
   - TXT `v=spf1 include:_spf.google.com ~all`
   - TXT `google._domainkey` (DKIM) and `_dmarc`
   - any site-verification TXT records (Google Search Console, Workspace)
   The `www` CNAME to `ghs.googlehosted.com` is Google Sites; it gets
   replaced in step 5, leave it for now.
3. Cloudflare shows two nameservers (for example `ada.ns.cloudflare.com` and
   `rob.ns.cloudflare.com`). Copy them.

## 4. Point the registrar at Cloudflare's nameservers

Where the domain is registered decides the clicks:

- **Squarespace Domains** (former Google Domains): Domains → the domain →
  DNS → *Domain Nameservers* → *Use custom nameservers* → paste both.
- **GoDaddy**: My Products → the domain → DNS → *Nameservers* → *Change* →
  *Enter my own nameservers*.
- **Namecheap**: Domain List → Manage → *Nameservers* → *Custom DNS*.
- Any other registrar: look for "nameservers" or "custom DNS".

Propagation usually finishes within an hour (up to 24 h). Cloudflare emails
when the zone is active. Email keeps working throughout as long as the
records in step 3 were complete, because Cloudflare answers with the same
records the registrar did.

If you would rather not move the nameservers: only `www` can be pointed at
Pages from an outside DNS host (CNAME `www` → `performancehealthgroup.pages.dev`);
the bare domain then needs the registrar's own forwarding to `www`. The
nameserver route above is simpler and is what Cloudflare recommends.

## 5. Attach the custom domains to the Pages project

1. **Workers & Pages → performancehealthgroup → Custom domains → Set up a
   custom domain** → `www.performancehealthgroup.org`. Cloudflare offers to
   replace the existing `www` record (the Google Sites CNAME); accept.
2. Repeat for `performancehealthgroup.org` (the bare domain).
3. Both show **Active** once certificates are issued (minutes). The
   `_redirects` file sends the bare domain to `www`.
4. Optional: **SSL/TLS → Edge Certificates → Always Use HTTPS: On**.

## 6. Verify the live site, then retire the Google Site

- `https://www.performancehealthgroup.org/` serves the new site;
  `https://performancehealthgroup.org/` redirects to it.
- Send and receive one email to confirm mail was not affected.
- In Google Sites, remove the custom domain from the site's settings and
  unpublish it, so nobody edits a copy that is no longer live.
- In Google Search Console, resubmit `https://www.performancehealthgroup.org/sitemap.xml`.
  A DNS-verified property stays verified if its TXT record was carried over.
- In `public/_redirects`, uncomment the last line so the pages.dev address
  also redirects to the real domain, and push.

## Day to day

- Push to `main` → live within a minute. Any other branch → a preview URL
  posted on the commit/PR.
- Header or footer change: edit `tools/partials/*.html`, run
  `node tools/sync-chrome.mjs`, commit.
- Manual deploy from a laptop without Git: `npx wrangler login` once, then
  `npx wrangler pages deploy` (reads `wrangler.toml`).
