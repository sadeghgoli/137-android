export type RequestSource = 'app' | 'phone';

export type RequestStatus =
  | 'submitted'
  | 'reviewing'
  | 'referred'
  | 'in_progress'
  | 'done'
  | 'rejected';

export type CitizenUser = {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  mobile: string;
  landline?: string;
  landlineVerified: boolean;
};

export type RequestAttachment = {
  id: string;
  uri: string;
  name: string;
  mimeType?: string;
};

export type RequestHistoryItem = {
  id: string;
  status: RequestStatus;
  title: string;
  paraf?: string;
  createdAt: string;
  actor?: string;
};

export type CitizenRequest = {
  id: string;
  trackingCode: string;
  title: string;
  description: string;
  status: RequestStatus;
  /** Raw status string from API (when available) */
  apiStatus?: string;
  source: RequestSource;
  createdAt: string;
  latitude?: number;
  longitude?: number;
  addressLabel?: string;
  attachments: RequestAttachment[];
  history: RequestHistoryItem[];
  citizenFirstName?: string;
  citizenLastName?: string;
  citizenPhone?: string;
};

export type AppNotification = {
  id: string;
  requestId: string;
  title: string;
  status: RequestStatus;
  paraf?: string;
  createdAt: string;
  read: boolean;
};

export type MapCoordinate = {
  latitude: number;
  longitude: number;
};
