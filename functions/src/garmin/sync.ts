import type { GarminMetricsRequest, GarminReadinessSnapshot } from "@lupin/types";
import { fetchGarminMetrics } from "./client";
import { normalizeGarminReadiness } from "./normalize";
import { firestore, serverTimestamp } from "../firebase";

const assertString = (value: unknown, label: string): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${label}.`);
  }
  return value;
};

export const parseGarminMetricsRequest = (payload: unknown): GarminMetricsRequest => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Missing Garmin metrics payload.");
  }
  const record = payload as Record<string, unknown>;
  return {
    accessToken: assertString(record.accessToken, "accessToken"),
    userId: assertString(record.userId, "userId"),
    date: typeof record.date === "string" ? record.date : undefined
  };
};

export const syncGarminReadiness = async (
  payload: GarminMetricsRequest
): Promise<GarminReadinessSnapshot> => {
  const metrics = await fetchGarminMetrics(payload.accessToken, payload.date);
  const readinessScore = normalizeGarminReadiness(metrics);
  const capturedAt = metrics.capturedAt;
  const snapshot: GarminReadinessSnapshot = {
    userId: payload.userId,
    capturedAt,
    metrics,
    readinessScore,
    createdAt: new Date().toISOString(),
    source: "garmin"
  };

  const docRef = await firestore.collection("garminReadinessSnapshots").add({
    ...snapshot,
    createdAt: serverTimestamp()
  });

  return { ...snapshot, id: docRef.id };
};
