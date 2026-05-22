# Fokus Workspace

A highly polished, minimal, and elegant personal workspace and task manager built with React, Vite, and Tailwind CSS. Featuring a pristine dark Nordic aesthetic, Fokus combines seamless keyboard ergonomics with structured productivity states.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

---

## Key Features

- **Nordic Slate Design**: Beautiful, responsive user interface styled with professional Nord colorways, custom transition states, and high contrast typography.
- **Dynamic Task Board**: Ergonomic status filters, interactive completion transitions, and real-time category association.
- **Ergonomic "Nerd Mode"**: A barebones keyboard-focused visual alternative, optimized for fast terminal-like interaction with minimal distractions.
- **Indexed Local Storage Persistence**: Leverages robust local state caching so your workspace loads instantly and persists client-side.
- **Seamless Local Data Backup**: Export your full schedule structures into standard `.json` backup payloads or reload them on any browser.

---

## 🛠️ Local Development Setup

To run Fokus on your local machine:

### Prerequisites

Ensure you have **Node.js** (v18 or higher) and **npm** installed on your system.

### Installation

1. **Clone your repository** (or extract your downloaded ZIP file):
   ```bash
   git clone github.com/shadowskytech/fokus-workspace.git
   cd fokus-workspace
   ```

2. **Install exact dependencies**:
   ```bash
   npm install
   ```

3. **Launch the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) or the port indicated in your terminal to see your live workspace!

4. **Build for high-performance production**:
   ```bash
   npm run build
   ```
   The compiled codebase will be generated in `/dist` for easy deployment.

---

## 🚀 Recommended Free Hosting Solutions

For your static React workspace app, the absolute best free hosting platforms are:

### 1. Vercel (Recommended — Simplest Integration)
- **Why**: Zero-configuration, lightning-fast global CDN, and automatic continuous deployment on every `git push`.
- **How**:
  1. Head to [vercel.com](https://vercel.com) and link your GitHub account.
  2. Click **New Project** and choose your `fokus-workspace` repository.
  3. Select **Vite** as your framework preset and click **Deploy**.

### 2. Netlify (Outstanding for static Single Page Apps)
- **Why**: Solid CDN, custom domain support, and extremely easy setup.
- **How**:
  1. Login to [netlify.com](https://netlify.com) using GitHub.
  2. Select **Import from Git** -> **GitHub**.
  3. Authorize the repository, verify the build command is `npm run build` and publish directory is `dist`, then hit deploy.

### 3. GitHub Pages
- **Why**: Hosted directly in your GitHub account.
- **How**: Configure GitHub Actions to automatically compile and deploy your code from the `main` branch to the `gh-pages` branch.

---

## 📝 GitHub Repository Setup (Manual Steps)

If the automated web button is experiencing network or authentication timeouts, you can push the codebase manually in 3 simple terminal commands:

1. **Initialize & Commit Locally**:
   ```bash
   git init -b main
   git add .
   git commit -m "feat: initial commit of Fokus Workspace"
   ```

2. **Create a Blank Repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Enter your repository name (e.g., `fokus-workspace`).
   - Keep it empty (do **not** add a README, `.gitignore`, or license, as we have already included them here).

3. **Link and Push**:
   ```bash
   git remote add origin https://github.com/<your-username>/fokus-workspace.git
   git push -u origin main
   ```
