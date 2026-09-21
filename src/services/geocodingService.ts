import { SABZEVAR_MAP, appendTileKey } from '../constants/mapConfig';
import { Strings } from '../constants/strings';
import type { MapCoordinate } from '../types/domain';

export type ResolvedMapLocation = {
  coordinate: MapCoordinate;
  addressLabel: string;
};

type ReverseGeocodeFeature = {
  properties?: {
    label?: string;
    name?: string;
    street?: string;
  };
};

type ReverseGeocodeResponse = {
  address?: string;
  address_compact?: string;
  postal_address?: string;
  formatted_address?: string;
  display_name?: string;
  label?: string;
  last?: string;
  route_name?: string;
  local_address?: string;
  features?: ReverseGeocodeFeature[];
};

const REQUEST_TIMEOUT_MS = 12000;

function geoUrl(path: string, query = ''): string {
  const base = `${SABZEVAR_MAP.baseUrl}${path}`;
  const withQuery = query ? `${base}?${query}` : base;
  return appendTileKey(withQuery);
}

async function fetchGeoJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractAddress(data: ReverseGeocodeResponse): string | null {
  const directCandidates = [
    data.address_compact,
    data.local_address,
    data.postal_address,
    data.address,
    data.formatted_address,
    data.display_name,
    data.label,
    data.last,
    data.route_name,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const feature of data.features ?? []) {
    const label = feature.properties?.label?.trim();
    if (label) {
      return label;
    }
    const name = feature.properties?.name?.trim();
    if (name) {
      return name;
    }
    const street = feature.properties?.street?.trim();
    if (street) {
      return street;
    }
  }

  return null;
}

async function reverseGeocode(coordinate: MapCoordinate): Promise<string | null> {
  const query = `lat=${coordinate.latitude}&lon=${coordinate.longitude}`;
  const data = await fetchGeoJson<ReverseGeocodeResponse>(
    geoUrl(SABZEVAR_MAP.reverseGeocodePath, query),
  );

  if (!data) {
    return null;
  }

  return extractAddress(data);
}

/** Resolve a human-readable address for a map tap. */
export async function resolveMapSelection(
  tap: MapCoordinate,
): Promise<ResolvedMapLocation> {
  const addressLabel =
    (await reverseGeocode(tap)) ?? Strings.home.addressUnavailable;

  return {
    coordinate: tap,
    addressLabel,
  };
}
