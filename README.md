# StockAgent — Command Center

A trading-desk-style dashboard for the [stock-agent](https://github.com/manojkotha-220591/stock-agent) portfolio
intelligence system: sortable holdings blotter, per-stock dossier with score history, live sync with your private
repo, and one-click triggers for your existing GitHub Actions workflows.

**This repo is intentionally separate from `stock-agent`.** GitHub Pages on the free plan only works from a
*public* repository, and `stock-agent` holds your real holdings/quantities — so this repo contains only the
dashboard app itself (with generic sample data), and your real portfolio data is pulled in at runtime via a
GitHub Personal Access Token you enter in the browser. That token and the data it fetches live only in your
browser tab's memory; nothing is ever written back here.

## One-time setup (10 minutes)

### 1. Create this repository
1. On GitHub, click **+ → New repository**
2. Name it `stockagent-dashboard` (or anything you like — the workflow adapts automatically)
3. Set it to **Public** (required for free-tier GitHub Pages)
4. Don't initialize with a README (you're uploading one)

### 2. Upload these files
Upload the entire contents of this folder (unzipped) to the repository — either drag-and-drop via
**Add file → Upload files** (preserves the folder structure) or via git:
```bash
git clone https://github.com/YOUR_USERNAME/stockagent-dashboard.git
cd stockagent-dashboard
# copy all these files in, then:
git add -A
git commit -m "Initial dashboard"
git push
```

### 3. Enable GitHub Pages
1. Repo → **Settings** → **Pages** (left sidebar, under "Code and automation")
2. Under **Build and deployment → Source**, select **GitHub Actions**
3. That's it — the included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically on every
   push to `main`

### 4. Get your URL
1. Go to the **Actions** tab, wait for the "Deploy Dashboard to GitHub Pages" run to finish (~1 minute)
2. Repo → **Settings** → **Pages** will now show your live URL:
   `https://YOUR_USERNAME.github.io/stockagent-dashboard/`
3. Bookmark it — every future push to `main` redeploys automatically

## Connecting to your real portfolio data

Once the dashboard is live:
1. Go to the **Connect & Sync** tab
2. Create a **fine-grained Personal Access Token** at
   [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new):
   - **Repository access**: select only `stock-agent` (don't grant access to all repos)
   - **Permissions**: `Contents: Read and write`, `Actions: Read and write`
   - Set an expiration (30–90 days is reasonable — you'll just generate a new one when it expires)
3. Paste the token in, enter your owner/repo (defaults to `manojkotha-220591/stock-agent`), click **Connect & Pull Data**
4. Your real holdings, scores, risks, and opportunities load directly from the private repo
5. Use the workflow buttons to trigger `daily_run.yml`, `add_stock.yml`, `research_stock.yml`, `remove_stock.yml`,
   and `resend_report.yml` directly from the dashboard

The token is never persisted (no localStorage/cookies) — closing the tab clears it. You'll need to re-enter it
each session, which is the trade-off for not storing a repo-and-workflow-scoped credential anywhere.

## Local development
```bash
npm install
npm run dev        # http://localhost:5173
npm run build       # outputs to dist/
npm run preview     # serve the production build locally
```

## What's real vs. sample

On first load you'll see illustrative sample data (real NSE-listed company names from typical portfolios, but
generic quantities and synthetic analysis text) so the dashboard is explorable immediately. Connecting via the
PAT replaces this with your live data for the rest of that browser session.
