import type { CitizenRequest, MapCoordinate } from '../../types/domain';

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type HomeMapHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

export type HomeMapProps = {
  region: MapRegion;
  requests?: CitizenRequest[];
  selectedCoordinate?: MapCoordinate | null;
  onMapPress?: (coordinate: MapCoordinate) => void;
  onRequestPress?: (request: CitizenRequest) => void;
};
