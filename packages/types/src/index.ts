export type RiderId = string;

export interface RiderProfile {
  id: RiderId;
  displayName: string;
  country?: string;
}

export interface RideResult {
  id: string;
  riderId: RiderId;
  score: number;
  createdAt: string;
}

export type UnitPreference = "metric" | "imperial";

export interface UserPreferences {
  units: UnitPreference;
  timeBudgetMinutes: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string | null;
  photoUrl?: string | null;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface ZwiftAuthPayload {
  username: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ZwiftRiderProfile {
  id: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  level?: number;
  ftpWatts?: number;
  weightKg?: number;
  heightCm?: number;
  avatarUrl?: string;
}

export interface ZwiftActivity {
  id: string;
  name: string;
  distanceKm: number;
  durationSec: number;
  elevationM: number;
  startTime: string;
  worldId?: number;
  routeId?: number;
  sport?: string;
  isEvent?: boolean;
  averageSpeedKph?: number;
}

export interface ZwiftRoute {
  id: number;
  worldId: number;
  name: string;
  distanceKm: number;
  elevationM: number;
  leadInDistanceKm?: number;
  leadInElevationM?: number;
  imageUrl?: string;
  signature?: string;
  isEventOnly: boolean;
  isPublic: boolean;
  estimatedTimeMinutes: number;
}

export interface ZwiftWorldAvailabilityRequest {
  date?: string;
  timezone?: string;
}

export interface ZwiftWorldAvailability {
  date: string;
  timezone: string;
  guestWorlds: string[];
  availableWorlds: string[];
}

export type ZwiftRecommendationLength = "short" | "medium" | "long";

export interface ZwiftRecommendationImpact {
  projectedBadgeCompletionPercent: number;
  projectedHoursBurndownPercent: number;
}

export interface ZwiftRouteRecommendation {
  length: ZwiftRecommendationLength;
  route: ZwiftRoute;
  impact: ZwiftRecommendationImpact;
}

export interface ZwiftRecommendationRequest
  extends ZwiftAuthPayload,
    ZwiftWorldAvailabilityRequest {
  readinessScore: number;
}

export interface ZwiftRecommendationsResponse {
  date: string;
  timezone: string;
  guestWorlds: string[];
  availableWorlds: string[];
  readinessScore: number;
  recommendations: ZwiftRouteRecommendation[];
}

export interface ZwiftRouteBadge {
  routeId: number;
  activityId: string;
  completedAt: string;
}

export interface ZwiftSyncResult {
  profile: ZwiftRiderProfile;
  activities: ZwiftActivity[];
  routes: ZwiftRoute[];
  badges: ZwiftRouteBadge[];
  missingRoutes: number[];
}

export interface GarminAuthStartPayload {
  redirectUri: string;
  state?: string;
}

export interface GarminAuthExchangePayload {
  code: string;
  redirectUri: string;
}

export interface GarminRefreshPayload {
  refreshToken: string;
}

export interface GarminMetricsRequest {
  accessToken: string;
  userId: string;
  date?: string;
}

export interface GarminAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType?: string;
  scope?: string;
  issuedAt: string;
}

export type GarminHrvStatus = "low" | "balanced" | "high" | "unknown";

export interface GarminMetrics {
  capturedAt: string;
  bodyBattery?: number | null;
  sleepScore?: number | null;
  hrvStatus?: GarminHrvStatus;
  trainingLoad?: number | null;
  recoveryTimeHours?: number | null;
}

export interface GarminReadinessSnapshot {
  id?: string;
  userId: string;
  capturedAt: string;
  metrics: GarminMetrics;
  readinessScore: number;
  createdAt: string;
  source: "garmin";
}
