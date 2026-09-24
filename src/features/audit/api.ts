import { api } from "@/store/api";

export interface AuditBlockIntegrity {
  algorithm: "SHA-256-CHAIN";
  sequence: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  payloadChecksum: string;
}

export interface VerificationResult {
  valid: boolean;
  totalLogs: number;
  verifiedCount: number;
  latestHash?: string;
  genesisHash?: string;
  compromisedAtId?: string;
  compromisedSequence?: number;
  error?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actor?: {
    id: string;
    name: string | null;
    email: string;
  };
  resourceId?: string | null;
  resourceType: string;
  workspaceId?: string | null;
  details?: {
    _integrity?: AuditBlockIntegrity;
    [key: string]: unknown;
  } | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export const auditApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      { data: AuditLog[]; meta: { total: number } },
      { workspaceId: string; page?: number; limit?: number; action?: string; resourceType?: string }
    >({
      query: ({ workspaceId, ...params }) => ({
        url: `/workspaces/${workspaceId}/audit`,
        params,
      }),
      providesTags: (result, error, { workspaceId }) => [
        { type: "Audit", id: `LIST-${workspaceId}` },
      ],
    }),
    verifyAuditChain: builder.query<VerificationResult, string>({
      query: (workspaceId) => `/workspaces/${workspaceId}/audit/verify`,
    }),
  }),
});

export const { useGetAuditLogsQuery, useVerifyAuditChainQuery, useLazyVerifyAuditChainQuery } =
  auditApi;
