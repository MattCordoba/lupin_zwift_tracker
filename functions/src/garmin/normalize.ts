import type { GarminMetrics } from "@lupin/types";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const scoreFromOptional = (value: number | null | undefined, fallback = 50) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }
  return clamp(value, 0, 100);
};

const scoreFromTrainingLoad = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 50;
  }
  const normalized = clamp(value, 0, 200);
  return clamp(100 - normalized / 2, 0, 100);
};

const scoreFromRecoveryTime = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 50;
  }
  const normalized = clamp(value, 0, 72);
  return clamp(100 - (normalized / 72) * 100, 0, 100);
};

const scoreFromHrv = (status: GarminMetrics["hrvStatus"]) => {
  switch (status) {
    case "low":
      return 40;
    case "balanced":
      return 60;
    case "high":
      return 70;
    case "unknown":
      return 50;
    default:
      return 50;
  }
};

export const normalizeGarminReadiness = (metrics: GarminMetrics) => {
  const components = [
    { value: scoreFromOptional(metrics.bodyBattery), weight: 0.3 },
    { value: scoreFromOptional(metrics.sleepScore), weight: 0.25 },
    { value: scoreFromHrv(metrics.hrvStatus), weight: 0.2 },
    { value: scoreFromTrainingLoad(metrics.trainingLoad), weight: 0.15 },
    { value: scoreFromRecoveryTime(metrics.recoveryTimeHours), weight: 0.1 }
  ];

  const available = components.filter((component) => Number.isFinite(component.value));
  const totalWeight = available.reduce((sum, component) => sum + component.weight, 0) || 1;
  const weighted = available.reduce(
    (sum, component) => sum + component.value * component.weight,
    0
  );
  return Math.round(clamp(weighted / totalWeight, 0, 100));
};
