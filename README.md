# NearCircle — Find your people, nearby.

Hyperlocal event discovery and community engagement. This is a **frontend-only prototype** built for a college
hackathon with React, Vite, TypeScript and Tailwind CSS. All data is local demo data; the UI is designed so a
Supabase/PostgreSQL backend can be connected later without rebuilding screens.

## Quick start

```bash
npm install
cp .env.example .env     # then add your Google Maps key (optional, see below)
npm run dev              # http://localhost:5173
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check only |

## Features

- **Discover**: search by title, filter by category, date, free/paid and distance, sort by soonest / nearest /
  recommended, clear all filters, live result count, featured and nearby sections, loading / empty / error states.
- **Event details**: poster, date and time, venue, distance, price, seats left, organizer, Google Map, RSVP / cancel
  RSVP with confirmation dialogs, related events.
- **My Events**: upcoming and past tabs, placeholder ticket / QR, cancel RSVP.
- **Communities**: search, category filter, follow / unfollow, community detail pages with upcoming events.
- **Organizer dashboard**: mock analytics, event list, create / edit / cancel.
- **Create / edit event**: validated form, poster upload with preview, map pin selection, free toggle, publish or save draft.
- **Poster to event (mock)**: upload → progress → pre-filled review form with flagged fields → manual confirm.
- **Login / signup**: validated forms with show/hide password and a swappable demo auth adapter.

## Google Maps setup

The app works without a key (a friendly fallback with an "Open in Google Maps" link is shown). To enable maps:

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project and enable billing.
2. Enable **Maps JavaScript API** (APIs & Services → Library).
3. Create an API key (APIs & Services → Credentials).
4. **Restrict the key**:
   - *Application restrictions* → **Websites (HTTP referrers)**. Add `http://localhost:5173/*` for development and
     your production origin(s), e.g. `https://your-site.example/*`.
   - *API restrictions* → **Restrict key** → select only **Maps JavaScript API**.
5. Put the key in `.env`:

   ```
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   ```

6. Restart `npm run dev` (Vite reads env vars at startup).

Notes: `.env` is git-ignored and `.env.example` contains only a placeholder. Because this is a browser app, the key is
visible to users — the referrer and API restrictions above are what protect it. Location permission is **never**
requested automatically. "Use my location" runs only when clicked, picks the closest listed locality, and does not
store coordinates; if permission is denied, choose a locality manually from the dropdown.

## Project structure

```
src/
  components/  layout/ events/ communities/ forms/ maps/ ui/
  pages/       one file per route
  routes/      AppRoutes.tsx
  services/    the only layer that reads/writes data (swap for real APIs)
  data/        demo events, communities, localities
  hooks/       contexts (auth, app, toast) and useAsync
  types/       TypeScript interfaces (User, Event, Community, RSVP, OrganizerAnalytics, ...)
  utils/       formatting, geo, storage, image, poster generator
```

## Connecting a backend later

UI code imports only from `src/services/index.ts`. Each function documents its REST equivalent:

`getEvents`, `getEventById`, `searchEvents`, `getOrganizerEvents`, `createEvent`, `updateEvent`, `cancelEvent`,
`createRSVP`, `cancelRSVP`, `getMyEvents`, `getCommunities`, `followCommunity`, `unfollowCommunity`,
`getOrganizerAnalytics`, `extractEventFromPoster`.

- `services/db.ts` is the localStorage "database". Replace its readers/writers (or the service bodies) with Supabase
  queries.
- `services/authAdapter.ts` defines an `AuthAdapter` interface. Implement it with `supabase.auth.*` and change the
  exported `authAdapter`.
- `services/posterExtraction.ts` is the integration point for a future OCR / vision API (see the comment at the top).
- `services/bus.ts` triggers refetches after writes; replace with React Query invalidation or realtime subscriptions.

## Known prototype limitations

- **Demo data only.** All events, communities and organizers are fictional. Event dates are generated relative to the
  first time you open the app in a browser.
- **Browser-only persistence.** RSVPs, follows, created events and interests live in `localStorage` and disappear if
  site data is cleared. Use *Reset demo data* in the footer to start over.
- **Not real authentication.** The demo sign-in stores only a name and email, never a password, and provides no
  security. Use Supabase Auth for real accounts.
- **Capacity and duplicate-RSVP checks are frontend simulations.** A real backend must enforce them atomically
  (unique constraint plus a transaction).
- **Poster extraction is a mock.** It returns fixed sample values and does not read the image.
- **Analytics and check-ins are mock numbers** and do not represent real attendance. There is no real check-in flow.
- **Tickets and QR codes are placeholders**, and paid events take no payment.
- **Single demo organizer.** All created events belong to one demo organizer identity.
- Posters are downscaled and stored as data URLs; a real app should upload images to object storage.
- Distances use straight-line (haversine) maths from the centre of the selected locality.
