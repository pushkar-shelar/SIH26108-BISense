import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procurementApi } from '../services/procurementApi';
import type { ProcurementSessionCreateRequest } from '../types/api';

export function useCreateSession() {
  return useMutation({
    mutationFn: (request: ProcurementSessionCreateRequest) => procurementApi.createSession(request),
  });
}

export function useGetSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['procurementSession', sessionId],
    queryFn: () => procurementApi.getSession(sessionId!),
    enabled: !!sessionId,
  });
}

export function useProcurements() {
  return useQuery({
    queryKey: ['procurements'],
    queryFn: () => procurementApi.listSessions(),
  });
}

export function useAddToBasket(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (standard: Record<string, any>) =>
      procurementApi.addStandardToBasket(sessionId, standard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurementSession', sessionId] });
    },
  });
}

export function useRemoveFromBasket(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (familyId: string) =>
      procurementApi.removeStandardFromBasket(sessionId, familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurementSession', sessionId] });
    },
  });
}

