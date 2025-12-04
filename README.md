# Patente – Italian Driving Theory Study App (Public Code Version)

This repository contains the **public, code-only version** of the Patente Driving Theory Study App.  
It showcases the **React, Vite, TailwindCSS, internal tool scripts, and full project architecture**, while **excluding copyrighted driving‑theory JSON data**.

This public version is ideal for:
- Demonstrating your **frontend engineering skills**
- Showing **clean architecture**, component structure, build tools
- Including in your **CV**, GitHub profile, and job applications

---


# 🚀 Project Overview

The Patente App is a **slide-based learning interface** that loads structured topic files and displays them with:

- Visual slides  
- Highlight overlays  
- Per-topic navigation  
- Segment breakdowns  
- Data-validation and pre-processing tools  

The public version keeps all logic, so reviewers can fully understand the engineering behind the application.

---

# 📁 Project Structure (Public Version)

```text
Patente_Public/
├─ index.html
├─ package.json
├─ package-lock.json
├─ postcss.config.js
├─ tailwind.config.js
├─ vite.config.js
│
├─ public/
│   ├─ images/                   # Required UI images (kept)
│   ├─ data/
│   │   └─ README.md             # Note: JSON content removed
│   ├─ highlight.png
│   └─ translate.jpg
│
├─ src/
│   ├─ App.jsx                   # Main React container
│   ├─ main.jsx                  # Entrypoint
│   ├─ index.css                 # Tailwind styles
│   │
│   ├─ components/
│   │   ├─ Segment.jsx
│   │   ├─ SlideList.jsx
│   │   ├─ SlideView.jsx
│   │   ├─ TopBar.jsx
│   │   └─ TopicList.jsx
│   │
│   ├─ lib/
│   │   └─ highlight.js
│
├─ tools/                        # Developer utilities
│   ├─ audit-normalize.cjs
│   ├─ fill-missing.mjs
│   ├─ make-output.cjs
│   └─ qa-report.cjs
│
└─ android/ (optional)           # Capacitor Android scaffolding
    └─ app/
        └─ src/
```

---

# 🛠 Installation

### 1. Clone the repository
```bash
git clone https://github.com/Hamedius/Patente_Public.git
cd Patente_Public
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```

App will run on:

```
http://localhost:5173/
```

Vite enables fast hot‑reload.

---

# 📦 Production Build

```bash
npm run build
npm run preview
```

Output is placed in `/dist` and can be deployed to:

- GitHub Pages  
- Netlify  
- Vercel  
- Any static hosting service  

---

# 📱 Android App (Optional via Capacitor)

To build and run the app on Android:

```bash
npm install
npx cap sync android
npx cap open android
```

Use Android Studio to build & deploy to a device.

---

# 🧪 Developer Tool Scripts

The project includes powerful Node-based utilities:

### Validate & normalize topic files
```bash
node tools/audit-normalize.cjs
```

### Fill missing data fields
```bash
node tools/fill-missing.mjs
```

### Build final output bundle
```bash
node tools/make-output.cjs
```

### Generate QA report
```bash
node tools/qa-report.cjs
```

⚠️ These tools operate fully but require JSON data, which is intentionally **not included**.

---

# 📄 About Removed JSON Data

The private version of the project contains a large set of structured topic files:

- Official driving-theory topics  
- Slide text  
- Highlight regions  
- Metadata  
- Segment structures  

However, these materials are **copyright restricted**, so they are not redistributed.

This public repository preserves:

- Architecture  
- Engineering work  
- Components  
- Logic  
- Tooling  

…while safely removing protected content.

---

# 👤 Author

**Hamed Nahvi**  
GitHub: https://github.com/Hamedius

---

# ✔️ Purpose of This Public Repo

This version is intentionally designed to:

- Showcase technical skills  
- Demonstrate project architecture  
- Be included in résumés & portfolios  
- Remain legally publishable  
- Fully represent the engineering effort without exposing restricted data  
