/** Inner object for POST /api/v1/requests */
export type CreateRequestPayload = {
  citizen: {
    nationalCode: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  description: string;
  location: {
    lat: number;
    lng: number;
  };
  fileIds: string[];
  channel: string;
};

/** API expects the payload wrapped in a `request` property */
export type CreateRequestBody = {
  request: CreateRequestPayload;
};

export type CreateRequestResponse = {
  requestId: string;
  trackingCode: string;
};

export type ApiRequestFile = {
  fileId: string;
  fileType: string;
  createdAtUtc: string;
  listenUrl: string;
};

export type ApiRequest = {
  id: string;
  trackingCode: string;
  nationalCode: string;
  description: string;
  locationLat: number;
  locationLng: number;
  channel: string;
  status: string;
  currentGroupId?: string;
  createdBySourcePhone?: string;
  citizenFirstName?: string;
  citizenLastName?: string;
  citizenPhone?: string;
  outcome?: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  files: ApiRequestFile[];
};

export type ApiProblemDetails = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  message?: string;
  traceId?: string;
  [key: string]: unknown;
};
