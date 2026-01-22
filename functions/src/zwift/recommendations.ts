import type {
  ZwiftRecommendationLength,
  ZwiftRoute,
  ZwiftRouteBadge,
  ZwiftRouteRecommendation
} from "@lupin/types";

type RecommendationContext = {
  readinessScore: number;
  routes: ZwiftRoute[];
  badges: ZwiftRouteBadge[];
  availableWorldIds: number[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const roundTo = (value: number, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const buildTargets = (readinessScore: number) => {
  const readinessFactor = clamp(0.5 + readinessScore / 100, 0.5, 1.5);
  return {
    short: 30 * readinessFactor,
    medium: 60 * readinessFactor,
    long: 90 * readinessFactor
  };
};

const selectBestRoute = (
  routes: ZwiftRoute[],
  targetMinutes: number,
  usedIds: Set<number>
) => {
  const candidates = routes
    .filter((route) => !usedIds.has(route.id))
    .map((route) => ({
      route,
      score: Math.abs(route.estimatedTimeMinutes - targetMinutes)
    }))
    .sort((a, b) => a.score - b.score || a.route.estimatedTimeMinutes - b.route.estimatedTimeMinutes);
  return candidates[0]?.route;
};

const buildImpact = (
  route: ZwiftRoute,
  completedCount: number,
  totalRoutes: number,
  remainingMinutes: number
) => {
  const projectedBadgeCompletionPercent = roundTo(
    ((completedCount + 1) / Math.max(totalRoutes, 1)) * 100
  );
  const projectedHoursBurndownPercent =
    remainingMinutes > 0 ? roundTo((route.estimatedTimeMinutes / remainingMinutes) * 100) : 0;

  return {
    projectedBadgeCompletionPercent,
    projectedHoursBurndownPercent
  };
};

export const buildZwiftRecommendations = ({
  readinessScore,
  routes,
  badges,
  availableWorldIds
}: RecommendationContext): ZwiftRouteRecommendation[] => {
  const completedRouteIds = new Set(badges.map((badge) => badge.routeId));
  const remainingRoutes = routes.filter((route) => !completedRouteIds.has(route.id));
  const eligibleRoutes = remainingRoutes.filter((route) =>
    availableWorldIds.includes(route.worldId)
  );
  if (!eligibleRoutes.length) {
    return [];
  }

  const targets = buildTargets(readinessScore);
  const used = new Set<number>();
  const totalRoutes = routes.length;
  const remainingMinutes = remainingRoutes.reduce(
    (sum, route) => sum + route.estimatedTimeMinutes,
    0
  );
  const completedCount = completedRouteIds.size;

  const lengths: ZwiftRecommendationLength[] = ["short", "medium", "long"];
  const recommendations: ZwiftRouteRecommendation[] = [];

  for (const length of lengths) {
    const targetMinutes = targets[length];
    const route = selectBestRoute(eligibleRoutes, targetMinutes, used);
    if (!route) {
      continue;
    }
    used.add(route.id);
    recommendations.push({
      length,
      route,
      impact: buildImpact(route, completedCount, totalRoutes, remainingMinutes)
    });
  }

  return recommendations;
};
