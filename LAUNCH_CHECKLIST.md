# Launch Checklist

## QA
- [ ] Run end-to-end smoke tests for auth + sync.
  - [ ] Web: sign in (Google/Apple), confirm user profile document is created/loaded.
  - [ ] Zwift sync: call `zwiftSync` and `zwiftRoutes`, verify profile/routes/badges payloads.
  - [ ] Garmin sync: run OAuth start/exchange, then `garminReadinessSync` to confirm readiness snapshot writes.
- [ ] Validate route completion logic in `functions/src/zwift/badges.ts`.
  - [ ] Activity with no `routeId` is ignored.
  - [ ] Only first activity per route produces a badge.
  - [ ] Unknown route IDs land in `missingRoutes`.
- [ ] Verify recommendations only include available worlds.
  - [ ] `functions/src/zwift/recommendations.ts` filters by `availableWorldIds`.
  - [ ] `functions/src/zwift/worlds.ts` mappings cover schedule names used in availability responses.

## Docs
- [ ] Setup instructions (expand `README.md`).
  - [ ] Local `.env.development` / `.env.production` with `EXPO_PUBLIC_API_BASE_URL`.
  - [ ] Firebase setup requirements for web/mobile auth.
  - [ ] Functions env vars for Zwift/Garmin integrations.
- [ ] Troubleshooting for Zwift/Garmin auth.
  - [ ] Zwift client errors (bad credentials, MFA/consent, rate limits).
  - [ ] Garmin OAuth errors (invalid redirect URI, missing client/secret, token URL errors).
  - [ ] Common HTTP error responses from `functions/src/index.ts` endpoints.
- [ ] Data/privacy notes.
  - [ ] What data is stored (user profile, readiness snapshots).
  - [ ] What data is fetched and transient (Zwift routes/activities, Garmin metrics).
  - [ ] Retention and deletion guidance.
