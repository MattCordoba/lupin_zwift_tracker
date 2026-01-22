import type { ZwiftRiderProfile, ZwiftRoute } from "@lupin/types";
import { normalizeRoute } from "./normalize";
import { pickFirst, toBoolean, toDistanceKm, toNumber, type UnknownRecord } from "./utils";

const asRecord = (value: unknown): UnknownRecord =>
  (typeof value === "object" && value ? (value as UnknownRecord) : {});

const estimateRouteTimeMinutes = (
  distanceKm: number,
  elevationM: number,
  profile?: ZwiftRiderProfile
): number => {
  const ftpWatts = profile?.ftpWatts ?? 0;
  const baseSpeedKph = ftpWatts ? Math.min(45, 20 + ftpWatts / 20) : 28;
  const climbPenaltyMinutes = elevationM ? (elevationM / 100) * 2.2 : 0;
  const travelMinutes = distanceKm ? (distanceKm / baseSpeedKph) * 60 : 0;
  return Math.max(5, Math.round(travelMinutes + climbPenaltyMinutes));
};

const getRouteDistanceKm = (record: UnknownRecord): number => {
  const distanceValue = pickFirst(record, [
    "distanceKm",
    "distance",
    "distanceInMeters",
    "distanceMeters",
    "routeDistance"
  ]);
  return toDistanceKm(
    distanceValue,
    record.distanceKm !== undefined ? "km" : "meters"
  );
};

const getRouteElevationM = (record: UnknownRecord): number => {
  const elevationValue = pickFirst(record, [
    "elevationM",
    "elevationGain",
    "climb",
    "totalElevation"
  ]);
  return toNumber(elevationValue, 0);
};

const getRouteVisibility = (record: UnknownRecord) => {
  return {
    isEventOnly: toBoolean(
      pickFirst(record, ["isEventOnly", "eventOnly", "onlyEvent"]),
      false
    ),
    isPublic: toBoolean(pickFirst(record, ["isPublic", "public", "visible"]), true)
  };
};

export const buildRouteCatalog = (
  rawRoutes: unknown,
  profile?: ZwiftRiderProfile
): ZwiftRoute[] => {
  const routes = Array.isArray(rawRoutes) ? rawRoutes : [];

  return routes
    .map((raw) => {
      const record = asRecord(raw);
      const distanceKm = getRouteDistanceKm(record);
      const elevationM = getRouteElevationM(record);
      const estimate = estimateRouteTimeMinutes(distanceKm, elevationM, profile);
      return normalizeRoute(record, estimate);
    })
    .filter((route) => route.id > 0 && route.name)
    .filter((route) => route.isPublic && !route.isEventOnly);
};
