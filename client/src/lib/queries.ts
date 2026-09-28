import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Activity, Deal, DealInput, DocumentMeta, Lookups, Member, Note, Stage, StageChange } from './types';

const LIVE = { refetchInterval: 15_000 };

export const keys = {
  lookups: ['lookups'] as const,
  deals: ['deals'] as const,
  members: ['members'] as const,
  stageHistory: ['stage-history'] as const,
  activity: (dealId?: string) => ['activity', dealId ?? 'all'] as const,
  notes: (dealId: string) => ['notes', dealId] as const,
  documents: (dealId?: string) => ['documents', dealId ?? 'all'] as const,
};

export function useLookups() {
  const q = useQuery({ queryKey: keys.lookups, queryFn: () => api.get<Lookups>('/lookups'), staleTime: Infinity });
  return useMemo(() => {
    const stages: Stage[] = q.data?.stages ?? [];
    const industries = [...(q.data?.industries ?? [])].sort((a, b) =>
      a.key === 'other' ? 1 : b.key === 'other' ? -1 : a.label.localeCompare(b.label),
    );
    const sources = [...(q.data?.sources ?? [])].sort((a, b) => a.label.localeCompare(b.label));
    const stageByKey = new Map(stages.map((s) => [s.key, s]));
    const industryLabel = (k: string | null) => (k ? industries.find((i) => i.key === k)?.label ?? k : 'Unclassified');
    const sourceLabel = (k: string | null) => (k ? sources.find((s) => s.key === k)?.label ?? k : 'Unknown');
    return { ready: q.isSuccess, stages, industries, sources, stageByKey, industryLabel, sourceLabel };
  }, [q.data, q.isSuccess]);
}

export function useDeals() {
  return useQuery({ queryKey: keys.deals, queryFn: () => api.get<Deal[]>('/deals'), ...LIVE });
}

export function useMembers() {
  const q = useQuery({ queryKey: keys.members, queryFn: () => api.get<Member[]>('/members'), ...LIVE });
  const byId = useMemo(() => new Map((q.data ?? []).map((m) => [m.id, m])), [q.data]);
  return { ...q, byId };
}

export function useStageHistory() {
  return useQuery({ queryKey: keys.stageHistory, queryFn: () => api.get<StageChange[]>('/stage-history'), ...LIVE });
}

export function useActivity(dealId?: string, limit = 50) {
  const qs = new URLSearchParams({ limit: String(limit), ...(dealId ? { dealId } : {}) });
  return useQuery({ queryKey: [...keys.activity(dealId), limit], queryFn: () => api.get<Activity[]>(`/activity?${qs}`), ...LIVE });
}

export function useNotes(dealId: string) {
  return useQuery({ queryKey: keys.notes(dealId), queryFn: () => api.get<Note[]>(`/notes?dealId=${dealId}`) });
}

export function useDocuments(dealId?: string) {
  return useQuery({
    queryKey: keys.documents(dealId),
    queryFn: () => api.get<DocumentMeta[]>(dealId ? `/documents?dealId=${dealId}` : '/documents'),
  });
}

function useInvalidateDealData() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: keys.deals });
    qc.invalidateQueries({ queryKey: ['activity'] });
    qc.invalidateQueries({ queryKey: keys.stageHistory });
  };
}

export function useCreateDeal() {
  const invalidate = useInvalidateDealData();
  return useMutation({ mutationFn: (input: DealInput) => api.post<Deal>('/deals', input), onSuccess: invalidate });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  const invalidate = useInvalidateDealData();
  return useMutation({
    mutationFn: ({ id, ...input }: DealInput & { id: string }) => api.patch<Deal>(`/deals/${id}`, input),
    onMutate: async ({ id, ...input }) => {
      await qc.cancelQueries({ queryKey: keys.deals });
      const previous = qc.getQueryData<Deal[]>(keys.deals);
      qc.setQueryData<Deal[]>(keys.deals, (deals) => deals?.map((d) => (d.id === id ? { ...d, ...input } : d)));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(keys.deals, ctx.previous);
    },
    onSettled: invalidate,
  });
}

export function useDeleteDeal() {
  const invalidate = useInvalidateDealData();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/deals/${id}`),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function useCreateNote(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.post<Note>('/notes', { dealId, body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.notes(dealId) });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useDeleteNote(dealId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notes(dealId) }),
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, dealId, docType }: { file: File; dealId: string; docType: string }) => {
      const form = new FormData();
      form.append('dealId', dealId);
      form.append('docType', docType);
      form.append('file', file);
      return api.post<DocumentMeta>('/documents', form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

type MemberInput = { displayName: string; role?: string | null; email?: string | null };

export function useSaveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: MemberInput & { id?: string }) =>
      id ? api.patch<Member>(`/members/${id}`, input) : api.post<Member>('/members', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/members/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.members });
      qc.invalidateQueries({ queryKey: keys.deals });
    },
  });
}
