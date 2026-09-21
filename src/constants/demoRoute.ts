import type { MapCoordinate } from '../types/domain';

/**
 * Two points on real roads inside Sabzevar for demo routing.
 * Route geometry is fetched from OSRM (street-following).
 */
export const DEMO_ROUTE_ORIGIN: MapCoordinate = {
  latitude: 36.2152,
  longitude: 57.6798,
};

export const DEMO_ROUTE_DESTINATION: MapCoordinate = {
  latitude: 36.2088,
  longitude: 57.6925,
};

/** Fallback straight-ish polyline if routing API is offline */
export const DEMO_ROUTE: MapCoordinate[] = [
  DEMO_ROUTE_ORIGIN,
  { latitude: 36.2135, longitude: 57.6835 },
  { latitude: 36.2112, longitude: 57.6878 },
  DEMO_ROUTE_DESTINATION,
];

/** Base animation duration; actual duration scales with route length */
export const DEMO_ROUTE_DURATION_MS = 28000;
