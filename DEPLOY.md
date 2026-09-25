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

## Automated cutover (for Claude Code)

The owner has asked Claude Code to run steps 1, 3 and 5 through the Cloudflare
API rather than clicking through the dashboard. The session needs, in the
environment settings (not pasted into chat):

- `CLOUDFLARE_API_TOKEN` — custom token with Account · *Cloudflare Pages: Edit*,
  Zone · *Zone: Edit*, Zone · *DNS: Edit*, Zone · *Zone Settings: Edit*;
  Zone resources: all zones on the account.
- `CLOUDFLARE_ACCOUNT_ID` — from the Workers & Pages overview page.
- Network access to `api.cloudflare.com`, `cloudflare-dns.com` (to read the
  domain's current records over DNS-over-HTTPS) and `registry.npmjs.org`.

Sequence, in order; each step is idempotent and safe to re-run:

1. Read the domain's current public records over DNS-over-HTTPS
   (`https://cloudflare-dns.com/dns-query?name=…&type=…`): NS, A, AAAA, MX,
   TXT at the apex; `www`; `google._domainkey`, `_dmarc`, and any mail hosts.
   Keep the list; it is the source of truth for step 3.
2. `POST /accounts/{account}/pages/projects` `{name:"performancehealthgroup",
   production_branch:"main"}` if `GET …/pages/projects/performancehealthgroup`
   is 404. Then `npx wrangler@4 pages deploy public --project-name
   performancehealthgroup --branch main` from the `main` checkout, and check
   `https://performancehealthgroup.pages.dev/` (pages, `/home` redirect,
   `/clients/`).
3. `POST /zones` `{name:"performancehealthgroup.org", type:"full",
   account:{id}}` unless it exists. `POST /zones/{zone}/dns_records/scan`,
   then compare the zone's records with step 1 and create anything missing
   (MX, SPF/DKIM/DMARC TXT, verification TXT). Do not add `www` or the apex A
   record; step 5 sets those. Record the two `name_servers` from the zone.
4. Hand the two nameservers to the owner for Namecheap (step 4 above) and
   poll `GET /zones/{zone}` until `status` is `active`.
5. `POST /accounts/{account}/pages/projects/performancehealthgroup/domains`
   `{name:"www.performancehealthgroup.org"}` and again for
   `performancehealthgroup.org`; Cloudflare writes the CNAME records itself
   (delete any leftover `www` CNAME to `ghs.googlehosted.com` or apex A/AAAA
   records first). `PATCH /zones/{zone}/settings/always_use_https`
   `{value:"on"}`.
6. Verify over HTTPS: `www` serves the site with the `_headers` values, the
   apex 301s to `www`, `/home` and `/start-intake` 301, `/clients/` returns
   `X-Robots-Tag: noindex`. Then uncomment the pages.dev line in
   `public/_redirects`, commit to `main`, and tell the owner to unpublish the
   Google Site and resubmit the sitemap in Search Console.
