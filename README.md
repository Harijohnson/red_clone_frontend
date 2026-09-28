# Frontend

React 19 SPA for the red_colne bus booking platform.

## Tech Stack

- **Framework**: React 19
- **Language**: TypeScript ~6 (strict)
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4 (Vite plugin — no `tailwind.config.js`)
- **Components**: shadcn/ui (registry-based)
- **HTTP client**: Axios (with interceptors for auth + error formatting)
- **Routing**: React Router DOM v7
- **Icons**: Lucide React

## Setup

```bash
cd frontend
cp .env.example .env.local   # or create it manually
npm install
npm run dev                   # http://localhost:5173
```

### Environment Variables

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:5000
```

For production, set `VITE_API_URL` to the deployed backend URL.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production bundle to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (all `.ts` and `.tsx`) |
| `npm run preview` | Serve `dist/` locally |

## Source Layout

```
src/
├── main.tsx               Entry: wraps App in ThemeProvider + AuthProvider
├── App.tsx                Router setup; all route definitions
├── index.css              Tailwind directives + global CSS variables
│
├── pages/
│   ├── Home.tsx           Trip search form (landing page)
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── SearchResults.tsx  Trip cards from search query
│   ├── TripSeats.tsx      Interactive seat picker
│   ├── PassengerDetails.tsx  Passenger info form (one per seat)
│   ├── PaymentPlaceholder.tsx  Payment stub
│   ├── BookingConfirmation.tsx  Final booking summary
│   ├── MyBookings.tsx     User's booking history
│   └── admin/
│       ├── AdminLayout.tsx    Admin shell with sidebar nav
│       ├── AdminDashboard.tsx Stats overview
│       ├── AdminTrips.tsx     CRUD trips
│       ├── AdminBuses.tsx     CRUD buses
│       ├── AdminRoutes.tsx    CRUD routes
│       └── AdminBookings.tsx  List and cancel bookings
│
├── components/
│   ├── layout/
│   │   └── Navbar.tsx      Top navigation bar
│   ├── trips/
│   │   └── TripCard.tsx    Trip summary card used in SearchResults
│   ├── seats/
│   │   └── SeatGrid.tsx    Visual seat layout grid
│   ├── ProtectedRoute.tsx  Redirects unauthenticated users to /login
│   ├── AdminRoute.tsx      Redirects non-admin/operator users to /
│   ├── theme-provider.tsx  ThemeProvider context + useTheme hook
│   └── ui/                 shadcn/ui primitives (auto-generated)
│
├── context/
│   └── AuthContext.tsx     Global auth state; useAuth() hook
│
├── services/
│   ├── api.ts             Axios instance (baseURL, JWT interceptor, error shaping)
│   ├── auth.ts            register / login / fetchMe
│   ├── trips.ts           searchTrips / getCities
│   ├── seats.ts           fetchTripSeats / lockSeats / releaseLock / confirmBooking
│   ├── bookings.ts        createBooking / fetchMyBookings / fetchBookingById
│   └── admin.ts           All admin CRUD + dashboard
│
├── hooks/
│   └── useLockCountdown.ts  Countdown timer for seat lock expiry
│
└── types/
    ├── index.ts           SearchParams, TripSearchResult, etc.
    ├── auth.ts            AuthUser, LoginInput, RegisterInput
    ├── api.ts             ApiError
    ├── booking.ts         BookingDetail, BookingListItem
    ├── seats.ts           SeatEntry, TripSeatsResponse, LockSeatsRequest
    ├── admin.ts           AdminTripItem, AdminBusItem, AdminRouteItem, etc.
    ├── passenger.ts       PassengerForm, ValidatedPassenger
    └── bus.ts             BusType, SeatType enums
```

## Routing

All routes are defined in `App.tsx`:

| Path | Component | Access |
|---|---|---|
| `/` | `Home` | Public |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/search` | `SearchResults` | Public |
| `/trips/:tripId/seats` | `TripSeats` | Auth required |
| `/trips/:tripId/passenger-details` | `PassengerDetails` | Auth required |
| `/trips/:tripId/payment` | `PaymentPlaceholder` | Auth required |
| `/booking/:bookingId` | `BookingConfirmation` | Auth required |
| `/my-bookings` | `MyBookings` | Auth required |
| `/admin` | `AdminDashboard` | Admin / Operator |
| `/admin/trips` | `AdminTrips` | Admin / Operator |
| `/admin/buses` | `AdminBuses` | Admin / Operator |
| `/admin/routes` | `AdminRoutes` | Admin / Operator |
| `/admin/bookings` | `AdminBookings` | Admin / Operator |

## Auth

Authentication state lives in `AuthContext`. On mount it calls `/api/auth/me` using the JWT stored in `localStorage` under key `rc_token`. The context exposes:

```ts
const { user, loading, login, logout } = useAuth()
```

- `loading` is `true` during the initial `/me` fetch — render a spinner until it resolves.
- `ProtectedRoute` and `AdminRoute` guard protected paths automatically.
- `services/api.ts` attaches `Authorization: Bearer <token>` to every request via a request interceptor.

## State Management

There is no global state library. State is managed at the component level with React's built-in hooks, with two exceptions:

- `AuthContext` — user identity and auth actions
- `ThemeProvider` — dark/light/system preference

## Styling

Tailwind CSS v4 is configured via the Vite plugin — there is no `tailwind.config.js`. CSS variables for theme colors are defined in `index.css` and toggled by `ThemeProvider` via a class on `<html>`.

```ts
const { theme, setTheme } = useTheme()
setTheme('dark')  // 'light' | 'dark' | 'system'
```

Press `d` in the browser to cycle through themes.

## Adding shadcn Components

```bash
npx shadcn add <component-name>
# e.g. npx shadcn add dialog
```

Components are generated in `src/components/ui/`. Do not hand-edit them — re-run `add` to update.

## Path Alias

`@/` maps to `src/`. Use it for all internal imports:

```ts
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
```

Configured in `vite.config.ts` and `tsconfig.app.json`.

## Conventions

- `.tsx` for components, `.ts` for everything else
- No `any` — use `unknown` and narrow, or define proper types
- Prefer `type` over `interface` unless declaration merging is needed
- Named exports everywhere; `default export` only for page-level components
- Use Tailwind utility classes; avoid inline `style={}`
- Co-locate hooks with the component that owns them if they are single-use
