import { ALERT_DISTANCE_KM, BASE_RATE_KM_S, START_DISTANCE_KM } from "./constants";

// speedMultiplier
export function speedMultiplier(km: number): number {
  if (km > 3) return 1;
  if (km > 1) return 1.5;
  return 2.5;
}

// advanceDistance
export function advanceDistance(distance: number, dt: number): number {
  const km = Math.max(0, distance);
  return Math.max(0, distance - BASE_RATE_KM_S * speedMultiplier(km) * dt);
}

// tollScale
export function tollScale(distance: number): number {
  const progress = Math.min(1, Math.max(0, (START_DISTANCE_KM - distance) / START_DISTANCE_KM));
  return 1 + progress * 0.25;
}

// formatTime
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

// easeOutCubic
export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// easeOutQuad
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) ** 2;
}

// isAlertZone
export function isAlertZone(distance: number): boolean {
  return distance <= ALERT_DISTANCE_KM;
}
