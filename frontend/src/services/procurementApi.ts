import { fetchApi } from './api';
import type { ProcurementSessionCreateRequest, ProcurementSessionResponse } from '../types/api';

export const procurementApi = {
  createSession: (data: ProcurementSessionCreateRequest) =>
    fetchApi<ProcurementSessionResponse>('/api/v1/procurements/session', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  getSession: (sessionId: string) =>
    fetchApi<ProcurementSessionResponse>(`/api/v1/procurements/session/${sessionId}`),

  listSessions: () =>
    fetchApi<{ sessions: ProcurementSessionResponse[] }>('/api/v1/procurements'),

  addStandardToBasket: (sessionId: string, standard: Record<string, any>) =>
    fetchApi<ProcurementSessionResponse>(`/api/v1/procurements/session/${sessionId}/standards`, {
      method: 'POST',
      body: JSON.stringify(standard),
    }),

  removeStandardFromBasket: (sessionId: string, familyId: string) =>
    fetchApi<ProcurementSessionResponse>(
      `/api/v1/procurements/session/${sessionId}/standards/${encodeURIComponent(familyId)}`,
      { method: 'DELETE' }
    ),
};

