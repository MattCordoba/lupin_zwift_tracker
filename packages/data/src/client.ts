import { apiBaseUrl } from "@lupin/config";
import type {
  GarminAuthExchangePayload,
  GarminAuthStartPayload,
  GarminAuthTokens,
  GarminMetricsRequest,
  GarminReadinessSnapshot,
  GarminRefreshPayload,
  RideResult,
  RiderProfile,
  ZwiftAuthPayload,
  ZwiftRecommendationRequest,
  ZwiftRecommendationsResponse,
  ZwiftRoute,
  ZwiftSyncResult,
  ZwiftWorldAvailability,
  ZwiftWorldAvailabilityRequest
} from "@lupin/types";

export async function fetchRiderProfile(id: string): Promise<RiderProfile> {
  const response = await fetch(`${apiBaseUrl}/riders/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch rider profile");
  }
  return response.json() as Promise<RiderProfile>;
}

export async function fetchRecentResults(): Promise<RideResult[]> {
  const response = await fetch(`${apiBaseUrl}/results`);
  if (!response.ok) {
    throw new Error("Failed to fetch results");
  }
  return response.json() as Promise<RideResult[]>;
}

export async function fetchZwiftSync(
  payload: ZwiftAuthPayload
): Promise<ZwiftSyncResult> {
  const response = await fetch(`${apiBaseUrl}/zwiftSync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to sync Zwift data");
  }
  return response.json() as Promise<ZwiftSyncResult>;
}

export async function fetchZwiftRoutes(
  payload: ZwiftAuthPayload
): Promise<ZwiftRoute[]> {
  const response = await fetch(`${apiBaseUrl}/zwiftRoutes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Zwift routes");
  }
  const data = (await response.json()) as { routes: ZwiftRoute[] };
  return data.routes;
}

export async function fetchZwiftWorldAvailability(
  payload: ZwiftWorldAvailabilityRequest
): Promise<ZwiftWorldAvailability> {
  const response = await fetch(`${apiBaseUrl}/zwiftWorldAvailability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Zwift world availability");
  }
  return response.json() as Promise<ZwiftWorldAvailability>;
}

export async function fetchZwiftRecommendations(
  payload: ZwiftRecommendationRequest
): Promise<ZwiftRecommendationsResponse> {
  const response = await fetch(`${apiBaseUrl}/zwiftRecommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to fetch Zwift recommendations");
  }
  return response.json() as Promise<ZwiftRecommendationsResponse>;
}

export async function fetchGarminAuthStart(
  payload: GarminAuthStartPayload
): Promise<{ url: string; state?: string }> {
  const response = await fetch(`${apiBaseUrl}/garminAuthStart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to start Garmin auth");
  }
  return response.json() as Promise<{ url: string; state?: string }>;
}

export async function fetchGarminAuthExchange(
  payload: GarminAuthExchangePayload
): Promise<GarminAuthTokens> {
  const response = await fetch(`${apiBaseUrl}/garminAuthExchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to exchange Garmin token");
  }
  return response.json() as Promise<GarminAuthTokens>;
}

export async function fetchGarminRefresh(
  payload: GarminRefreshPayload
): Promise<GarminAuthTokens> {
  const response = await fetch(`${apiBaseUrl}/garminAuthRefresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to refresh Garmin token");
  }
  return response.json() as Promise<GarminAuthTokens>;
}

export async function fetchGarminReadiness(
  payload: GarminMetricsRequest
): Promise<GarminReadinessSnapshot> {
  const response = await fetch(`${apiBaseUrl}/garminReadinessSync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error("Failed to sync Garmin readiness");
  }
  return response.json() as Promise<GarminReadinessSnapshot>;
}
