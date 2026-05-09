# Siri Boutique — PRD

> "Where Style Meets Perfection." A boutique e-commerce + custom tailoring platform for Siri Boutique, Hyderabad.

## Original problem statement

Build a fully working production-ready full-stack boutique e-commerce app with a separate but linked admin dashboard. Categories from the actual signboard: Designer Dresses, Designer Blouses, Indo-Western, Lehengas & Gagras, Crop Tops & Frocks, Sarees, plus tailoring services (Stitching, Saree Pre-Pleating & Box Folding, Machine Embroidery, Maggam Work, Wholesale Materials).

Customer flow: browse catalog → product (size chart + custom measurements) → cart → checkout → payment → order confirmation → tracking. A separate Custom Tailoring Services section lets customers book hemming, blouse stitching, dresses, alteration etc. and choose to either visit the store or send via Rapido. Customers can submit measurements through the website. Admin sees all updates in real time, manages orders/returns/refunds/inventory/photos, generates sales reports, can add new stock & materials. Anime.js-style scroll animations using Framer Motion. Back button at top-left.

## Architecture

- **Backend:** FastAPI · MongoDB (motor) · JWT auth (bcrypt + PyJWT) · Pydantic v2 models
- **Frontend:** React 19 · React Router 7 · Framer Motion · Sonner toasts · shadcn/ui primitives · pure CSS design system
- **Auth:** JWT bearer tokens stored in localStorage (`siri_token`) with role-based admin guard
- **Storage:** Product images as base64 in MongoDB
- **Payments:** Mock (COD + simulated online) — production-ready hooks for Razorpay/Stripe later

## What's been implemented (May 2026)

### Customer storefront
- [x] Hero with anime.js-style staggered character reveal (`Where style meets perfection`)
- [x] Marquee specialities strip
- [x] Spring edit & curated grids (Framer Motion staggered reveal on scroll)
- [x] Shop catalog with category radio filter, sort dropdown, colour swatches
- [x] Product detail: image gallery (4 thumbs), colour swatches, size pills + custom MTM, fabric cards, qty, add-to-bag
- [x] Custom-measurements modal — 9 fields, in/cm toggle, saved to user profile
- [x] Cart — qty +/-, remove, coupon validation (SIRI10 / SPRING15 / WED2500), live totals (subtotal + stitching + free shipping over ₹5000 + 5% GST)
- [x] Checkout — 3-step stepper (Shipping / Payment / Review), COD or Mock Online
- [x] Order confirmation with 4-step progress timeline & order number
- [x] Tailoring services page — 8 services
- [x] Service booking page — Rapido pickup vs Visit store, notes, optional measurements
- [x] Auth — login/register/account with Orders / Bookings / Measurements tabs
- [x] Atelier (about) + Visit (contact) pages
- [x] Persistent Back Button at top-left of every page
- [x] Footer
- [x] Toast notifications

### Admin operations console (`/admin`)
- [x] Separate login at `/admin/login` (role-checked)
- [x] Sidebar with live counts, breadcrumb, search, "View storefront" deep-link
- [x] Dashboard — 4 KPIs, 12-day revenue bar chart, top items, recent orders
- [x] Orders list with status filter chips → detail page with status advance, mark return, refund, customer measurements display, history timeline
- [x] Tailoring bookings list with expandable row → measurements, notes, status updates
- [x] Products CRUD with multi-image base64 upload, colours/fabrics/sizes, stock
- [x] Customers list with order count + lifetime value
- [x] Coupons CRUD (% or flat, min order, active toggle)
- [x] Reports — KPIs, daily revenue, top items
- [x] Hard-refresh-safe route guards (waits for AuthContext loading)

### Backend API surface
- `POST /api/auth/{register,login}` · `GET /api/auth/me` · `PUT /api/auth/measurements`
- `GET /api/products[?cat=&q=]` · `GET /api/products/{id}` (with recommendations)
- `GET /api/categories` · `GET /api/services` · `GET /api/recommendations`
- `POST /api/coupons/validate`
- `POST /api/orders` · `GET /api/orders/me` · `GET /api/orders/{id}`
- `POST /api/bookings` · `GET /api/bookings/me`
- Admin: `GET /api/admin/{stats,orders,bookings,customers,coupons}` · `PUT /api/admin/orders/{id}/status` · `PUT /api/admin/bookings/{id}/status` · `POST/PUT/DELETE /api/admin/products` · `POST/DELETE /api/admin/coupons`

### Seed data
- Admin user (`admin@siriboutique.in` / `SiriAdmin@2026`)
- Demo customer (`demo@siriboutique.in` / `demo1234`) with saved measurements
- 12 sample products across all categories
- 3 coupons: SIRI10 (10%), SPRING15 (15% min ₹5000), WED2500 (₹2500 off min ₹25000)

## Test status

- Backend: 38/38 pytest cases — `iteration_1.json`
- Frontend e2e: 100% targeted scenarios (auth, cart, checkout, admin, route guards) — `iteration_2.json`, `iteration_3.json`

## Prioritised backlog

### P0 — Production readiness
- Razorpay integration (India-first) → live online payments
- Replace base64 images with Emergent object storage (faster page loads, lower DB bloat)
- Email/SMS notifications on order placement, status change, booking confirmation (Twilio + Resend)

### P1 — Growth features
- Wishlist + saved-for-later
- Customer reviews & ratings
- WhatsApp share buttons on products
- Order tracking page with live courier status
- Inventory low-stock alerts on admin dashboard
- CSV export of orders & customers

### P2 — Nice-to-have
- Multi-image gallery with zoom on product page
- Wedding lookbook (curated bridal pages)
- Loyalty program / referral codes
- Bilingual UI (English / Telugu / Hindi)

## User personas
- **The Bride / Wedding-shopper** — visits to commission a maggam lehenga or pre-pleated saree, shares measurements via website
- **The Returning Customer** — books quick alterations & blouse stitching, sends via Rapido
- **The Wholesale Buyer** — browses materials, books a store visit
- **Siri Owner / Admin** — runs the dashboard daily, processes orders and bookings, adds new stock photos
