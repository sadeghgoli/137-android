import { SSO_CALLBACK_URL } from '../constants/apiConfig';
import {
  assertOtpCooldownAllowsSend,
  markOtpSent,
} from '../utils/otpCooldown';

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string | null;
  data?: T;
  errors?: unknown;
};

export type PhoneOption = {
  id: number;
  phoneNumber: string;
  isPrimary?: boolean;
};

export type SsoUserInfo = {
  id: string;
  melliCode: string;
  phone?: string | null;
};

export type TokenPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType?: string;
  user?: SsoUserInfo;
};

export class SsoApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SsoApiError';
    this.status = status;
  }
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
}

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const text = await response.text();
  if (!text) {
    return { success: response.ok };
  }
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    throw new SsoApiError(response.status, 'پاسخ نامعتبر از سرویس احراز هویت');
  }
}

async function ssoFetch<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null,
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${SSO_API_URL}${path}`, { ...init, headers });
  } catch {
    throw new SsoApiError(0, 'خطا در ارتباط با سرویس احراز هویت');
  }

  const envelope = await parseEnvelope<T>(response);
  if (!response.ok || envelope.success === false) {
    const detail =
      envelope.message?.trim() ||
      (typeof envelope.errors === 'string' ? envelope.errors : '') ||
      (response.status === 400
        ? 'درخواست نامعتبر (شماره یا کد ملی را بررسی کنید)'
        : 'خطا در سرویس احراز هویت');
    throw new SsoApiError(response.status, detail);
  }
  return envelope;
}

export type SecondLoginResult =
  | { exists: true; phones: PhoneOption[] }
  | { exists: false; message: string; redirectToSSO: true };

function normalizePhoneOption(raw: Record<string, unknown>): PhoneOption | null {
  const phoneNumber = String(
    raw.phoneNumber ??
      raw.value ??
      raw.mobile ??
      raw.maskedPhoneNumber ??
      raw.display ??
      '',
  ).trim();
  if (!phoneNumber) {
    return null;
  }
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id ?? 0) || 0;
  return {
    id,
    phoneNumber: normalizeDigits(phoneNumber) || phoneNumber,
    isPrimary: Boolean(raw.isPrimary),
  };
}

function extractPhones(data: unknown): PhoneOption[] {
  if (!data || typeof data !== 'object') {
    return [];
  }
  const record = data as Record<string, unknown>;
  const lists = ['phones', 'phoneNumbers', 'mobileNumbers', 'mobiles'] as const;
  for (const key of lists) {
    const arr = record[key];
    if (!Array.isArray(arr)) {
      continue;
    }
    const mapped = arr
      .map((item) =>
        typeof item === 'string'
          ? ({ id: 0, phoneNumber: item, isPrimary: false } satisfies PhoneOption)
          : normalizePhoneOption(item as Record<string, unknown>),
      )
      .filter((item): item is PhoneOption => item != null && !!item.phoneNumber);
    if (mapped.length > 0) {
      return mapped;
    }
  }
  return [];
}

export async function secondLogin(
  melliCode: string,
): Promise<SecondLoginResult> {
  const envelope = await ssoFetch<Record<string, unknown>>(
    '/api/auth/second-login',
    {
      method: 'POST',
      body: JSON.stringify({ melliCode }),
    },
  );

  const data = envelope.data;
  const phones = extractPhones(data);
  if (phones.length > 0) {
    return { exists: true, phones };
  }

  const message =
    (typeof data?.message === 'string' ? data.message : null) ??
    envelope.message ??
    'کاربر یافت نشد. لطفاً از طریق سامانه احراز هویت وزارت کشور وارد شوید.';

  return {
    exists: false,
    message,
    redirectToSSO: true,
  };
}

const otpSendInFlight = new Map<string, Promise<{ message?: string }>>();

function generateOtpCode(): string {
  return String(Math.floor(Math.random() * 100_000)).padStart(5, '0');
}

function otpInFlightKey(phoneNumber: string, melliCode: string): string {
  return `${normalizeDigits(melliCode)}:${normalizeDigits(phoneNumber)}`;
}

export async function sendOtp(
  phoneNumber: string,
  melliCode: string,
  phoneId?: number,
): Promise<{ message?: string }> {
  const flightKey = otpInFlightKey(phoneNumber, melliCode);
  const existing = otpSendInFlight.get(flightKey);
  if (existing) {
    return existing;
  }

  const task = sendOtpOnce(phoneNumber, melliCode, phoneId);
  otpSendInFlight.set(flightKey, task);
  try {
    return await task;
  } finally {
    otpSendInFlight.delete(flightKey);
  }
}

async function sendOtpOnce(
  phoneNumber: string,
  melliCode: string,
  _phoneId?: number,
): Promise<{ message?: string }> {
  await assertOtpCooldownAllowsSend(phoneNumber, melliCode);

  const otpCode = generateOtpCode();
  const envelope = await ssoFetch<{ message?: string }>(
    '/api/auth/second-login/send-otp',
    {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: normalizeDigits(phoneNumber) || phoneNumber.trim(),
        melliCode: normalizeDigits(melliCode),
        otpCode,
      }),
    },
  );

  await markOtpSent(phoneNumber, melliCode);

  return {
    message: envelope.data?.message ?? envelope.message ?? 'کد تایید ارسال شد',
  };
}

export async function verifyOtp(
  phoneNumber: string,
  otpCode: string,
  melliCode: string,
): Promise<TokenPayload> {
  const envelope = await ssoFetch<TokenPayload>(
    '/api/auth/second-login/verify-otp',
    {
      method: 'POST',
      body: JSON.stringify({
        phoneNumber: normalizeDigits(phoneNumber) || phoneNumber.trim(),
        otpCode: normalizeDigits(otpCode),
        melliCode: normalizeDigits(melliCode),
      }),
    },
  );
  if (!envelope.data?.accessToken) {
    throw new SsoApiError(500, 'توکن احراز هویت دریافت نشد');
  }
  return envelope.data;
}

export async function initiateMoiLogin(
  returnUrl: string = SSO_CALLBACK_URL,
): Promise<{ loginUrl: string; state: string }> {
  const envelope = await ssoFetch<{ loginUrl: string; state: string }>(
    '/api/auth/login/initiate',
    {
      method: 'POST',
      body: JSON.stringify({ returnUrl }),
    },
  );
  if (!envelope.data?.loginUrl) {
    throw new SsoApiError(500, 'آدرس ورود SSO دریافت نشد');
  }
  return envelope.data;
}

export async function fetchMe(accessToken: string): Promise<SsoUserInfo> {
  const envelope = await ssoFetch<SsoUserInfo>(
    '/api/auth/me',
    { method: 'GET' },
    accessToken,
  );
  if (!envelope.data?.id) {
    throw new SsoApiError(401, 'اطلاعات کاربر یافت نشد');
  }
  return envelope.data;
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenPayload> {
  const envelope = await ssoFetch<TokenPayload>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  if (!envelope.data?.accessToken) {
    throw new SsoApiError(401, 'تمدید نشست ناموفق بود');
  }
  return {
    accessToken: envelope.data.accessToken,
    refreshToken: envelope.data.refreshToken || refreshToken,
    expiresIn: envelope.data.expiresIn,
    tokenType: envelope.data.tokenType,
  };
}

export async function logoutRemote(accessToken: string): Promise<void> {
  try {
    await ssoFetch('/api/auth/logout', { method: 'POST' }, accessToken);
  } catch {
    // ignore network errors on logout
  }
}
