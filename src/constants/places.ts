import { RequestStatus, RequestSource } from '../types/domain';

/** Sabzevar city center */
export const DEFAULT_MAP_REGION = {
  latitude: 36.2126,
  longitude: 57.6819,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'ثبت شده',
  reviewing: 'در حال بررسی',
  referred: 'ارجاع‌شده',
  in_progress: 'در حال اقدام',
  done: 'انجام‌شده',
  rejected: 'رد شده',
};

export const SOURCE_LABELS: Record<RequestSource, string> = {
  app: 'ثبت از طریق اپلیکیشن',
  phone: 'ثبت از طریق تماس تلفنی',
};
