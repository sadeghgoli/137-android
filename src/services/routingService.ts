import type { MapCoordinate } from '../types/domain';
import {
  DEMO_ROUTE,
  DEMO_ROUTE_DESTINATION,
  DEMO_ROUTE_ORIGIN,
} from '../constants/demoRoute';

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

/**
 * Fetch a real driving route that follows streets (OpenStreetMap / OSRM).
 * Falls back to the static demo polyline if the request fails.
 */
export async function fetchDrivingRoute(
  origin: MapCoordinate = DEMO_ROUTE_ORIGIN,
  destination: MapCoordinate = DEMO_ROUTE_DESTINATION,
): Promise<{
  coordinates: MapCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
}> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};` +
    `${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = (await response.json()) as OsrmRouteResponse;
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.geometry?.coordinates?.length) {
      throw new Error('OSRM returned no route');
    }

    const coordinates = route.geometry.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    return {
      coordinates,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
    };
  } catch {
    return {
      coordinates: DEMO_ROUTE,
      distanceMeters: 1200,
      durationSeconds: 180,
    };
  }
}
