# Entra Web Application Specification and Architecture Document

The official web application frontend for the Entra White-Label Event Ticketing Platform, built using Next.js (App Router), React, TypeScript, and TailwindCSS.

---

## Overview

Entra Web provides a modern interface for both public event attendees and event organizers. Public users can browse events, select ticket tiers, manage user profiles, and view purchased tickets. Organizers can access a dedicated dashboard for managing events, ticket inventory, media assets, and sales analytics.

---

## Technology Stack

| Component | Technology | Version / Specification |
|---|---|---|
| Core Framework | Next.js (App Router) | 16.2+ |
| User Interface Library | React | 19.2+ |
| Language | TypeScript | 5.0+ |
| Styling & Utility | TailwindCSS | 4.0+ / PostCSS |
| Server State Management | TanStack React Query | 5.101+ |
| Iconography | Lucide React | 1.27+ |
| Notifications / Toasts | Sonner | 2.0+ |
| Date Formatting | date-fns | 4.4+ |
| QR Code Rendering | qrcode.react | 4.2+ |

---

## Directory Structure

```
entra-web/
├── public/                 # Static assets and public images
├── src/
│   ├── app/                # Next.js App Router route handlers & pages
│   │   ├── (dashboard)/    # Authenticated organizer portal routes
│   │   │   ├── dashboard/  # Analytics, event management, media, orders
│   │   │   └── layout.tsx  # Dashboard layout with sidebar navigation
│   │   ├── (public)/       # Public routes (Landing, Event Details, Auth)
│   │   │   ├── events/     # Event catalog & detail view ([id])
│   │   │   ├── login/      # User authentication login
│   │   │   ├── register/   # Account registration
│   │   │   ├── profile/    # User profile management
│   │   │   └── page.tsx    # Home landing page
│   │   ├── globals.css     # Global styles and TailwindCSS imports
│   │   └── layout.tsx      # Root application layout & global providers
│   ├── components/         # Reusable UI & Feature components
│   │   ├── features/       # Feature-specific components (Events, Tickets)
│   │   ├── layout/         # Header, Footer, Sidebar, Navigation
│   │   └── ui/             # Atomic design elements (Buttons, Inputs, Cards)
│   ├── lib/                # Infrastructure utilities & API clients
│   │   ├── api.ts          # Microservice API client instances & fetcher
│   │   └── utils.ts        # Helper functions (CN utility, formatting)
│   ├── providers/          # React Context & State Providers (Auth, Query, Theme)
│   └── types/              # TypeScript interface & type definitions
├── .env.local              # Local environment configuration
├── next.config.ts          # Next.js framework configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and script declarations
```

---

## Environment Variables Configuration

Copy `.env.local` or define the following environment variables to connect the web frontend to the microservices backend cluster:

```ini
# Backend Service Endpoints
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8081
NEXT_PUBLIC_EVENT_API_URL=http://localhost:8082
NEXT_PUBLIC_TICKET_API_URL=http://localhost:8083
NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:8084
NEXT_PUBLIC_CASHLESS_API_URL=http://localhost:8085
NEXT_PUBLIC_GATE_API_URL=http://localhost:8086
NEXT_PUBLIC_STORAGE_API_URL=http://localhost:8087
```

---

## Installation and Execution Guide

### Prerequisites

Ensure the Node.js runtime environment is installed:
- Node.js version 20.0 or higher
- npm (version 10+), pnpm, or yarn

### Setup Procedure

1. **Clone the repository**:
   ```bash
   git clone https://github.com/wibisanabama/entra-web.git
   cd entra-web
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment settings**:
   ```bash
   cp .env.local .env.production
   ```

### Development Server

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a web browser to view the application.

### Production Build & Launch

To create an optimized production build and start the server:

```bash
# Build the application
npm run build

# Start the production server
npm run start
```

---

## Route Specifications and Feature Overview

### Public Portal Routes (`(public)`)

| Route | Access | Description |
|---|---|---|
| `/` | Public | Main landing page featuring hero banners, search bar, category filters, and featured events. |
| `/events` | Public | Full event directory list with search and filter controls. |
| `/events/[id]` | Public | Event detail page displaying venue address, dates, ticket categories, and checkout trigger. |
| `/login` | Public | User authentication login page. |
| `/register` | Public | Account registration page for attendees and organizers. |
| `/forgot-password` | Public | Password recovery request page. |
| `/reset-password` | Public | Password reset execution page via email verification token. |
| `/profile` | Protected | User account details, role status, and profile image management. |

### Organizer Dashboard Routes (`(dashboard)`)

| Route | Access | Description |
|---|---|---|
| `/dashboard` | Organizer | High-level metrics dashboard (Total Orders, Total Revenue, Tickets Sold, Recent Activity). |
| `/dashboard/events` | Organizer | Interface for creating, editing, publishing, and deleting organizer events. |
| `/dashboard/media` | Organizer | Media library manager for uploading event banners and images to MinIO storage. |
| `/dashboard/orders` | Organizer | Transaction ledger, order search, and attendee check-in monitoring. |

---

## Microservices API Integration Architecture

The web application communicates directly with 7 decoupled Go microservices using dedicated client instances defined in `src/lib/api.ts`:

- **Auth Service Client (`authApi` - `:8081`)**: Handles user login, registration, token refresh, and profile management.
- **Event Service Client (`eventApi` - `:8082`)**: Fetches event catalogs, details, categories, venues, and handles organizer event creation.
- **Ticket Service Client (`ticketApi` - `:8083`)**: Manages ticket orders, checkout token generation, and attendee lists.
- **Payment Service Client (`paymentApi` - `:8084`)**: Handles payment gateway simulation and reference lookups.
- **Cashless Service Client (`cashlessApi` - `:8085`)**: Fetches wristband balance and cashless transaction history.
- **Gate Service Client (`gateApi` - `:8086`)**: Interface for event entry check-in status.
- **Storage Service Client (`storageApi` - `:8087`)**: Handles image uploads to MinIO Object Storage.

---

## Security and Authentication Mechanisms

- **JWT Session Persistence**: Client authentication tokens (`entra_token`) are stored securely in browser cookies.
- **Automatic Header Injection**: Every HTTP request originating from `src/lib/api.ts` automatically attaches the `Authorization: Bearer <token>` header when a token cookie is present.
- **Client Route Protection**: Unauthenticated requests attempting to access `/dashboard/*` or `/profile` are redirected to `/login`.

---

## Code Quality and Linting

To inspect code quality and enforce ESLint rules:

```bash
npm run lint
```

---

## License

Proprietary Software. All rights reserved. Unauthorized copying, distribution, or modification of this software is strictly prohibited.
