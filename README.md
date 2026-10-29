# QA Testing Resources

A small static site of browser-based tools that R/GA QA colleagues use while testing.

| Page | Purpose |
|---|---|
| `contrast.html` | Text Contrast Checker |
| `buttons.html` | Button Contrast Checker |
| `payload.html` | AI Payload Library: a reference set of test inputs for authorized QA and security testing |
| `support.html` | Device & Browser Support: recommended OS, browser and device coverage, copied from the Support tab of the QA device/browser support sheet (update both together) |
| `marketshare.html` | Market Share: browser, OS and social market share, linked from the support page and nested under it in the menu. US vs Worldwide bar charts drawn from StatCounter CSV exports pasted into `marketshare-data.js` (update steps are in that file) |
| `generator.html` | Test File Generator: creates dummy PNG, JPG, GIF, WebP, BMP, SVG, PDF, TXT, CSV or JSON files from 0 KB to 50 MB in the browser, for testing upload limits and file-type checks. Listed on the homepage under "Other Useful Tools" |

## Audience, use, and owner

- **Audience:** R/GA QA colleagues (internal). Not for public or client use.
- **Expected use:** a shared tool used over time.
- **Owner:** Kevin Geruldsen (kevin.geruldsen@rga.com)
- **Data:** none. Everything runs in the browser. No backend, no stored data, and no secrets.

## Stack

Plain HTML, CSS, and JavaScript, with no build step and no package manager.
The contrast pages load `tesseract.js` (Apache-2.0) from jsDelivr for OCR.
`payload-data.js` holds the AI Payload Library's built-in payloads.

## Local setup

```bash
py -m http.server 8000 --bind 127.0.0.1
```

Then open http://127.0.0.1:8000. `.claude/launch.json` defines the same server as `qa-site`.

No environment variables are required.

## Deployment

- **Source:** https://github.com/RGADigital/qa-testing-resources (internal repo)
- **Production:** https://qa-testing-resources.vercel.app/index.html
- **Host:** Vercel, deployed through the GitHub integration as a static site with
  no build command and no environment variables. Merging to `main` deploys to
  production; every other branch and pull request gets its own preview URL.
- **Access:** this is an internal tool, so Vercel Deployment Protection (password
  protection or stronger) must cover all deployments, including production.
  Check that the URL asks for the password in a private window before you share it.
  **As of October 29, 2026 the production URL is publicly reachable without a
  password; turn protection on before sharing the link.**

## Delivery and review

- Shared work goes through short-lived `feat/` / `fix/` / `chore/` branches and
  PRs, which are squash-merged to `main`. `main` stays deployable.
- Before merging a change, get an independent review, plus an accessibility
  review (WCAG 2.2 AA) when the UI changes.
- Recovery: revert the commit on `main`. Vercel redeploys it, or you can promote
  an earlier deployment.


R/GA engineering defaults for AI assistants are in [AGENTS.md](AGENTS.md).
