# AgriRent – Agricultural Equipment Booking

A full-stack agricultural equipment rental platform where farmers can browse and book drones, harvesters, tractors, and other machinery. Includes a secure admin dashboard for complete content management.

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Icons:** lucide-react

## Features

### Public Website
- Home page with hero, owner info, featured equipment, how-it-works, testimonials, FAQs
- Services page with search and category filters
- Equipment details pages with image galleries and specifications
- Gallery page with masonry layout, lightbox, and video support
- Booking page with real-time date/time availability checking
- Booking success page with unique reference number
- Contact page with form, map, and click-to-call/WhatsApp
- About, Privacy Policy, Terms & Conditions pages
- Floating Call & WhatsApp buttons
- Fully responsive, SEO-optimized with Open Graph metadata

### Admin Dashboard (`/admin`)
- Secure server-side authentication (Supabase Auth)
- First-time setup via secure edge function (requires authorized mobile number `8555895018`)
- Booking management: approve, reject, cancel, complete, reschedule
- Availability rechecks on approval to prevent overlaps
- Booking status history / audit trail
- CSV export of bookings
- Equipment management (add/edit/delete, image upload, specifications)
- Gallery management (upload images/videos, categorize, publish)
- Availability management (block dates/slots, recurring blocks)
- Enquiries management
- Owner profile editor
- Website content editor (about, testimonials, FAQs)
- Website settings (branding, colors, hero, contact, social links)
- Change password with reauthentication

## Database & Security

- 11 tables: profiles, website_settings, equipment, equipment_images, services, gallery, availability, bookings, booking_status_history, testimonials, faqs, enquiries
- Row Level Security on all tables
- Admin role verified server-side via JWT `app_metadata.role` (user-immutable)
- `SECURITY DEFINER` functions for atomic booking creation and approval with overlap detection
- Public can read published content and submit bookings/enquiries only
- Customers cannot read other customers' bookings
- Media stored in Supabase Storage with admin-only write policies

## First-Time Admin Setup

1. Go to `/admin/login` and click **First Setup**
2. Enter the authorized setup mobile number: **8555895018**
3. Choose a strong password (min 8 characters)
4. This creates the admin account securely on the server via the `admin-setup` edge function
5. Sign in with `admin@agrirent.local` and your password

To reset the password later, use the same First Setup flow, or use **Change Password** in the dashboard.

## Local Development

The Supabase environment variables are pre-populated in `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Install and run:
```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run typecheck
```

## Deployment

### Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Vercel auto-detects Vite — no build config needed
4. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. The site is live on your Vercel domain.

### Supabase Configuration

The Supabase project is already provisioned. The schema, RLS policies, and the `admin-setup` edge function are deployed. If you need to re-apply the schema, the migration SQL is in `supabase/migrations/`.

The `media` storage bucket is public-read so website images load fast; only authenticated admins can upload.

## Project Structure

```
src/
  components/      Navbar, Footer, Hero, EquipmentCard, FloatingButtons
  lib/             supabase client, types, auth, site context, router
  pages/           Public pages
    admin/         Admin dashboard pages
supabase/
  functions/       admin-setup edge function
  migrations/      SQL schema
public/            robots.txt, sitemap.xml
```
