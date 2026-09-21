import type { RequestStatus } from '../types/domain';
import { STATUS_LABELS } from '../constants';

export function formatDateFa(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function statusLabel(status: RequestStatus, raw?: string): string {
  if (raw?.trim()) {
    return raw.trim();
  }
  return STATUS_LABELS[status];
}
