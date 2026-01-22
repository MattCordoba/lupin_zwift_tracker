import type {
  GarminAuthExchangePayload,
  GarminAuthTokens,
  GarminAuthStartPayload,
  GarminHrvStatus,
  GarminMetrics,
  GarminRefreshPayload
} from "@lupin/types";
import { randomUUID } from "crypto";

const requiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
};

const optionalEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return value || undefined;
};

const toBasicAuth = (clientId: string, clientSecret: string) => {
  const token = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  return `Basic ${token}`;
};

const getOAuthConfig = () => {
  return {
    authorizeUrl: requiredEnv("GARMIN_OAUTH_AUTHORIZE_URL"),
    tokenUrl: requiredEnv("GARMIN_OAUTH_TOKEN_URL"),
    clientId: requiredEnv("GARMIN_CLIENT_ID"),
    clientSecret: requiredEnv("GARMIN_CLIENT_SECRET"),
    scope: optionalEnv("GARMIN_OAUTH_SCOPE")
  };
};

const appendQuery = (url: string, params: Record<string, string | undefined>) => {
  const target = new URL(url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      target.searchParams.set(key, value);
    }
  });
  return target.toString();
};

export const buildGarminAuthUrl = (payload: GarminAuthStartPayload) => {
  const { authorizeUrl, clientId, scope } = getOAuthConfig();
  const state = payload.state ?? randomUUID();
  const url = appendQuery(authorizeUrl, {
    response_type: "code",
    client_id: clientId,
    redirect_uri: payload.redirectUri,
    scope,
    state
  });
  return { url, state };
};

const tokenRequest = async (
  body: URLSearchParams,
  clientId: string,
  clientSecret: string,
  tokenUrl: string
): Promise<GarminAuthTokens> => {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: toBasicAuth(clientId, clientSecret)
    },
    body
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Garmin token request failed: ${text || response.status}`);
  }
  const data = (await response.json()) as Record<string, unknown>;
  return {
    accessToken: String(data.access_token ?? ""),
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expiresIn: Number(data.expires_in ?? 0),
    tokenType: typeof data.token_type === "string" ? data.token_type : undefined,
    scope: typeof data.scope === "string" ? data.scope : undefined,
    issuedAt: new Date().toISOString()
  };
};

export const exchangeGarminToken = async (
  payload: GarminAuthExchangePayload
): Promise<GarminAuthTokens> => {
  const { tokenUrl, clientId, clientSecret } = getOAuthConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: payload.code,
    redirect_uri: payload.redirectUri
  });
  return tokenRequest(body, clientId, clientSecret, tokenUrl);
};

export const refreshGarminToken = async (
  payload: GarminRefreshPayload
): Promise<GarminAuthTokens> => {
  const { tokenUrl, clientId, clientSecret } = getOAuthConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: payload.refreshToken
  });
  return tokenRequest(body, clientId, clientSecret, tokenUrl);
};

const getMetricConfig = () => ({
  baseUrl: requiredEnv("GARMIN_API_BASE_URL"),
  bodyBatteryPath: optionalEnv("GARMIN_BODY_BATTERY_PATH"),
  sleepScorePath: optionalEnv("GARMIN_SLEEP_SCORE_PATH"),
  hrvStatusPath: optionalEnv("GARMIN_HRV_STATUS_PATH"),
  trainingLoadPath: optionalEnv("GARMIN_TRAINING_LOAD_PATH"),
  recoveryTimePath: optionalEnv("GARMIN_RECOVERY_TIME_PATH"),
  bodyBatteryField: optionalEnv("GARMIN_BODY_BATTERY_VALUE_FIELD"),
  sleepScoreField: optionalEnv("GARMIN_SLEEP_SCORE_VALUE_FIELD"),
  hrvStatusField: optionalEnv("GARMIN_HRV_STATUS_VALUE_FIELD"),
  trainingLoadField: optionalEnv("GARMIN_TRAINING_LOAD_VALUE_FIELD"),
  recoveryTimeField: optionalEnv("GARMIN_RECOVERY_TIME_VALUE_FIELD")
});

const resolveUrl = (baseUrl: string, path?: string, date?: string) => {
  if (!path) {
    return undefined;
  }
  const url = path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  return appendQuery(url, { date });
};

const readDotPath = (data: unknown, path?: string): unknown => {
  if (!path) {
    return undefined;
  }
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[key];
  }, data);
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseHrvStatus = (value: unknown): GarminHrvStatus | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (normalized.includes("low")) return "low";
  if (normalized.includes("balanced")) return "balanced";
  if (normalized.includes("high")) return "high";
  return "unknown";
};

const extractNumber = (data: unknown, field?: string): number | null => {
  const direct = parseNumber(readDotPath(data, field));
  if (direct !== null) {
    return direct;
  }
  if (typeof data === "number") {
    return data;
  }
  if (typeof data === "object" && data) {
    const record = data as Record<string, unknown>;
    return (
      parseNumber(record.value) ??
      parseNumber(record.score) ??
      parseNumber(record.amount) ??
      null
    );
  }
  return null;
};

const extractStatus = (data: unknown, field?: string): GarminHrvStatus | undefined => {
  const direct = parseHrvStatus(readDotPath(data, field));
  if (direct) {
    return direct;
  }
  if (typeof data === "object" && data) {
    const record = data as Record<string, unknown>;
    return (
      parseHrvStatus(record.status) ??
      parseHrvStatus(record.state) ??
      parseHrvStatus(record.value)
    );
  }
  return undefined;
};

const fetchMetric = async (
  url: string | undefined,
  accessToken: string
): Promise<unknown> => {
  if (!url) {
    return undefined;
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Garmin metric request failed: ${text || response.status}`);
  }
  return response.json() as Promise<unknown>;
};

export const fetchGarminMetrics = async (
  accessToken: string,
  date?: string
): Promise<GarminMetrics> => {
  const config = getMetricConfig();
  const [bodyBatteryData, sleepScoreData, hrvStatusData, trainingLoadData, recoveryTimeData] =
    await Promise.all([
      fetchMetric(resolveUrl(config.baseUrl, config.bodyBatteryPath, date), accessToken),
      fetchMetric(resolveUrl(config.baseUrl, config.sleepScorePath, date), accessToken),
      fetchMetric(resolveUrl(config.baseUrl, config.hrvStatusPath, date), accessToken),
      fetchMetric(resolveUrl(config.baseUrl, config.trainingLoadPath, date), accessToken),
      fetchMetric(resolveUrl(config.baseUrl, config.recoveryTimePath, date), accessToken)
    ]);

  return {
    capturedAt: new Date().toISOString(),
    bodyBattery: extractNumber(bodyBatteryData, config.bodyBatteryField),
    sleepScore: extractNumber(sleepScoreData, config.sleepScoreField),
    hrvStatus: extractStatus(hrvStatusData, config.hrvStatusField),
    trainingLoad: extractNumber(trainingLoadData, config.trainingLoadField),
    recoveryTimeHours: extractNumber(recoveryTimeData, config.recoveryTimeField)
  };
};
