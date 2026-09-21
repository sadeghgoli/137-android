import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_KEY, API_TOKEN } from '../constants/apiConfig';
import { StorageKeys } from '../constants';
import type { ApiProblemDetails } from '../types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiProblemDetails | string;

  constructor(status: number, message: string, body?: ApiProblemDetails | string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function resolveAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  const storedKey = await AsyncStorage.getItem(StorageKeys.apiKey);
  const apiKey = storedKey?.trim() || API_KEY.trim();
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  const { getAccessToken } = await import('./tokenStorage');
  const ssoToken = (await getAccessToken())?.trim();
  const storedToken = await AsyncStorage.getItem(StorageKeys.apiToken);
  const token = ssoToken || storedToken?.trim() || API_TOKEN.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseErrorBody(response: Response): Promise<ApiProblemDetails | string> {
  const text = await response.text();
  if (!text) {
    return '';
  }
  try {
    return JSON.parse(text) as ApiProblemDetails;
  } catch {
    return text;
  }
}

function messageFromProblem(
  status: number,
  body: ApiProblemDetails | string,
): string {
  if (typeof body === 'string' && body.trim()) {
    return body.trim();
  }
  if (typeof body === 'object' && body.message) {
    return String(body.message);
  }
  if (typeof body === 'object' && body.detail) {
    return String(body.detail);
  }
  if (typeof body === 'object' && body.title) {
    return String(body.title);
  }
  if (status === 401) {
    return 'احراز هویت ناموفق بود. دوباره وارد شوید.';
  }
  if (status === 503) {
    return 'سرویس درخواست‌ها موقتاً در دسترس نیست.';
  }
  return `خطای سرور (${status})`;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const auth = await resolveAuthHeaders();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...auth,
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, { ...init, headers });
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiError(
      response.status,
      messageFromProblem(response.status, body),
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export async function setApiKey(key: string | null): Promise<void> {
  if (key?.trim()) {
    await AsyncStorage.setItem(StorageKeys.apiKey, key.trim());
  } else {
    await AsyncStorage.removeItem(StorageKeys.apiKey);
  }
}

export async function setApiToken(token: string | null): Promise<void> {
  if (token?.trim()) {
    await AsyncStorage.setItem(StorageKeys.apiToken, token.trim());
  } else {
    await AsyncStorage.removeItem(StorageKeys.apiToken);
  }
}
