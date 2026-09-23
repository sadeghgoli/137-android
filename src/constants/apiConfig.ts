import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ApiExtra = {
  apiBaseUrl?: string;
  apiToken?: string;
  apiKey?: string;
  requestChannel?: string;
  /** @deprecated use ssoApiUrl */
  ssoBaseUrl?: string;
  /** MVC SSO portal (mvc-web-sso) — auth.sabzevar.ir */
  ssoWebUrl?: string;
  /** Login API backend (same as mvc-web-sso appsettings Api:BaseUrl) */
  ssoApiUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ApiExtra;

/** Sabzevar 137 request service (Swagger: apiweb-137request.sabzevar.ir:5007) */
export const API_BASE_URL =
  extra.apiBaseUrl?.replace(/\/$/, '') ??
  'https://apiweb-137request.sabzevar.ir';

/** Public SSO portal (mvc-web-sso) */
export const SSO_WEB_URL =
  extra.ssoWebUrl?.replace(/\/$/, '') ?? 'https://auth.sabzevar.ir';

const configuredSsoApiUrl =
  extra.ssoApiUrl?.replace(/\/$/, '') ??
  extra.ssoBaseUrl?.replace(/\/$/, '') ??
  'https://apiweb-loginsso.sabzevar.ir';

/**
 * Web: `/sso-api` → apiweb-loginsso (nginx/Metro).
 * Native: direct HTTPS to apiweb-loginsso.sabzevar.ir.
 * second-login and verify-otp use this base.
 * OTP SMS: POST {SSO_WEB_URL}/api/citizen/send-login-otp (portal sends the SMS).
 */
export const SSO_API_URL =
  Platform.OS === 'web' ? '/sso-api' : configuredSsoApiUrl;

/** @deprecated alias of SSO_API_URL */
export const SSO_BASE_URL = SSO_API_URL;

export const SSO_SCHEME = 'sabzevar137';
export const SSO_CALLBACK_URL = `${SSO_SCHEME}://auth/callback`;

/** Bearer token for /api/v1/* — optional if X-Api-Key is set */
export const API_TOKEN =
  extra.apiToken ?? process.env.EXPO_PUBLIC_API_TOKEN ?? '';

/** X-Api-Key for PhoneCall channel (required unless bearer token is used) */
export const API_KEY =
  extra.apiKey ??
  process.env.EXPO_PUBLIC_API_KEY ??
  'dev-internal-key-137';

/** Channel for POST /api/v1/requests */
export const REQUEST_CHANNEL = extra.requestChannel ?? 'CitizenMobileApp';

export const API_PATHS = {
  requests: '/api/v1/requests',
  requestById: (id: string) => `/api/v1/requests/${encodeURIComponent(id)}`,
  requestByTrackingCode: (code: string) =>
    `/api/v1/requests/by-tracking-code/${encodeURIComponent(code)}`,
} as const;
