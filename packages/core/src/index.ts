import type { RideResult } from "@lupin/types";

export function scoreRide(distanceKm: number, elevationM: number): number {
  const base = distanceKm * 2;
  const climb = elevationM * 0.05;
  return Math.round(base + climb);
}

export function rankResults(results: RideResult[]): RideResult[] {
  return [...results].sort((a, b) => b.score - a.score);
}
