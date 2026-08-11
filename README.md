# My Budget App

Personal daily budget tracker — installable on iPhone as a home screen app.

## Deploy to GitHub Pages

1. Create a new repo on GitHub (any name)
2. Push this folder:
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. Repo → **Settings → Pages → Source → GitHub Actions**
4. Go to **Actions → Deploy to GitHub Pages → Run workflow**
5. App live at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

## Add to iPhone

1. Open the URL in **Safari**
2. Tap **Share → Add to Home Screen → Add**

## Run locally

```bash
npm install
npm run dev
```
