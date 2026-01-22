import type { ZwiftActivity, ZwiftRiderProfile, ZwiftRoute } from "@lupin/types";
import {
  pickFirst,
  toBoolean,
  toDistanceKm,
  toIsoString,
  toNumber,
  toOptionalNumber,
  toStringValue,
  type UnknownRecord
} from "./utils";

const asRecord = (value: unknown): UnknownRecord =>
  (typeof value === "object" && value ? (value as UnknownRecord) : {});

export const normalizeProfile = (raw: unknown): ZwiftRiderProfile => {
  const record = asRecord(raw);
  const firstName = toStringValue(
    pickFirst(record, ["firstName", "firstname", "givenName"])
  );
  const lastName = toStringValue(pickFirst(record, ["lastName", "lastname", "surname"]));
  const displayName =
    toStringValue(pickFirst(record, ["displayName", "name", "fullName"])) ||
    `${firstName} ${lastName}`.trim() ||
    "Zwift Rider";

  return {
    id: toStringValue(pickFirst(record, ["id", "playerId", "riderId", "profileId"])),
    displayName,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    country: toStringValue(pickFirst(record, ["country", "countryCode"])) || undefined,
    level: toOptionalNumber(pickFirst(record, ["level", "currentLevel"])),
    ftpWatts: toOptionalNumber(pickFirst(record, ["ftp", "ftpWatts"])),
    weightKg: toOptionalNumber(pickFirst(record, ["weightKg", "weight"])),
    heightCm: toOptionalNumber(pickFirst(record, ["heightCm", "height"])),
    avatarUrl: toStringValue(pickFirst(record, ["avatar", "avatarUrl", "profileImage"])) ||
      undefined
  };
};

export const normalizeActivity = (raw: unknown): ZwiftActivity => {
  const record = asRecord(raw);
  const distanceValue = pickFirst(record, [
    "distanceKm",
    "distance",
    "distanceInMeters",
    "totalDistance",
    "distanceMeters"
  ]);
  const distanceKm =
    record.distanceKm !== undefined
      ? toDistanceKm(distanceValue, "km")
      : toDistanceKm(distanceValue, "meters");

  return {
    id: toStringValue(pickFirst(record, ["id", "activityId", "rideId"])),
    name: toStringValue(pickFirst(record, ["name", "activityName"])) || "Zwift Activity",
    distanceKm,
    durationSec: toNumber(
      pickFirst(record, ["durationSec", "duration", "movingTime", "elapsedTime"]),
      0
    ),
    elevationM: toNumber(
      pickFirst(record, ["elevationM", "elevationGain", "totalElevation"]),
      0
    ),
    startTime: toIsoString(pickFirst(record, ["startTime", "startDate", "startedAt"])),
    worldId: toOptionalNumber(pickFirst(record, ["worldId", "mapId"])),
    routeId: toOptionalNumber(pickFirst(record, ["routeId", "route", "mapRouteId"])),
    sport: toStringValue(pickFirst(record, ["sport", "activityType"])) || undefined,
    isEvent: toBoolean(pickFirst(record, ["isEvent", "event", "eventRide"]), false),
    averageSpeedKph: toOptionalNumber(
      pickFirst(record, ["averageSpeedKph", "avgSpeed", "averageSpeed"])
    )
  };
};

export const normalizeRoute = (
  raw: unknown,
  estimatedTimeMinutes: number
): ZwiftRoute => {
  const record = asRecord(raw);
  const distanceValue = pickFirst(record, [
    "distanceKm",
    "distance",
    "distanceInMeters",
    "distanceMeters",
    "routeDistance"
  ]);
  const elevationValue = pickFirst(record, [
    "elevationM",
    "elevationGain",
    "climb",
    "totalElevation"
  ]);

  const leadInDistance = pickFirst(record, [
    "leadInDistanceKm",
    "leadInDistance",
    "leadInDistanceMeters"
  ]);
  const leadInElevation = pickFirst(record, [
    "leadInElevationM",
    "leadInElevation",
    "leadInElevationGain"
  ]);

  return {
    id: toNumber(pickFirst(record, ["id", "routeId", "route_id"]), 0),
    worldId: toNumber(pickFirst(record, ["worldId", "mapId"]), 0),
    name: toStringValue(pickFirst(record, ["name", "routeName"])),
    distanceKm: toDistanceKm(
      distanceValue,
      record.distanceKm !== undefined ? "km" : "meters"
    ),
    elevationM: toNumber(elevationValue, 0),
    leadInDistanceKm:
      leadInDistance !== undefined
        ? toDistanceKm(leadInDistance, "meters")
        : undefined,
    leadInElevationM:
      leadInElevation !== undefined ? toNumber(leadInElevation, 0) : undefined,
    imageUrl:
      toStringValue(pickFirst(record, ["imageUrl", "image", "mapImage"])) || undefined,
    signature:
      toStringValue(pickFirst(record, ["signature", "routeSignature"])) || undefined,
    isEventOnly: toBoolean(
      pickFirst(record, ["isEventOnly", "eventOnly", "onlyEvent"]),
      false
    ),
    isPublic: toBoolean(pickFirst(record, ["isPublic", "public", "visible"]), true),
    estimatedTimeMinutes
  };
};
