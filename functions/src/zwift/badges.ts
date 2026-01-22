import type { ZwiftActivity, ZwiftRoute, ZwiftRouteBadge } from "@lupin/types";

export const mapActivitiesToBadges = (
  activities: ZwiftActivity[],
  routes: ZwiftRoute[]
): { badges: ZwiftRouteBadge[]; missingRoutes: number[] } => {
  const routeMap = new Map<number, ZwiftRoute>();
  for (const route of routes) {
    routeMap.set(route.id, route);
  }

  const badgesByRoute = new Map<number, ZwiftRouteBadge>();
  const missing = new Set<number>();

  for (const activity of activities) {
    if (!activity.routeId) {
      continue;
    }
    if (!routeMap.has(activity.routeId)) {
      missing.add(activity.routeId);
      continue;
    }
    if (!badgesByRoute.has(activity.routeId)) {
      badgesByRoute.set(activity.routeId, {
        routeId: activity.routeId,
        activityId: activity.id,
        completedAt: activity.startTime
      });
    }
  }

  return {
    badges: Array.from(badgesByRoute.values()),
    missingRoutes: Array.from(missing.values())
  };
};
