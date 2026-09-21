import {
  API_PATHS,
  REQUEST_CHANNEL,
} from '../constants/apiConfig';
import type {
  ApiRequest,
  CreateRequestBody,
  CreateRequestPayload,
  CreateRequestResponse,
} from '../types/api';
import type {
  CitizenRequest,
  MapCoordinate,
  RequestAttachment,
  RequestSource,
  RequestStatus,
} from '../types/domain';
import { getCurrentUser } from './authService';
import { apiJson } from './apiClient';
import { isUuid } from '../utils/uuid';

const STATUS_MAP: Record<string, RequestStatus> = {
  submitted: 'submitted',
  registered: 'submitted',
  new: 'submitted',
  pending: 'submitted',
  reviewing: 'reviewing',
  inreview: 'reviewing',
  review: 'reviewing',
  referred: 'referred',
  in_progress: 'in_progress',
  inprogress: 'in_progress',
  processing: 'in_progress',
  done: 'done',
  completed: 'done',
  closed: 'done',
  resolved: 'done',
  rejected: 'rejected',
  cancelled: 'rejected',
};

function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function mapApiStatus(status: string): RequestStatus {
  return STATUS_MAP[normalizeStatusKey(status)] ?? 'submitted';
}

function mapChannelToSource(channel: string): RequestSource {
  const key = channel.trim().toLowerCase();
  if (key === 'phonecall' || key === 'phone' || key === 'phone_call') {
    return 'phone';
  }
  return 'app';
}

function mapApiFile(file: ApiRequest['files'][number]): RequestAttachment {
  return {
    id: file.fileId,
    uri: file.listenUrl,
    name: file.fileType || 'پیوست',
    mimeType: file.fileType,
  };
}

export function mapApiRequestToCitizen(item: ApiRequest): CitizenRequest {
  const description = item.description?.trim() || '—';
  const createdAt = item.createdAtUtc || item.updatedAtUtc || new Date().toISOString();

  return {
    id: item.id,
    trackingCode: item.trackingCode,
    title: description.slice(0, 28) || 'درخواست',
    description,
    status: mapApiStatus(item.status),
    apiStatus: item.status,
    source: mapChannelToSource(item.channel),
    createdAt,
    latitude: item.locationLat,
    longitude: item.locationLng,
    addressLabel:
      item.locationLat != null && item.locationLng != null
        ? `${item.locationLat.toFixed(5)}, ${item.locationLng.toFixed(5)}`
        : undefined,
    attachments: (item.files ?? []).map(mapApiFile),
    history: [
      {
        id: `hist-${item.id}`,
        status: mapApiStatus(item.status),
        title: 'وضعیت درخواست',
        paraf: item.outcome || undefined,
        createdAt,
      },
    ],
    citizenFirstName: item.citizenFirstName,
    citizenLastName: item.citizenLastName,
    citizenPhone: item.citizenPhone,
  };
}

/** Kept for notificationService — API mode has no local seed. */
export async function ensureRequestsSeeded(): Promise<void> {
  return;
}

export async function listRequests(): Promise<CitizenRequest[]> {
  const user = await getCurrentUser();
  const items = await apiJson<ApiRequest[]>(API_PATHS.requests);

  const mapped = items.map(mapApiRequestToCitizen);

  if (!user?.nationalId) {
    return mapped.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return items
    .filter((item) => item.nationalCode === user.nationalId)
    .map(mapApiRequestToCitizen)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getRequestById(
  id: string,
): Promise<CitizenRequest | null> {
  try {
    const item = await apiJson<ApiRequest>(API_PATHS.requestById(id));
    return mapApiRequestToCitizen(item);
  } catch {
    return null;
  }
}

export async function getRequestByTrackingCode(
  code: string,
): Promise<CitizenRequest | null> {
  try {
    const item = await apiJson<ApiRequest>(
      API_PATHS.requestByTrackingCode(code),
    );
    return mapApiRequestToCitizen(item);
  } catch {
    return null;
  }
}

export async function createRequest(input: {
  description: string;
  coordinate: MapCoordinate;
  addressLabel?: string;
  attachments?: RequestAttachment[];
}): Promise<CitizenRequest> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('برای ثبت درخواست باید وارد حساب کاربری شوید.');
  }

  const payload: CreateRequestPayload = {
    citizen: {
      nationalCode: user.nationalId,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.mobile,
    },
    description: input.description.trim(),
    location: {
      lat: input.coordinate.latitude,
      lng: input.coordinate.longitude,
    },
    fileIds: [],
    channel: REQUEST_CHANNEL,
  };

  // File upload endpoint is not in the published Swagger yet — send local URIs later via fileIds
  if (input.attachments?.length) {
    console.warn(
      '[requestService] attachments ignored until file upload API is wired; count=',
      input.attachments.length,
    );
  }

  const created = await apiJson<CreateRequestResponse>(API_PATHS.requests, {
    method: 'POST',
    body: JSON.stringify({ request: payload } satisfies CreateRequestBody),
  });

  if (!created.requestId?.trim()) {
    throw new Error('سرور requestId برنگرداند.');
  }
  if (!isUuid(created.requestId)) {
    throw new Error(`requestId نامعتبر از سرور: ${created.requestId}`);
  }

  const detail =
    (await getRequestById(created.requestId)) ??
    mapApiRequestToCitizen({
      id: created.requestId,
      trackingCode: created.trackingCode,
      nationalCode: user.nationalId,
      description: payload.description,
      locationLat: payload.location.lat,
      locationLng: payload.location.lng,
      channel: payload.channel,
      status: 'Submitted',
      createdAtUtc: new Date().toISOString(),
      updatedAtUtc: new Date().toISOString(),
      citizenFirstName: user.firstName,
      citizenLastName: user.lastName,
      citizenPhone: user.mobile,
      files: [],
    });

  if (input.addressLabel) {
    detail.addressLabel = input.addressLabel;
  }

  return detail;
}

export async function getMapRequests(): Promise<CitizenRequest[]> {
  const items = await listRequests();
  return items.filter(
    (item) => item.latitude != null && item.longitude != null,
  );
}
