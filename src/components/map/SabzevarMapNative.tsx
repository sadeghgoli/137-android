import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Camera,
  Map,
  Marker,
  NetworkManager,
  type CameraRef,
  type MapRef,
} from '@maplibre/maplibre-react-native';
import sabzevarStyle from '../../assets/map/sabzevarStyle.json';
import { Colors } from '../../constants';
import {
  SABZEVAR_MAP,
  zoomFromLatitudeDelta,
} from '../../constants/mapConfig';
import type { CitizenRequest } from '../../types/domain';
import type { HomeMapHandle, HomeMapProps, MapRegion } from './types';

/**
 * Native MapLibre (Android/iOS) — requires Expo Dev Client / `expo run:android`.
 * Not compatible with Expo Go.
 */
export const SabzevarMapNative = forwardRef<HomeMapHandle, HomeMapProps>(
  function SabzevarMapNative(
    {
      region,
      requests = [],
      selectedCoordinate,
      onMapPress,
      onRequestPress,
    },
    ref,
  ) {
    const cameraRef = useRef<CameraRef>(null);
    const mapRef = useRef<MapRef>(null);
    const initialRegionRef = useRef(region);
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);

    const initialZoom = zoomFromLatitudeDelta(
      initialRegionRef.current.latitudeDelta,
    );

    useEffect(() => {
      NetworkManager.setConnected(true);
    }, []);

    useImperativeHandle(ref, () => ({
      animateToRegion: (next: MapRegion, duration = 1000) => {
        cameraRef.current?.flyTo({
          center: [next.longitude, next.latitude],
          zoom: zoomFromLatitudeDelta(next.latitudeDelta),
          pitch: SABZEVAR_MAP.pitch,
          bearing: SABZEVAR_MAP.bearing,
          duration,
        });
      },
    }));

    return (
      <View style={styles.container}>
        <Map
          ref={mapRef}
          style={styles.map}
          mapStyle={
            sabzevarStyle as unknown as React.ComponentProps<typeof Map>['mapStyle']
          }
          logo={false}
          attribution={false}
          compass={false}
          scaleBar={false}
          touchPitch={false}
          touchRotate={false}
          onDidFinishLoadingMap={() => {
            setIsLoading(false);
            setMapError(null);
          }}
          onDidFinishLoadingStyle={() => {
            setIsLoading(false);
            setMapError(null);
          }}
          onDidFailLoadingMap={() => {
            setIsLoading(false);
            setMapError(
              'بارگذاری نقشه ناموفق بود. فیلترشکن را روشن کنید و دوباره تلاش کنید.',
            );
          }}
          onPress={(event) => {
            const lngLat = event.nativeEvent.lngLat;
            if (!lngLat || lngLat.length < 2) {
              return;
            }
            onMapPress?.({
              longitude: lngLat[0],
              latitude: lngLat[1],
            });
          }}
        >
          <Camera
            ref={cameraRef}
            minZoom={SABZEVAR_MAP.minZoom}
            maxZoom={SABZEVAR_MAP.maxZoom}
            initialViewState={{
              center: [
                initialRegionRef.current.longitude,
                initialRegionRef.current.latitude,
              ],
              zoom: initialZoom,
              pitch: SABZEVAR_MAP.pitch,
              bearing: SABZEVAR_MAP.bearing,
            }}
          />

          {requests.map((item: CitizenRequest) => {
            if (item.latitude == null || item.longitude == null) {
              return null;
            }
            return (
              <Marker
                key={item.id}
                id={item.id}
                lngLat={[item.longitude, item.latitude]}
                anchor="bottom"
                onPress={(event) => {
                  event.stopPropagation?.();
                  onRequestPress?.(item);
                }}
              >
                <View style={styles.requestPin} />
              </Marker>
            );
          })}

          {selectedCoordinate ? (
            <Marker
              id="selected"
              lngLat={[
                selectedCoordinate.longitude,
                selectedCoordinate.latitude,
              ]}
              anchor="center"
            >
              <View style={styles.selectedDot} />
            </Marker>
          ) : null}
        </Map>

        {isLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>در حال بارگذاری نقشه...</Text>
          </View>
        ) : null}

        {mapError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{mapError}</Text>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#d9e2ec',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(217,226,236,0.45)',
  },
  loadingText: {
    color: Colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  errorBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    backgroundColor: 'rgba(39,50,71,0.94)',
    borderRadius: 12,
    padding: 14,
  },
  errorText: {
    color: '#fff',
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  requestPin: {
    width: 22,
    height: 30,
    backgroundColor: '#E74C3C',
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
    borderBottomLeftRadius: 0,
    transform: [{ rotate: '-45deg' }],
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#48DDB0',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
