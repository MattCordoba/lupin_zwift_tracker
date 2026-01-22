import type {
  ZwiftActivity,
  ZwiftAuthPayload,
  ZwiftRoute,
  ZwiftSyncResult
} from "@lupin/types";
import { createZwiftClient } from "./client";
import { mapActivitiesToBadges } from "./badges";
import { normalizeActivity, normalizeProfile } from "./normalize";
import { buildRouteCatalog } from "./routes";

const normalizeActivities = (raw: unknown): ZwiftActivity[] => {
  const activities = Array.isArray(raw) ? raw : [];
  return activities.map((activity) => normalizeActivity(activity));
};

export const syncZwiftData = async (
  auth: ZwiftAuthPayload
): Promise<ZwiftSyncResult> => {
  const client = await createZwiftClient(auth);
  const [profileRaw, activitiesRaw, routesRaw] = await Promise.all([
    client.getProfile(),
    client.getActivities(),
    client.getRoutes()
  ]);

  const profile = normalizeProfile(profileRaw);
  const activities = normalizeActivities(activitiesRaw);
  const routes = buildRouteCatalog(routesRaw, profile);
  const { badges, missingRoutes } = mapActivitiesToBadges(activities, routes);

  return {
    profile,
    activities,
    routes,
    badges,
    missingRoutes
  };
};

export const fetchZwiftRoutes = async (
  auth: ZwiftAuthPayload
): Promise<ZwiftRoute[]> => {
  const client = await createZwiftClient(auth);
  const routesRaw = await client.getRoutes();
  return buildRouteCatalog(routesRaw);
};
