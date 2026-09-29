# Entra Web

Web portal and event operations dashboard for Entra, built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

---

## 1. System Overview

Entra Web provides two primary application workspaces within a unified codebase:
1. Public Customer Portal: Event discovery, interactive venue mapping, high-concurrency ticket purchasing, queue waiting room orchestration, e-ticket digital pass viewing, and official PDF invoice generation.
2. Organizer & Administrative Dashboard: Event lifecycle administration, ticket tier configuration, live attendee check-in audits, sales trend visualization, and transparent revenue-sharing financial ledgers.

---

## 2. Technology Stack

- Framework: Next.js 16.2 (App Router, Turbopack)
- Library: React 19.2
- Language: TypeScript 5
- Styling: Tailwind CSS v4
- State & Data Fetching: TanStack React Query v5, Context Providers, Axios / Native Fetch
- Mapping & Geolocation: Leaflet 1.9
- Iconography: Lucide React
- Payment Integration: Midtrans Snap JS Client SDK

---

## 3. Core Capabilities and Architectural Standards

### 3.1 Ticket Waiting Room & Queue System (`/events/[id]/queue`)
- 1-at-a-Time Active Window: Buyers wait in a FIFO queue during high-traffic sales. When promoted to active status, a 3-minute payment lease countdown begins.
- Monotonic High-Precision Countdown Engine: Built on absolute epoch difference (`Date.now()`) with a 250ms interval and browser `visibilitychange` listeners. It enforces strictly non-increasing updates, preventing timer jitter, reverse jumps, or desynchronization caused by background HTTP polling.
- Zero Scroll-Jump & Layout Shift Prevention: Prevents viewport shifts when Midtrans Snap injects its `iframe#snap-midtrans` into the DOM by locking body/HTML overflow and applying global fixed viewport positioning (`top: 0; left: 0; width: 100vw; height: 100vh`).
- Deferred Navigation: System redirects (`router.push`) upon expiration or completion are deferred using event loop macrotasks (`setTimeout(..., 0)`), preventing React render phase collision errors.

### 3.2 Integrated Order History & Payment Gateway Flow (`/my-tickets`)
- Seamless Queue Integration: Clicking "Bayar Sekarang" on pending orders automatically routes the user directly into the event waiting room (`/events/[id]/queue?orderId=...`), strictly respecting active queue limits rather than bypassing queue restrictions.
- Graceful Expiration Handling: Expired pending orders automatically transition to a red `KEDALUWARSA` state with a "Pesan Ulang" button that routes back to the specific event detail page.

### 3.3 Information Hierarchy & Complete Data Display
- Zero ID Truncation: Order IDs, User UUIDs, and Ticket codes are rendered in full using `break-all` styling without ellipsis (`...`) clipping.
- Natural Venue Location Format: Displays complete venue and city names (`${venue.name}, ${venue.city}`) across catalog cards, event details, e-tickets, and checkout modals without truncation.
- Stacked Information Cards: Event detail pages and e-ticket passes separate Date and Time into an upper row, while Location spans the full width below for maximum legibility.

### 3.4 Financial Dashboard & Analytics
- Fixed 7-Day Timeline Chart: Overview dashboard renders a 7-day continuous chronological sales trend with fixed-height bars, zero-day baseline indicators, and interactive value tooltips.
- Transparent 5% Platform Commission: Organizer financial views display a complete breakdown of Gross Ticket Sales, 5% Platform Fee, Net Revenue, and Available Withdrawable Balance. Complimentary tickets (Rp 0) are exempt from fees.

### 3.5 Design System Policies
- Strict No-Shadow / No-Ring Standard: Interactive buttons, tabs, and input controls suppress box shadows, focus rings, and elevation layers for a clean, flat aesthetic.
- Strict Zero-Toast Policy: Toast popups are omitted in favor of accessible native modal dialogs and inline context banners.

---

## 4. Prerequisites

- Node.js: Version 20.9.0 or higher
- npm: Version 10.0.0 or higher
- Running Entra API backend services

---

## 5. Environment Configuration

Copy the example environment file to `.env.local`:

