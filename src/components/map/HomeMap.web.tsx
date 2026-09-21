import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  MAPLIBRE_CSS,
  MAPLIBRE_JS,
  MAPLIBRE_RTL_JS,
} from '../../assets/maplibre/bundledAssets';
import { Colors } from '../../constants';
import {
  SABZEVAR_MAP,
  appendTileKey,
  zoomFromLatitudeDelta,
} from '../../constants/mapConfig';
import type { CitizenRequest } from '../../types/domain';
import type { HomeMapHandle, HomeMapProps, MapRegion } from './types';

type MapLibreNS = typeof import('maplibre-gl');
type MapInstance = InstanceType<MapLibreNS['Map']>;
type MarkerInstance = InstanceType<MapLibreNS['Marker']>;

declare global {
  interface Window {
    maplibregl?: MapLibreNS;
  }
}

let scriptsReady: Promise<MapLibreNS> | null = null;

function ensureLocalMapLibre(): Promise<MapLibreNS> {
  if (typeof window !== 'undefined' && window.maplibregl) {
    return Promise.resolve(window.maplibregl);
  }
  if (scriptsReady) {
    return scriptsReady;
  }

  scriptsReady = new Promise((resolve, reject) => {
    try {
      if (!document.getElementById('sabzevar-maplibre-css')) {
        const style = document.createElement('style');
        style.id = 'sabzevar-maplibre-css';
        style.textContent = MAPLIBRE_CSS;
        document.head.appendChild(style);
      }

      if (!document.getElementById('sabzevar-maplibre-js')) {
        const script = document.createElement('script');
        script.id = 'sabzevar-maplibre-js';
        script.text = MAPLIBRE_JS;
        document.head.appendChild(script);
      }

      const api = window.maplibregl;
      if (!api) {
        reject(new Error('maplibregl failed to load from local assets'));
        return;
      }

      try {
        const rtlBlob = new Blob([MAPLIBRE_RTL_JS], {
          type: 'application/javascript',
        });
        void api.setRTLTextPlugin(URL.createObjectURL(rtlBlob), true);
      } catch {
        // ignore duplicate RTL plugin
      }

      resolve(api);
    } catch (error) {
      reject(error);
    }
  });

  return scriptsReady;
}

function createEndpointEl(color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '14px';
  el.style.height = '14px';
  el.style.borderRadius = '7px';
  el.style.background = color;
  el.style.border = '2px solid #fff';
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.25)';
  return el;
}

function createRequestEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '22px';
  el.style.height = '30px';
  el.style.background = Colors.pin;
  el.style.borderRadius = '50% 50% 50% 0';
  el.style.transform = 'rotate(-45deg)';
  el.style.border = '2px solid #fff';
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  el.style.cursor = 'pointer';
  return el;
}

/** Bare Sabzevar map (web) using local design-assets MapLibre files. */
export const HomeMap = forwardRef<HomeMapHandle, HomeMapProps>(
  function HomeMap(
    {
      region,
      requests = [],
      selectedCoordinate,
      onMapPress,
      onRequestPress,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<MapInstance | null>(null);
    const maplibreRef = useRef<MapLibreNS | null>(null);
    const [ready, setReady] = useState(false);
    const requestMarkersRef = useRef<MarkerInstance[]>([]);
    const selectedMarkerRef = useRef<MarkerInstance | null>(null);
    const onMapPressRef = useRef(onMapPress);
    const onRequestPressRef = useRef(onRequestPress);
    onMapPressRef.current = onMapPress;
    onRequestPressRef.current = onRequestPress;

    useImperativeHandle(ref, () => ({
      animateToRegion: (next: MapRegion, duration = 1000) => {
        mapRef.current?.flyTo({
          center: [next.longitude, next.latitude],
          zoom: zoomFromLatitudeDelta(next.latitudeDelta),
          duration,
          pitch: SABZEVAR_MAP.pitch,
        });
      },
    }));

    useEffect(() => {
      let cancelled = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

      void (async () => {
        if (!containerRef.current || mapRef.current) {
          return;
        }

        try {
          const maplibregl = await ensureLocalMapLibre();
          if (cancelled || !containerRef.current) {
            return;
          }
          maplibreRef.current = maplibregl;

          const map = new maplibregl.Map({
            container: containerRef.current,
            style: SABZEVAR_MAP.styleUrl,
            center: [region.longitude, region.latitude],
            zoom: zoomFromLatitudeDelta(region.latitudeDelta),
            pitch: SABZEVAR_MAP.pitch,
            bearing: SABZEVAR_MAP.bearing,
            attributionControl: false,
            dragRotate: false,
            touchPitch: false,
            maxZoom: SABZEVAR_MAP.maxZoom,
            minZoom: SABZEVAR_MAP.minZoom,
            transformRequest: (url: string, resourceType?: string) => {
              if (resourceType === 'Tile') {
                return { url: appendTileKey(url) };
              }
              return { url };
            },
          });

          mapRef.current = map;

          const markReady = () => {
            if (!cancelled) {
              setReady(true);
            }
          };
          map.once('load', markReady);
          map.once('idle', markReady);
          fallbackTimer = setTimeout(markReady, 2500);

          map.on('click', (event) => {
            onMapPressRef.current?.({
              latitude: event.lngLat.lat,
              longitude: event.lngLat.lng,
            });
          });

          map.on('error', (event) => {
            console.error('MapLibre error:', event.error ?? event);
            markReady();
          });
        } catch (error) {
          console.error('Failed to init local MapLibre:', error);
          if (!cancelled) {
            setReady(true);
          }
        }
      })();

      return () => {
        cancelled = true;
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
        mapRef.current?.remove();
        mapRef.current = null;
      };
      // intentionally mount once
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl || !ready) {
        return;
      }

      requestMarkersRef.current.forEach((marker) => marker.remove());
      requestMarkersRef.current = [];

      requests.forEach((request: CitizenRequest) => {
        if (request.latitude == null || request.longitude == null) {
          return;
        }
        const el = createRequestEl();
        el.addEventListener('click', (event) => {
          event.stopPropagation();
          onRequestPressRef.current?.(request);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([request.longitude, request.latitude])
          .addTo(map);
        requestMarkersRef.current.push(marker);
      });
    }, [ready, requests]);

    useEffect(() => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl || !ready) {
        return;
      }
      selectedMarkerRef.current?.remove();
      selectedMarkerRef.current = null;
      if (!selectedCoordinate) {
        return;
      }
      selectedMarkerRef.current = new maplibregl.Marker({
        element: createEndpointEl(Colors.primary),
      })
        .setLngLat([selectedCoordinate.longitude, selectedCoordinate.latitude])
        .addTo(map);
    }, [ready, selectedCoordinate]);

    return (
      <View style={styles.container}>
        <div ref={containerRef} style={styles.mapDom} />
        {!ready ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f0f0f0',
  },
  mapDom: {
    width: '100%',
    height: '100%',
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240,240,240,0.55)',
  },
});
