# Gym Flow

Mobile-first gym workout app built with SvelteKit.

## Local development

```sh
npm install
npm run dev
```

## Quality checks

```sh
npm run check
npm run build
```

## Publish to GitHub and deploy on GitHub Pages

1. Create a new empty GitHub repository.
1. Add your remote (replace placeholders):

```sh
git remote add origin https://github.com/<your-username>/<your-repo>.git
```

3. Commit and push:

```sh
git add .
git commit -m "Initial Gym Flow app"
git push -u origin main
```

4. In GitHub, open Settings -> Pages.
5. Under Build and deployment, set Source to GitHub Actions.
6. Wait for the Deploy to GitHub Pages workflow to finish.

Your site URL will be:

```txt
https://<your-username>.github.io/<your-repo>/
```

Notes:
- If your repo is named `<your-username>.github.io`, the site is deployed at the root domain with no repo path suffix.
- The workflow file is in `.github/workflows/deploy-pages.yml`.
