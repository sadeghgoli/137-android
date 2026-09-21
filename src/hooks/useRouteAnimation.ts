import { useEffect, useMemo, useRef, useState } from 'react';
import type { MapCoordinate } from '../types/domain';

function haversineMeters(a: MapCoordinate, b: MapCoordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function bearingDegrees(a: MapCoordinate, b: MapCoordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function buildSegments(route: MapCoordinate[]) {
  const segments: {
    start: MapCoordinate;
    end: MapCoordinate;
    length: number;
    startDistance: number;
  }[] = [];

  let total = 0;
  for (let i = 0; i < route.length - 1; i += 1) {
    const start = route[i];
    const end = route[i + 1];
    const length = Math.max(haversineMeters(start, end), 1);
    segments.push({ start, end, length, startDistance: total });
    total += length;
  }

  return { segments, totalLength: total };
}

export type RouteAnimationState = {
  coordinate: MapCoordinate;
  bearing: number;
  progress: number;
};

export function useRouteAnimation(
  route: MapCoordinate[],
  options: {
    enabled: boolean;
    durationMs: number;
    loop?: boolean;
  },
): RouteAnimationState | null {
  const { enabled, durationMs, loop = true } = options;
  const [state, setState] = useState<RouteAnimationState | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const geometry = useMemo(() => {
    if (route.length < 2) {
      return null;
    }
    return buildSegments(route);
  }, [route]);

  useEffect(() => {
    if (!enabled || !geometry) {
      setState(null);
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    startRef.current = performance.now();

    const tick = (now: number) => {
      let elapsed = now - startRef.current;
      if (loop) {
        elapsed %= durationMs;
      } else if (elapsed > durationMs) {
        elapsed = durationMs;
      }

      const progress = elapsed / durationMs;
      const distance = progress * geometry.totalLength;
      const segment =
        geometry.segments.find(
          (item) =>
            distance <= item.startDistance + item.length ||
            item === geometry.segments[geometry.segments.length - 1],
        ) ?? geometry.segments[geometry.segments.length - 1];

      const localT = Math.min(
        1,
        Math.max(0, (distance - segment.startDistance) / segment.length),
      );

      const coordinate: MapCoordinate = {
        latitude: lerp(segment.start.latitude, segment.end.latitude, localT),
        longitude: lerp(segment.start.longitude, segment.end.longitude, localT),
      };

      setState({
        coordinate,
        bearing: bearingDegrees(segment.start, segment.end),
        progress,
      });

      if (!loop && elapsed >= durationMs) {
        frameRef.current = null;
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [durationMs, enabled, geometry, loop]);

  return state;
}
