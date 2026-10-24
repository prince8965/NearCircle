# Changelog

All notable changes to the NearCircle project are documented in this file.

---

## [Unreleased] - Phase 5: Organization Profiles and Organizer Event Management (2026-10-24)

### Added
- `src/components/organization/EditOrganizationModal.tsx`:
  - Modal allowing organization owners to edit organization name, description, category, locality, website URL, public contact email, accent color, and logo.
  - Built-in anti-tamper indicator explaining that verification status is granted solely by platform administrators.
- `docs/organizer-event-management.md`: Comprehensive technical and security documentation for Phase 5.
- Support for hackathon and event fields:
  - `mode`: in-person, online, or hybrid.
  - `minTeamSize` and `maxTeamSize`: team capacity constraints with integrity validation.
  - `registrationDeadline` and `submissionDeadline`: deadline constraints.
  - `rules`: rules and code of conduct.
  - `prizesSummary`: prize pool breakdown.
  - `tracks`: domain/theme tracks.
- Public event history:
  - Added "Public Event History" tab in `OrganizationProfileModal.tsx` listing concluded and completed events.
  - Owner-aware header providing an "Edit Profile" action for authorized owners.

### Modified
- `src/types/index.ts`:
  - Extended `EventStatus` to include `'completed'`.
  - Added hackathon and organization fields to `Event`, `Organization`, and `OrganizerAnalytics`.
- `src/components/forms/eventFormModel.ts`:
  - Extended `EventFormValues` with mode, team sizes, deadlines, rules, prizes, and tracks.
  - Enhanced `validateEventForm` with team size checks and deadline ordering checks.
- `src/components/forms/CreateEventForm.tsx`:
  - Added Mode selector (In-Person / Online / Hybrid), Hackathon Configuration section (team limits, deadlines, tracks, prizes, rules).
- `src/services/eventService.ts`:
  - Wired real Supabase CRUD operations (`createEvent`, `updateEvent`, `cancelEvent`, `deleteDraftEvent`, `getOrganizerEvents`, `searchEvents`, `getEventById`).
  - Added authorization check: anonymous visitors and participants cannot create, edit, or publish events.
  - Added draft visibility protection: drafts are excluded from discovery and accessible only to owners and admins.
- `src/services/communityPostService.ts`:
  - Implemented `getOrganizationByOwnerId`, `createOrganization`, and `updateOrganization`.
  - Enforced ownership verification and prohibited self-modification of `is_verified`.
- `src/services/analyticsService.ts`:
  - Connected `getOrganizerAnalytics()` to real database events and records, computing live published, draft, completed, and registration numbers.
- `src/pages/OrganizerDashboardPage.tsx`:
  - Added Organization Profile header card with verification badge, category, follower count, and Edit/View actions.
  - Added filter sub-tabs (All, Published, Drafts, Completed, Cancelled).
  - Added draft quick-publish and delete modals.
- `src/pages/EventDetailsPage.tsx`:
  - Added rendering for event mode, team sizes, deadlines, prizes summary, rules, and tracks.
- `src/pages/CreateEventPage.tsx` and `src/pages/EditEventPage.tsx`:
  - Updated notes to reflect active database persistence.

---

## [Phase 4] - Supabase Authentication & Role-Based Access Control (2026-10-24)

### Added
- `src/pages/UnauthorizedPage.tsx`: Access denied screen.
- `src/routes/ProtectedRoute.tsx`: Authentication session guard.
- `src/routes/RoleGuard.tsx`: Role verification guard for routes.
- `docs/authentication-implementation.md`: Walkthrough of authentication and RBAC.

### Modified
- `src/services/authAdapter.ts`: Full Supabase Auth integration, session management, and role synchronization with `public.profiles`.
- `src/hooks/AuthContext.tsx`: Role flags (`isOrganizer`, `isParticipant`, `isJudge`, `isAdmin`).
- `src/pages/AuthPage.tsx`: Account-type selector (Participant vs Organizer) with organization name onboarding and password recovery.
- `src/routes/AppRoutes.tsx`: Protected organizer and participant routes.
- `src/components/layout/Navbar.tsx`: Role-aware dynamic navigation.

---

## [Phase 3] - NearCircle Core Database Schema (2026-10-24)

### Added
- `supabase/migrations/20261025_nearcircle_core_schema.sql`: Core schema migration for profiles, organizations, events, tracks, prizes, teams, submissions, judging, notifications, and audit logs.
- `docs/database-design.md`: Architecture diagrams and RLS documentation.
