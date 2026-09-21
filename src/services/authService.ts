import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { StorageKeys } from '../constants';
import { SSO_CALLBACK_URL, SSO_WEB_URL } from '../constants/apiConfig';
import type { CitizenUser } from '../types/domain';
import {
  fetchMe,
  logoutRemote,
  refreshAccessToken,
  secondLogin,
  sendOtp,
  verifyOtp,
  type PhoneOption,
  type SsoUserInfo,
  type TokenPayload,
} from './ssoApiClient';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './tokenStorage';
import { setApiToken } from './apiClient';

WebBrowser.maybeCompleteAuthSession();

function mapSsoUser(info: SsoUserInfo, fallbackPhone?: string): CitizenUser {
  return {
    id: info.id,
    firstName: '',
    lastName: '',
    nationalId: info.melliCode,
    mobile: info.phone?.trim() || fallbackPhone || '',
    landlineVerified: false,
  };
}

function persianDigitsToEnglish(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function normalizeMelliCode(value: string): string {
  return persianDigitsToEnglish(value).replace(/\D/g, '');
}

async function persistSession(
  tokens: TokenPayload,
  user: CitizenUser,
): Promise<CitizenUser> {
  await setTokens(tokens.accessToken, tokens.refreshToken);
  await setApiToken(tokens.accessToken);
  await AsyncStorage.setItem(StorageKeys.isAuthenticated, 'true');
  await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(user));
  return user;
}

export async function lookupPhonesByMelliCode(
  melliCode: string,
): Promise<
  | { kind: 'phones'; phones: PhoneOption[]; melliCode: string }
  | { kind: 'sso'; message: string; melliCode: string }
> {
  const normalized = normalizeMelliCode(melliCode);
  if (normalized.length !== 10) {
    throw new Error('کد ملی باید ۱۰ رقم باشد');
  }

  const result = await secondLogin(normalized);
  if (result.exists) {
    return { kind: 'phones', phones: result.phones, melliCode: normalized };
  }
  return { kind: 'sso', message: result.message, melliCode: normalized };
}

export async function requestOtp(
  phoneNumber: string,
  melliCode: string,
  phoneId?: number,
): Promise<{ code?: string }> {
  return sendOtp(phoneNumber, melliCode, phoneId);
}

export async function loginWithOtp(
  phoneNumber: string,
  otpCode: string,
  melliCode: string,
): Promise<CitizenUser> {
  const tokens = await verifyOtp(
    phoneNumber,
    persianDigitsToEnglish(otpCode).replace(/\D/g, ''),
    melliCode,
  );
  const user = tokens.user
    ? mapSsoUser(tokens.user, phoneNumber)
    : mapSsoUser(
        await fetchMe(tokens.accessToken),
        phoneNumber,
      );
  return persistSession(tokens, user);
}

function parseCallbackUrl(url: string): {
  token?: string;
  refreshToken?: string;
  error?: string;
  message?: string;
} {
  const parsed = Linking.parse(url);
  const q = parsed.queryParams ?? {};
  return {
    token: typeof q.token === 'string' ? q.token : undefined,
    refreshToken:
      typeof q.refreshToken === 'string' ? q.refreshToken : undefined,
    error: typeof q.error === 'string' ? q.error : undefined,
    message: typeof q.message === 'string' ? q.message : undefined,
  };
}

function buildSsoWebUrl(path: string, query?: Record<string, string>): string {
  const base = SSO_WEB_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const params = new URLSearchParams(query);
  const q = params.toString();
  return q ? `${base}${normalizedPath}?${q}` : `${base}${normalizedPath}`;
}

async function completeLoginFromCallbackUrl(url: string): Promise<CitizenUser> {
  const params = parseCallbackUrl(url);
  if (params.error) {
    throw new Error(params.message || 'خطا در احراز هویت');
  }
  if (!params.token) {
    throw new Error('توکن از callback دریافت نشد');
  }

  await setTokens(params.token, params.refreshToken);
  await setApiToken(params.token);
  const info = await fetchMe(params.token);
  const user = mapSsoUser(info);
  await AsyncStorage.setItem(StorageKeys.isAuthenticated, 'true');
  await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(user));
  return user;
}

/** Full login via mvc-web-sso portal at auth.sabzevar.ir (OTP or MOI in browser). */
export async function loginWithSsoPortal(): Promise<CitizenUser> {
  const loginUrl = buildSsoWebUrl('/account/login', {
    returnUrl: SSO_CALLBACK_URL,
  });
  const result = await WebBrowser.openAuthSessionAsync(
    loginUrl,
    SSO_CALLBACK_URL,
  );

  if (result.type !== 'success' || !result.url) {
    throw new Error('ورود از portal احراز هویت لغو شد');
  }

  return completeLoginFromCallbackUrl(result.url);
}

/** MOI login through the same portal entry as the web SSO app. */
export async function loginWithMoiBrowser(): Promise<CitizenUser> {
  const loginUrl = buildSsoWebUrl('/account/redirect', {
    provider: 'moi',
    returnUrl: SSO_CALLBACK_URL,
  });
  const result = await WebBrowser.openAuthSessionAsync(
    loginUrl,
    SSO_CALLBACK_URL,
  );

  if (result.type !== 'success' || !result.url) {
    throw new Error('ورود از طریق وزارت کشور لغو شد');
  }

  return completeLoginFromCallbackUrl(result.url);
}

export async function isAuthenticated(): Promise<boolean> {
  const access = await getAccessToken();
  if (!access) {
    const flag = await AsyncStorage.getItem(StorageKeys.isAuthenticated);
    return flag === 'true';
  }

  try {
    const info = await fetchMe(access);
    const user = mapSsoUser(info);
    await AsyncStorage.setItem(StorageKeys.isAuthenticated, 'true');
    await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(user));
    await setApiToken(access);
    return true;
  } catch {
    const refresh = await getRefreshToken();
    if (!refresh) {
      await clearSessionLocal();
      return false;
    }
    try {
      const tokens = await refreshAccessToken(refresh);
      const info = await fetchMe(tokens.accessToken);
      await persistSession(tokens, mapSsoUser(info));
      return true;
    } catch {
      await clearSessionLocal();
      return false;
    }
  }
}

async function clearSessionLocal(): Promise<void> {
  await clearTokens();
  await setApiToken(null);
  await AsyncStorage.multiRemove([
    StorageKeys.isAuthenticated,
    StorageKeys.authUser,
  ]);
}

export async function getCurrentUser(): Promise<CitizenUser | null> {
  const raw = await AsyncStorage.getItem(StorageKeys.authUser);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CitizenUser;
  } catch {
    return null;
  }
}

export async function updateCurrentUser(
  patch: Partial<CitizenUser>,
): Promise<CitizenUser> {
  const current = await getCurrentUser();
  if (!current) {
    throw new Error('کاربر وارد نشده است');
  }
  const next = { ...current, ...patch };
  await AsyncStorage.setItem(StorageKeys.authUser, JSON.stringify(next));
  return next;
}

export async function logout(): Promise<void> {
  const access = await getAccessToken();
  if (access) {
    await logoutRemote(access);
  }
  await clearSessionLocal();
}
