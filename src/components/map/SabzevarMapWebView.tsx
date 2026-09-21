import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '../../constants';
import {
  SABZEVAR_MAP,
  zoomFromLatitudeDelta,
} from '../../constants/mapConfig';
import type { CitizenRequest } from '../../types/domain';
import type { HomeMapHandle, HomeMapProps, MapRegion } from './types';

type BridgeMessage =
  | { type: 'bridgeReady' }
  | { type: 'log'; message: string }
  | { type: 'mapPress'; latitude: number; longitude: number }
  | { type: 'requestPress'; requestId: string }
  | { type: 'ready' }
  | { type: 'styleLoaded' }
  | { type: 'tilesVisible' }
  | { type: 'loading'; value: boolean }
  | { type: 'error'; message: string }
  | { type: 'debug'; step: string; detail?: string };

const MAX_LOGS = 40;
/** VPN / فیلترشکن می‌تواند استایل را خیلی کند کند */
const MAP_TIMEOUT_MS = 120000;

/**
 * Same host Expo Go already uses for the JS bundle.
 * Do NOT branch on Constants.isDevice — it is often `undefined` in Expo Go,
 * which wrongly forced http://127.0.0.1 and broke WebView map loading.
 */
function getMetroOrigin(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    (Constants as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost ??
    null;

  if (!hostUri) {
    return Platform.OS === 'android' ? 'http://127.0.0.1:8081' : null;
  }

  // Expo reported localhost → Android emulator reaches host via 10.0.2.2
  if (
    Platform.OS === 'android' &&
    /^(localhost|127\.0\.0\.1)(:|$)/i.test(hostUri)
  ) {
    const port = hostUri.includes(':') ? hostUri.split(':')[1] : '8081';
    return `http://10.0.2.2:${port}`;
  }

  return `http://${hostUri}`;
}

function buildMapUri(metroOrigin: string, region: MapRegion): string {
  const params = new URLSearchParams({
    embed: '1',
    debug: '1',
    styleUrl: SABZEVAR_MAP.styleUrl,
    key: SABZEVAR_MAP.tileApiKey,
    lng: String(region.longitude),
    lat: String(region.latitude),
    zoom: String(zoomFromLatitudeDelta(region.latitudeDelta)),
    pitch: String(SABZEVAR_MAP.pitch),
    bearing: String(SABZEVAR_MAP.bearing),
    maxZoom: String(SABZEVAR_MAP.maxZoom),
    minZoom: String(SABZEVAR_MAP.minZoom),
    proxyOrigin: metroOrigin,
    timeoutMs: String(MAP_TIMEOUT_MS),
    t: String(Date.now()),
  });
  return `${metroOrigin}/maplibre/map.html?${params.toString()}`;
}

/** Android MapLibre WebView with always-on debug panel. */
export const SabzevarMapWebView = forwardRef<HomeMapHandle, HomeMapProps>(
  function SabzevarMapWebView(
    {
      region,
      requests = [],
      selectedCoordinate,
      onMapPress,
      onRequestPress,
    },
    ref,
  ) {
    const webRef = useRef<WebView>(null);
    const readyRef = useRef(false);
    const initialRegionRef = useRef(region);
    const [isLoading, setIsLoading] = useState(true);
    const [mapError, setMapError] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>(['RN: mount']);
    const [probe, setProbe] = useState('probe: pending');

    const metroOrigin = useMemo(() => getMetroOrigin(), []);
    const mapUri = useMemo(
      () =>
        metroOrigin
          ? buildMapUri(metroOrigin, initialRegionRef.current)
          : null,
      [metroOrigin],
    );

    const pushLog = useCallback((line: string) => {
      const stamped = `${new Date().toLocaleTimeString('en-GB')} ${line}`;
      setLogs((prev) => [stamped, ...prev].slice(0, MAX_LOGS));
    }, []);

    const inject = useCallback((js: string) => {
      webRef.current?.injectJavaScript(`${js}; true;`);
    }, []);

    const pushState = useCallback(() => {
      if (!readyRef.current) {
        return;
      }
      inject(
        `window.__mapBridge && window.__mapBridge.setRequests(${JSON.stringify(
          requests.map((item: CitizenRequest) => ({
            id: item.id,
            latitude: item.latitude,
            longitude: item.longitude,
          })),
        )})`,
      );
      inject(
        `window.__mapBridge && window.__mapBridge.setSelected(${
          selectedCoordinate ? JSON.stringify(selectedCoordinate) : 'null'
        })`,
      );
    }, [inject, requests, selectedCoordinate]);

    useImperativeHandle(ref, () => ({
      animateToRegion: (next: MapRegion) => {
        inject(
          `window.__mapBridge && window.__mapBridge.animateTo(${JSON.stringify({
            ...next,
            pitch: SABZEVAR_MAP.pitch,
          })})`,
        );
      },
    }));

    useEffect(() => {
      pushState();
    }, [pushState]);

    // RN-side network probes — show exact failure mode in debug panel
    useEffect(() => {
      if (!metroOrigin) {
        setProbe('probe: no metro origin');
        return;
      }
      let cancelled = false;
      void (async () => {
        const lines: string[] = [];
        lines.push(`metro=${metroOrigin}`);
        lines.push(`isDevice=${String(Constants.isDevice)} (ignored for URL)`);
        lines.push(`hostUri=${Constants.expoConfig?.hostUri ?? 'null'}`);
        lines.push(`debuggerHost=${Constants.expoGoConfig?.debuggerHost ?? 'null'}`);

        try {
          const statusRes = await fetch(`${metroOrigin}/map-proxy-status`);
          const statusJson = (await statusRes.json()) as {
            upstreamProxy?: string | null;
            timeoutMs?: number;
            hint?: string | null;
          };
          lines.push(
            `mapProxy=${statusJson.upstreamProxy || 'direct'} timeout=${statusJson.timeoutMs ?? '?'}ms`,
          );
          if (statusJson.hint) {
            lines.push(`hint=${statusJson.hint}`);
          }
        } catch (error) {
          lines.push(
            `map-proxy-status FAIL ${error instanceof Error ? error.message : error}`,
          );
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), MAP_TIMEOUT_MS);

        try {
          const htmlRes = await fetch(`${metroOrigin}/maplibre/map.html`, {
            method: 'HEAD',
            signal: controller.signal,
          });
          lines.push(`map.html HEAD=${htmlRes.status}`);
        } catch (error) {
          lines.push(
            `map.html FAIL ${error instanceof Error ? error.message : error}`,
          );
        }

        const proxyUrl = `${metroOrigin}/map-proxy?url=${encodeURIComponent(
          SABZEVAR_MAP.styleUrl,
        )}`;
        try {
          const styleRes = await fetch(proxyUrl, { signal: controller.signal });
          const body = await styleRes.text();
          lines.push(
            `style proxy=${styleRes.status} bytes=${body.length} head=${body.slice(0, 80).replace(/\s+/g, ' ')}`,
          );
          if (!styleRes.ok) {
            pushLog(`RN: style probe HTTP ${styleRes.status} (WebView continues)`);
            if (
              styleRes.status === 502 ||
              styleRes.status === 504 ||
              /MAP_HTTP_PROXY|ETIMEDOUT|timeout/i.test(body)
            ) {
              pushLog(
                'RN: geo unreachable — turn on filter-shikan, set MAP_HTTP_PROXY to its local HTTP port, restart Metro',
              );
            }
          }
        } catch (error) {
          lines.push(
            `style proxy FAIL ${error instanceof Error ? error.message : error}`,
          );
          pushLog('RN: style probe failed (WebView continues; VPN may be slow)');
        } finally {
          clearTimeout(timer);
        }

        if (!cancelled) {
          const text = lines.join('\n');
          setProbe(text);
          pushLog('RN probe done');
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [metroOrigin, pushLog]);

    const onLayout = (_event: LayoutChangeEvent) => {
      inject(
        'window.__mapBridge && window.__mapBridge.resize && window.__mapBridge.resize()',
      );
    };

    const onMessage = (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as BridgeMessage;
        if (data.type === 'debug') {
          pushLog(`WV:${data.step}${data.detail ? ` | ${data.detail}` : ''}`);
          return;
        }
        if (data.type === 'bridgeReady') {
          pushLog('WV:bridgeReady (page will auto-init via query)');
          return;
        }
        if (data.type === 'log') {
          pushLog(`WV:${data.message}`);
          return;
        }
        if (data.type === 'ready') {
          readyRef.current = true;
          pushLog('WV:ready');
          pushState();
          return;
        }
        if (data.type === 'styleLoaded' || data.type === 'tilesVisible') {
          setIsLoading(false);
          setMapError(null);
          pushLog(`WV:${data.type}`);
          inject(
            'window.__mapBridge && window.__mapBridge.resize && window.__mapBridge.resize()',
          );
          return;
        }
        if (data.type === 'loading') {
          pushLog(`WV:loading=${String(data.value)}`);
          if (data.value) {
            setIsLoading(true);
          }
          return;
        }
        if (data.type === 'error') {
          setMapError(data.message);
          setIsLoading(false);
          pushLog(`WV:ERROR ${data.message}`);
          return;
        }
        if (data.type === 'mapPress') {
          onMapPress?.({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        }
        if (data.type === 'requestPress') {
          const found = requests.find((item) => item.id === data.requestId);
          if (found) {
            onRequestPress?.(found);
          }
        }
      } catch (error) {
        pushLog(`RN: bad message ${String(error)}`);
      }
    };

    if (!mapUri) {
      return (
        <View style={styles.container}>
          <Text style={styles.fatal}>
            Metro پیدا نشد. `npx expo start` و `adb reverse tcp:8081 tcp:8081` را بزن.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container} onLayout={onLayout}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ uri: mapUri }}
          onMessage={onMessage}
          onLoadStart={() => pushLog(`RN: loadStart ${mapUri}`)}
          onLoadEnd={() => pushLog('RN: loadEnd')}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          androidLayerType="hardware"
          cacheEnabled={false}
          onShouldStartLoadWithRequest={() => true}
          onError={(event) => {
            const msg = event.nativeEvent.description || 'WebView error';
            setMapError(msg);
            setIsLoading(false);
            pushLog(`RN:onError ${msg}`);
          }}
          onHttpError={(event) => {
            const msg = `HTTP ${event.nativeEvent.statusCode}`;
            setMapError(msg);
            setIsLoading(false);
            pushLog(`RN:onHttpError ${msg}`);
          }}
        />

        {isLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>در حال بارگذاری لایه های نقشه...</Text>
          </View>
        ) : null}

        {/* Always-visible debug panel */}
        <View style={styles.debugPanel} pointerEvents="box-none">
          <Text style={styles.debugTitle}>MAP DEBUG (Android)</Text>
          <Text style={styles.debugProbe}>{probe}</Text>
          {mapError ? (
            <Text style={styles.debugError}>ERROR: {mapError}</Text>
          ) : null}
          <ScrollView style={styles.debugScroll} nestedScrollEnabled>
            {logs.map((line, index) => (
              <Text key={`${index}-${line.slice(0, 24)}`} style={styles.debugLine}>
                {line}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#d9e2ec',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    opacity: 0.99,
  },
  fatal: {
    margin: 24,
    textAlign: 'center',
    color: Colors.textPrimary,
    writingDirection: 'rtl',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 120,
    gap: 10,
    backgroundColor: 'rgba(217,226,236,0.55)',
  },
  loadingText: {
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  debugPanel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    maxHeight: '42%',
    backgroundColor: 'rgba(0,0,0,0.82)',
    borderRadius: 10,
    padding: 10,
    zIndex: 99,
  },
  debugTitle: {
    color: '#7CFFB2',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },
  debugProbe: {
    color: '#FFE08A',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 6,
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
  },
  debugError: {
    color: '#FF8A8A',
    fontSize: 11,
    marginBottom: 6,
  },
  debugScroll: {
    maxHeight: 140,
  },
  debugLine: {
    color: '#E8E8E8',
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 2,
    fontFamily: Platform.OS === 'android' ? 'monospace' : undefined,
  },
});
