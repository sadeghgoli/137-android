import AsyncStorage from '@react-native-async-storage/async-storage';

export const OTP_RESEND_COOLDOWN_MS = 2 * 60 * 1000;

const storageKey = (phone: string, melliCode: string) =>
  `otp:lastSent:${normalizeKeyPart(melliCode)}:${normalizeKeyPart(phone)}`;

function normalizeKeyPart(value: string): string {
  return value.replace(/\D/g, '');
}

export async function getOtpCooldownRemainingMs(
  phoneNumber: string,
  melliCode: string,
): Promise<number> {
  const raw = await AsyncStorage.getItem(storageKey(phoneNumber, melliCode));
  if (!raw) return 0;
  const lastSent = Number(raw);
  if (!Number.isFinite(lastSent)) return 0;
  const remaining = lastSent + OTP_RESEND_COOLDOWN_MS - Date.now();
  return remaining > 0 ? remaining : 0;
}

export async function assertOtpCooldownAllowsSend(
  phoneNumber: string,
  melliCode: string,
): Promise<void> {
  const remaining = await getOtpCooldownRemainingMs(phoneNumber, melliCode);
  if (remaining <= 0) return;
  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeLabel =
    minutes > 0 ? `${minutes}:${String(secs).padStart(2, '0')}` : `${seconds}`;
  throw new Error(
    `حداکثر یک بار در هر ۲ دقیقه می‌توانید کد دریافت کنید. ${timeLabel} دیگر صبر کنید.`,
  );
}

export async function markOtpSent(phoneNumber: string, melliCode: string): Promise<void> {
  await AsyncStorage.setItem(
    storageKey(phoneNumber, melliCode),
    String(Date.now()),
  );
}
