# مجتمع پژوهش (Pazhuhesh Complex)

A full-stack, bilingual (Dari/English) educational portal for an Afghan student community — featuring a study lounge, academic advising, scholarship listings, and student achievements — built with a custom CMS and a dual-role admin panel.

> **Live focus:** offline-first performance, RTL-native design, and a content pipeline non-developers can safely manage.

---

## ✨ Features

- **Public Portal**
  - Study Lounge (سالن مطالعه) — amenities, rules, membership plans, photo gallery
  - Academic Services & Advising catalog
  - Active Scholarships listings
  - Student Achievements showcase
  - About Us page
  - Dark / light theme with persisted user preference
  - Bilingual UI (Dari default, English available) via `react-i18next`
  - Installable PWA with offline support for previously visited pages

- **Admin CMS**
  - Dual-role access: full **Super Admin** panel and a restricted **Department Admin** panel (scoped to services & scholarships only)
  - Role-based routing and access control
  - Image upload and management backed by Supabase Storage
  - Seed + admin-managed content pattern for rules, FAQs, achievements, and scholarships (safely layer custom edits over sensible defaults)
  - Server-side anti-spam protection (rate-limited request submissions via a Supabase Edge Function)

- **Resilience & Performance**
  - Offline-first data layer: instant render from `localStorage`, with background hydration from the live database
  - Service Worker (Workbox) caching strategy tuned per data type — long-lived caching for uploaded images, always-fresh for live content, and the admin panel fully excluded from caching
  - Anti-FOUC theme loading

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite |
| Styling | Tailwind CSS (RTL-first, logical properties, OKLCH color tokens) |
| Routing | React Router DOM |
| Backend | Supabase (PostgreSQL, Storage, Edge Functions) |
| Icons | Lucide React |
| i18n | i18next / react-i18next |
| Offline / PWA | vite-plugin-pwa (Workbox) |
| Hosting | Vercel |

---

## 🏗️ Architecture Overview

- **Data pipeline:** `portalService.js` → `PortalDataContext` (public site) / `AdminDataContext` (admin panel), backed by `staticPortalConfig.js` for sane defaults.
- **Hooks:** `usePortal()` and `useAdminData()` expose portal data throughout the component tree.
- **Theming & Language:** `ThemeContext` and `LanguageContext` follow the same structural pattern, each with a one-time preference prompt for first-time visitors.
- **Access control:** `PortalLayout.jsx` enforces role-based routing between the Super Admin and Department Admin experiences.
- **Content model:** recurring "seed + admin list" pattern (e.g. default hall rules merged with admin-added/edited/deleted entries) keeps built-in defaults editable without losing them.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS recommended)
- A Supabase project (PostgreSQL + Storage + Edge Functions)

### Installation

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The production build is output to `dist/`. This project is deployed by building locally and uploading the contents of `dist/` directly to the hosting provider (rather than a Git-triggered CI/CD pipeline), so `vercel.json` is kept inside `public/` to ensure it's included in every build.

### Preview a Production Build Locally

```bash
npm run preview
```

---

## 🗄️ Database

Database schema, roles, and Row-Level Security (RLS) policies are defined in SQL migration files (see `phase3_admin_roles_and_rls.sql` for the admin roles & RLS setup). Apply migrations through the Supabase SQL editor or CLI against your own project.

---

## 🌐 Internationalization

The public-facing site is bilingual:
- **Dari (فارسی دری)** — default language, formal written style
- **English** — secondary language, toggled via the language preference prompt

Admin panels remain Dari-only, and admin-authored content (e.g. scholarship descriptions) is displayed in whichever language it was entered in.

---

## 📱 Progressive Web App

The site can be installed as a PWA and supports offline access to previously visited pages. The admin panel is intentionally excluded from all caching to guarantee admins always see live data.

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🙏 Acknowledgments

Built by the team at **مجتمع پژوهش (Pazhuhesh Complex)** to support Afghan students with academic resources, advising, and scholarship opportunities.
