import { API_BASE_URL } from '../config/api';

export type DriverDocumentType =
  | 'LICENSE'
  | 'NATIONAL_ID'
  | 'REGISTRATION_BOOK'
  | 'INSURANCE';

export interface DriverDocumentRecord {
  id: string;
  type: DriverDocumentType;
  url: string;
  publicId?: string | null;
  updatedAt: string;
}

export const DOCUMENT_LABELS: Record<DriverDocumentType, string> = {
  LICENSE: 'Driver License',
  NATIONAL_ID: 'National ID',
  REGISTRATION_BOOK: 'Registration Book',
  INSURANCE: 'Insurance',
};

export const fetchDriverDocuments = async (driverId: string) => {
  const response = await fetch(
    `${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/documents`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load documents');
  }
  return data as {
    success: boolean;
    documents: DriverDocumentRecord[];
    requiredTypes: DriverDocumentType[];
  };
};

export const saveDriverDocument = async (
  driverId: string,
  payload: {
    type: DriverDocumentType;
    url: string;
    publicId?: string;
    phone: string;
  }
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/drivers/${encodeURIComponent(driverId)}/documents`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to save document');
  }
  return data;
};
