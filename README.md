# lupin_zwift_tracker

Monorepo for Lupin Zwift Tracker.

## Structure
- apps/mobile: Expo iOS/Android app
- apps/web: Expo Web app (expo-router)
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
- EAS (mobile): set `EXPO_PUBLIC_API_BASE_URL` in EAS secrets or environment variables for your build profile.

## CI/CD
- PRs run lint, test (typecheck), and build via GitHub Actions.
- `main` deploys `apps/web` to Vercel.

Required GitHub secrets for Vercel deploy:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Mobile release process
1. Install EAS CLI and login: `npm i -g eas-cli` then `eas login`.
2. Configure the project once: `eas build:configure`.
3. Set `EXPO_PUBLIC_API_BASE_URL` in EAS for the desired profile.
4. Build: `eas build --platform ios` or `eas build --platform android`.
5. Submit: `eas submit --platform ios` or `eas submit --platform android`.
