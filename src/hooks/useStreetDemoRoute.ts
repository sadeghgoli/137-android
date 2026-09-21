import { useEffect, useState } from 'react';
import {
  DEMO_ROUTE,
  DEMO_ROUTE_DESTINATION,
  DEMO_ROUTE_DURATION_MS,
  DEMO_ROUTE_ORIGIN,
} from '../constants/demoRoute';
import { fetchDrivingRoute } from '../services/routingService';
import type { MapCoordinate } from '../types/domain';

export type LoadedDemoRoute = {
  coordinates: MapCoordinate[];
  durationMs: number;
  loading: boolean;
};

/**
 * Loads a street-following driving path for the demo vehicle.
 */
export function useStreetDemoRoute(enabled: boolean): LoadedDemoRoute {
  const [coordinates, setCoordinates] = useState<MapCoordinate[]>(DEMO_ROUTE);
  const [durationMs, setDurationMs] = useState(DEMO_ROUTE_DURATION_MS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      const route = await fetchDrivingRoute(
        DEMO_ROUTE_ORIGIN,
        DEMO_ROUTE_DESTINATION,
      );
      if (cancelled) {
        return;
      }

      // Keep animation readable: ~18–45s depending on route length
      const scaled = Math.min(
        45000,
        Math.max(18000, route.durationSeconds * 1000 * 0.35),
      );

      setCoordinates(route.coordinates);
      setDurationMs(scaled);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { coordinates, durationMs, loading };
}
