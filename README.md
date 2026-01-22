# lupin_zwift_tracker

Monorepo for Lupin Zwift Tracker.

## Structure
- apps/mobile: React Native (bare) iOS/Android app
- apps/web: Next.js web app (react-native-web)
- packages/ui: Shared UI components
- packages/core: Domain models and scoring
- packages/config: Env + constants
- packages/types: Shared types
- packages/data: Query layer + API adapters
- functions: Firebase Functions (optional)

## Getting started
Install dependencies with pnpm, then run:
- `pnpm dev`
- `pnpm lint`
- `pnpm typecheck`

Copy `.env.example` to `.env.development` or `.env.production` as needed.

## Environment variables
The shared config reads from `packages/config/src/env.ts`.
- Local (web + mobile): create `.env.development` or `.env.production` with `EXPO_PUBLIC_API_BASE_URL`.
- Vercel (web): set `EXPO_PUBLIC_API_BASE_URL` in the Vercel project environment variables.

## CI/CD
- PRs run lint, test (typecheck), and build via GitHub Actions.
- `main` deploys `apps/web` to Vercel.

Required GitHub secrets for Vercel deploy:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Mobile build process
1. Install CocoaPods (iOS): `bundle install` then `bundle exec pod install` inside `apps/mobile/ios`.
2. iOS: `pnpm --filter lupin-mobile ios`
3. Android: `pnpm --filter lupin-mobile android`
