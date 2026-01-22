import { onRequest } from "firebase-functions/v2/https";
import type {
  GarminAuthExchangePayload,
  GarminAuthStartPayload,
  GarminRefreshPayload,
  ZwiftAuthPayload,
  ZwiftRecommendationRequest,
  ZwiftWorldAvailabilityRequest
} from "@lupin/types";
import { fetchZwiftRoutes, syncZwiftData } from "./zwift/sync";
import { buildGarminAuthUrl, exchangeGarminToken, refreshGarminToken } from "./garmin/client";
import { parseGarminMetricsRequest, syncGarminReadiness } from "./garmin/sync";
import { buildZwiftRecommendations } from "./zwift/recommendations";
import { fetchZwiftWorldAvailability, resolveWorldIds } from "./zwift/worlds";

export const health = onRequest((req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const parseAuthPayload = (payload: unknown): ZwiftAuthPayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing Zwift credentials payload.");
  }
  const record = payload as Record<string, unknown>;
  const username = record.username;
  const password = record.password;
  if (typeof username !== "string" || typeof password !== "string") {
    throw new Error("Zwift username and password are required.");
  }
  return {
    username,
    password,
    accessToken: typeof record.accessToken === "string" ? record.accessToken : undefined,
    refreshToken: typeof record.refreshToken === "string" ? record.refreshToken : undefined
  };
};

const readJsonBody = (body: unknown): unknown => {
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  return body;
};

const parseGarminAuthStartPayload = (payload: unknown): GarminAuthStartPayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing Garmin auth payload.");
  }
  const record = payload as Record<string, unknown>;
  const redirectUri = record.redirectUri;
  if (typeof redirectUri !== "string") {
    throw new Error("Garmin redirectUri is required.");
  }
  return {
    redirectUri,
    state: typeof record.state === "string" ? record.state : undefined
  };
};

const parseGarminExchangePayload = (
  payload: unknown
): GarminAuthExchangePayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing Garmin exchange payload.");
  }
  const record = payload as Record<string, unknown>;
  const code = record.code;
  const redirectUri = record.redirectUri;
  if (typeof code !== "string" || typeof redirectUri !== "string") {
    throw new Error("Garmin code and redirectUri are required.");
  }
  return { code, redirectUri };
};

const parseGarminRefreshPayload = (payload: unknown): GarminRefreshPayload => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing Garmin refresh payload.");
  }
  const record = payload as Record<string, unknown>;
  const refreshToken = record.refreshToken;
  if (typeof refreshToken !== "string") {
    throw new Error("Garmin refreshToken is required.");
  }
  return { refreshToken };
};

const parseWorldAvailabilityPayload = (
  payload: unknown
): ZwiftWorldAvailabilityRequest => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing world availability payload.");
  }
  const record = payload as Record<string, unknown>;
  return {
    date: typeof record.date === "string" ? record.date : undefined,
    timezone: typeof record.timezone === "string" ? record.timezone : undefined
  };
};

const parseZwiftRecommendationPayload = (payload: unknown): ZwiftRecommendationRequest => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing recommendation payload.");
  }
  const record = payload as Record<string, unknown>;
  const readinessScore =
    typeof record.readinessScore === "number"
      ? record.readinessScore
      : Number(record.readinessScore);
  if (!Number.isFinite(readinessScore)) {
    throw new Error("readinessScore is required.");
  }
  const auth = parseAuthPayload(payload);
  return {
    ...auth,
    readinessScore,
    date: typeof record.date === "string" ? record.date : undefined,
    timezone: typeof record.timezone === "string" ? record.timezone : undefined
  };
};

export const zwiftSync = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Zwift sync." });
    return;
  }

  try {
    const payload = parseAuthPayload(readJsonBody(req.body));
    const data = await syncZwiftData(payload);
    res.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zwift sync failed.";
    res.status(400).json({ error: message });
  }
});

export const zwiftRoutes = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Zwift routes." });
    return;
  }

  try {
    const payload = parseAuthPayload(readJsonBody(req.body));
    const routes = await fetchZwiftRoutes(payload);
    res.json({ routes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zwift routes failed.";
    res.status(400).json({ error: message });
  }
});

export const zwiftWorldAvailability = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for world availability." });
    return;
  }

  try {
    const payload = parseWorldAvailabilityPayload(readJsonBody(req.body));
    const availability = await fetchZwiftWorldAvailability(payload);
    res.json(availability);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch world availability.";
    res.status(400).json({ error: message });
  }
});

export const zwiftRecommendations = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Zwift recommendations." });
    return;
  }

  try {
    const payload = parseZwiftRecommendationPayload(readJsonBody(req.body));
    const availability = await fetchZwiftWorldAvailability(payload);
    const data = await syncZwiftData(payload);
    const availableWorldIds = resolveWorldIds(availability.availableWorlds);
    const recommendations = buildZwiftRecommendations({
      readinessScore: payload.readinessScore,
      routes: data.routes,
      badges: data.badges,
      availableWorldIds
    });

    res.json({
      date: availability.date,
      timezone: availability.timezone,
      guestWorlds: availability.guestWorlds,
      availableWorlds: availability.availableWorlds,
      readinessScore: payload.readinessScore,
      recommendations
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Zwift recommendations failed.";
    res.status(400).json({ error: message });
  }
});

export const garminAuthStart = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Garmin auth start." });
    return;
  }

  try {
    const payload = parseGarminAuthStartPayload(readJsonBody(req.body));
    const result = buildGarminAuthUrl(payload);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Garmin auth start failed.";
    res.status(400).json({ error: message });
  }
});

export const garminAuthExchange = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Garmin auth exchange." });
    return;
  }

  try {
    const payload = parseGarminExchangePayload(readJsonBody(req.body));
    const tokens = await exchangeGarminToken(payload);
    res.json(tokens);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Garmin auth exchange failed.";
    res.status(400).json({ error: message });
  }
});

export const garminAuthRefresh = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Garmin auth refresh." });
    return;
  }

  try {
    const payload = parseGarminRefreshPayload(readJsonBody(req.body));
    const tokens = await refreshGarminToken(payload);
    res.json(tokens);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Garmin auth refresh failed.";
    res.status(400).json({ error: message });
  }
});

export const garminReadinessSync = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST for Garmin readiness sync." });
    return;
  }

  try {
    const payload = parseGarminMetricsRequest(readJsonBody(req.body));
    const snapshot = await syncGarminReadiness(payload);
    res.json(snapshot);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Garmin readiness sync failed.";
    res.status(400).json({ error: message });
  }
});
