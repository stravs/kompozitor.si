# Publish Kompozitor to Cloudflare Workers

This project uses Astro static output (`dist/`) and a Cloudflare Worker for `POST /api/izba`. Use **Workers**, not a static-only hosting project: the Izba form needs the Worker and its email binding.

## Local preflight

Use the Node version in `.node-version`, then run:

```sh
npm ci
npm run check
npm run build
npm test
npx wrangler deploy --dry-run
```

To test the routes and email binding locally, run `npm run cf:dev -- --var IZBA_RECIPIENT:test@example.com`. Wrangler simulates email delivery locally; a successful local form submission is not proof that an email was delivered.

## First publish: preview only

1. Commit the intended release files and push `main` to `stravs/kompozitor.si`. The GitHub repository must contain `main` before connecting it to Workers Builds.
2. In the Cloudflare account that owns `kompozitor.si`, enable [Email Sending](https://developers.cloudflare.com/email-service/configuration/domains/) for `kompozitor.si`. The Worker sends from `anze@kompozitor.si`. [Verify the receiving inbox](https://developers.cloudflare.com/email-service/configuration/destination-addresses/) in the same Cloudflare account. To match Apartments Olga, verify your actual inbox rather than a forwarding alias. Follow the onboarding DNS instructions without replacing existing mail routing records.
3. In **Workers & Pages**, connect the GitHub repo to a Worker named **`kompozitor-si`**, matching `wrangler.jsonc`. In [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), use branch `main`, root `/`, build command `npm run build`, and deploy command `npx wrangler deploy`. This uploads the Astro output and the Worker together. For a manual deployment instead, authenticate with `npx wrangler login`, check the account with `npx wrangler whoami`, then run `npm run deploy` after approval.
4. Under the Worker’s **Settings → Variables and Secrets**, create an encrypted secret named `IZBA_RECIPIENT` containing only the verified inbox address. Set it before deploying this version to production. Without the secret, the form cannot send.
5. Use the Worker’s `workers.dev` URL first. Verify `/izba/`, that `/izba` redirects to it, and that an actual browser submission reaches the destination mailbox with the correct Reply-To. The preview is still publicly accessible unless protected, but it sends `noindex`.

## Publish Izba at `izba.kompozitor.si`

1. In Cloudflare, inspect the current DNS and Worker routes for `izba.kompozitor.si`. It already resolves publicly, but returned HTTP 404 during preflight. If there’s an existing CNAME, review what it serves before replacing it; Cloudflare cannot add a Worker Custom Domain over an existing CNAME. Leave the apex `kompozitor.si` unchanged.
2. On the `kompozitor-si` Worker, go to **Settings → Domains & Routes → Add → Custom Domain** and add `izba.kompozitor.si` ([Cloudflare instructions](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)). This is intentionally a separate dashboard step so a preview deploy never changes DNS.
3. Verify `https://izba.kompozitor.si/` serves Izba and `https://kompozitor.si/izba/` permanently redirects there. The form remains at `/api/izba`; submit a marked test and confirm email delivery and Reply-To. Verify the studio and index prototypes return 404 on the subdomain and the existing apex is unaffected.

The subdomain retains `noindex` until indexing is approved. For a search launch, remove it from both the Izba HTML and the static response on that hostname, while keeping prototypes out of search. `noindex` does not restrict access. Consider rate limiting `POST /api/izba` before promoting the preview.