```bash
cp .env.example .env.local
```

Key environment parameters:

| Variable | Description | Default / Example |
| --- | --- | --- |
| `NEXT_PUBLIC_AUTH_API_URL` | Base URL for `auth-service` | `http://localhost:8081` |
| `NEXT_PUBLIC_EVENT_API_URL` | Base URL for `event-service` | `http://localhost:8082` |
| `NEXT_PUBLIC_TICKET_API_URL` | Base URL for `ticket-service` | `http://localhost:8083` |
| `NEXT_PUBLIC_PAYMENT_API_URL` | Base URL for `payment-service` | `http://localhost:8084` |
| `NEXT_PUBLIC_STORAGE_API_URL` | Base URL for `storage-service` | `http://localhost:8087` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client key for Midtrans Snap sandbox | Configured from Midtrans Dashboard |

Variables prefixed with `NEXT_PUBLIC_` are exposed to the client-side browser runtime.

---

## 6. Installation and Execution

### 6.1 Install Dependencies

```bash
npm install
```

### 6.2 Development Server

Run the development server with Turbopack:

```bash
npm run dev
```

Access the application in your browser at `http://localhost:3000`.

### 6.3 Production Compilation and Startup

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## 7. Testing and Code Quality

### 7.1 Automated Unit Tests

Run unit tests via Node.js native test runner:

```bash
npm test
```

### 7.2 ESLint Static Analysis

```bash
npm run lint
```

---

## 8. Routing Architecture

### 8.1 Public Routes (`(public)`)
- `/` — Homepage featuring event catalog, category pills, and search.
- `/events` — Search and filter portal for all upcoming events.
- `/events/[id]` — Event specifications, ticket tiers, and interactive venue map.
- `/events/[id]/queue` — Ticket reservation waiting room and payment lease manager.
- `/login` — User authentication with redirect support.
- `/register` — Account registration.
- `/forgot-password` — Password reset request form.
- `/reset-password` — Token-based password reset form.
- `/my-tickets` — Customer digital pass wallet, transaction history, and invoice viewer.
- `/profile` — User profile management, password update, and account credentials.

### 8.2 Dashboard Routes (`(dashboard)`)
- `/dashboard` — Organizer metrics, 7-day sales trend chart, and recent orders.
- `/dashboard/events` — Event catalog management.
- `/dashboard/events/create` — New event submission form.
- `/dashboard/events/[id]/edit` — Event metadata update form.
- `/dashboard/events/[id]/tickets` — Ticket tier quotas and price configurations.
- `/dashboard/events/[id]/attendees` — Live attendee check-in manifest.
- `/dashboard/orders` — Complete order transaction records.
- `/dashboard/withdrawals` — Transparent revenue sharing and withdrawal requests.
- `/dashboard/admin/withdrawals` — Platform financial overview and withdrawal approvals.

---

## 9. Directory Structure

```text
entra-web/
├── public/                     # Static assets (favicons, logos, imagery)
├── src/
│   ├── app/
│   │   ├── (public)/           # Customer-facing routes (catalog, queue, tickets, auth)
│   │   ├── (dashboard)/        # Operational dashboard routes (events, attendees, finances)
│   │   ├── globals.css         # Global Tailwind directives and Snap iframe styling
│   │   ├── layout.tsx          # Root layout and theme providers
│   │   └── page.tsx            # Application homepage entrypoint
│   ├── components/
│   │   ├── features/           # Domain components (ETicketModal, TicketSelector, EventCard)
│   │   ├── layout/             # Chrome components (Navbar, Topbar, Sidebar, Footer)
│   │   └── ui/                 # Reusable atomic UI elements (Button, Card, Badge, Modal)
│   ├── lib/                    # HTTP client instances, date formatters, and utilities
│   ├── providers/              # Context providers (AuthProvider, QueryProvider)
│   └── types/                  # Global TypeScript type definitions and Window interfaces
├── next.config.ts              # Next.js build and routing configuration
├── tsconfig.json               # TypeScript compiler configuration
└── package.json                # Project dependencies and script runner commands
```
