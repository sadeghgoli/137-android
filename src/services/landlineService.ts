import { updateCurrentUser } from './authService';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type LandlineVerifyResult =
  | { success: true }
  | { success: false; error: string };

/** Mock IVR/operator landline verification. */
export async function verifyLandline(
  phone: string,
): Promise<LandlineVerifyResult> {
  await delay(2200);

  const normalized = phone.replace(/\D/g, '');
  // Demo rule: numbers ending with 0 fail so retry path can be tested.
  if (normalized.endsWith('0')) {
    return {
      success: false,
      error: 'تماس برقرار نشد یا احراز توسط سامانه ناموفق بود.',
    };
  }

  await updateCurrentUser({
    landline: phone,
    landlineVerified: true,
  });

  return { success: true };
}
