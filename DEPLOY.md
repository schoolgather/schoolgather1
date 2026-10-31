# Vercel Deployment Guide

This project is fully configured for deployment on **Vercel** with Vite, Tailwind CSS, and single-page application routing.

---

## ⚡ Option 1: Deploy with Git (Recommended)

1. **Push your code to GitHub, GitLab, or Bitbucket**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for School Gather"
   git remote add origin https://github.com/<your-username>/school-gather.git
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your **school-gather** repository.
   - Vercel will automatically detect **Vite** as the framework.
   - Click **Deploy**.

Your site will be live at `https://school-gather.vercel.app` (or your custom domain) with automatic deployments on every commit!

---

## 🚀 Option 2: Deploy directly via Vercel CLI

From your terminal in this directory:

```bash
npx vercel
```

1. Select **Y** to set up and deploy.
2. Choose your scope/team.
3. Keep default settings (Vercel automatically detects `vite` and `dist` output).
4. For production deployment, run:
   ```bash
   npx vercel --prod
   ```

---

## ⚙️ Configuration Files Included

- **`vercel.json`**: Pre-configured with SPA rewrites so direct navigation and refreshes to routes like `/schools`, `/match`, `/compare`, and `/apply` work seamlessly without 404s.
- **`package.json`**: Configured with Vite build script (`vite build`) and all modern UI/routing dependencies.
- **`vite.config.js`**: Set up with `@/` path alias resolution.
