#   Coffee — Digital Menu System

A modern, bilingual (Arabic/English) digital coffee shop menu built with Next.js 14, InstantDB, and Tailwind CSS.

## Features

- **Public Menu** — Mobile-first, QR-code-accessible customer menu
- **Bilingual** — Full Arabic (RTL) & English (LTR) toggle
- **Admin Dashboard** — Protected CRUD panel for categories & items
- **Real-time** — InstantDB powers live data sync
- **QR Code** — Built-in QR generator with PNG download
- **Image Upload** — Cloudinary integration for item images
- **Search & Filter** — Real-time search and category tabs

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | InstantDB |
| Auth | NextAuth.js v4 (Credentials) |
| Images | Cloudinary (free tier) |
| QR Code | qrcode.react |
| Animations | framer-motion |
| Forms | react-hook-form + zod |

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local` and fill in your values:

```env
# InstantDB
NEXT_PUBLIC_INSTANTDB_APP_ID=4a86cbee-44d0-49db-b911-09c3a6985bf4

# NextAuth
NEXTAUTH_SECRET=your-secret-here   # run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Cloudinary (optional — for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=menu-upload

# Public URL (update before deployment)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public menu.

### 4. Access Admin Panel

Go to [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Default credentials (set in `.env.local`):
- **Username:** `admin`
- **Password:** ` admin2024`

### 5. Load Menu Data

After logging into the admin panel, go to **Dashboard** and click **"🌱 Load   Menu Data"** to pre-populate your database with all 60+   Coffee menu items across 8 categories.

## Cloudinary Setup (Image Uploads)

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings → Upload → Upload presets**
3. Click **Add upload preset**, set:
   - Signing Mode: **Unsigned**
   - Preset name: ` -menu-upload`
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET= -menu-upload
   ```

> Without Cloudinary, you can still use image URLs manually (paste any image URL in the item form).

## Folder Structure

```
src/
├── app/
│   ├── page.tsx                    ← Public menu
│   ├── admin/
│   │   ├── login/                  ← Login page
│   │   └── dashboard/              ← Admin CRUD pages
│   └── api/auth/[...nextauth]/     ← NextAuth handler
├── components/
│   ├── menu/                       ← Customer menu components
│   ├── admin/                      ← Admin dashboard components
│   └── ui/                         ← Shared UI
├── lib/
│   ├── db.ts                       ← InstantDB client
│   ├── auth.ts                     ← NextAuth config
│   └── seed.ts                     ← Menu data seeder
├── context/
│   └── LanguageContext.tsx         ← AR/EN toggle
└── locales/
    ├── en.json                     ← English strings
    └── ar.json                     ← Arabic strings
```

## Deployment (Vercel)

1. Push your code to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_SITE_URL` to your Vercel URL
5. Deploy!

After deployment, go to `/admin/dashboard/qrcode` to download the QR code with your live URL.

## Admin Panel Pages

| Page | URL |
|---|---|
| Dashboard | `/admin/dashboard` |
| Categories | `/admin/dashboard/categories` |
| Menu Items | `/admin/dashboard/items` |
| Settings | `/admin/dashboard/settings` |
| QR Code | `/admin/dashboard/qrcode` |

## Menu Categories (Pre-seeded)

1. ☕ Hot Drinks — 19 items
2. 🧊 Cold Drinks — 8 items
3. 🥤 Milkshake — 9 items
4. 🍓 Smoothie — 9 items
5. 🍊 Fresh Juice — 4 items
6. 🍹 Cocktails — 3 items
7. 🌿 Mojito — 1 item
8. 🍰 Sweets — 7 items

---

*  Coffee —   دايماً موجود ليحسن مزاجك*
