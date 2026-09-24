import { api } from "@/store/api";

// ─── Types ──────────────────────────────────────────────────────────────

export interface DpdpPolicyVersion {
  id: string;
  policyId: string;
  version: number;
  purpose: string;
  dataCategories: string[];
  processingDescription: string;
  retentionPeriod: string | null;
  consentRequired: boolean;
  content: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  createdAt: string;
  createdBy: string;
  publishedAt: string | null;
}

export interface DpdpPolicy {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  versions: DpdpPolicyVersion[];
}

export interface DpdpConsentEvent {
  id: string;
  userId: string;
  policyId: string;
  policyVersionId: string;
  purpose: string;
  status: "GRANTED" | "REJECTED" | "WITHDRAWN" | "PENDING";
  consentMethod: string;
  source: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: { id: string; email: string; name: string | null };
  policy?: { id: string; key: string; name: string };
  policyVersion?: { id: string; version: number; purpose: string };
}

export interface DpdpAuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface UserConsentState {
  [policyKey: string]: {
    policyId: string;
    policyName: string;
    policyKey: string;
    status: string;
    policyVersion: number | null;
    consentRequired: boolean;
    consentedAt: string | null;
    withdrawnAt: string | null;
    purpose: string | null;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ─── API Endpoints ──────────────────────────────────────────────────────

export const dpdpApi = api.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // ── Policy CRUD ─────────────────────────────────────────────────
    listPolicies: builder.query<
      PaginatedResponse<DpdpPolicy>,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: (params) => ({ url: "/policies", params }),
      providesTags: [{ type: "Dpdp", id: "POLICIES" }],
    }),

    getPolicy: builder.query<DpdpPolicy, string>({
      query: (id) => `/policies/${id}`,
      providesTags: (_res, _err, id) => [{ type: "Dpdp", id }],
    }),

    createPolicy: builder.mutation<DpdpPolicy, Record<string, unknown>>({
      query: (body) => ({ url: "/policies", method: "POST", body }),
      invalidatesTags: [{ type: "Dpdp", id: "POLICIES" }],
    }),

    updatePolicy: builder.mutation<DpdpPolicy, { id: string; data: Record<string, unknown> }>({
      query: ({ id, data }) => ({ url: `/policies/${id}`, method: "PATCH", body: data }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Dpdp", id: "POLICIES" },
        { type: "Dpdp", id },
      ],
    }),

    deletePolicy: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/policies/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Dpdp", id: "POLICIES" }],
    }),

    // ── Policy Versions ─────────────────────────────────────────────
    getPolicyVersions: builder.query<{ policy: DpdpPolicy; versions: DpdpPolicyVersion[] }, string>(
      {
        query: (id) => `/policies/${id}/versions`,
        providesTags: (_res, _err, id) => [{ type: "Dpdp", id: `VERSIONS_${id}` }],
      }
    ),

    createPolicyVersion: builder.mutation<
      DpdpPolicyVersion,
      { policyId: string; data: Record<string, unknown> }
    >({
      query: ({ policyId, data }) => ({
        url: `/policies/${policyId}/versions`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_res, _err, { policyId }) => [
        { type: "Dpdp", id: "POLICIES" },
        { type: "Dpdp", id: policyId },
        { type: "Dpdp", id: `VERSIONS_${policyId}` },
      ],
    }),

    publishPolicy: builder.mutation<DpdpPolicyVersion, string>({
      query: (policyId) => ({ url: `/policies/${policyId}/publish`, method: "POST" }),
      invalidatesTags: (_res, _err, policyId) => [
        { type: "Dpdp", id: "POLICIES" },
        { type: "Dpdp", id: policyId },
        { type: "Dpdp", id: `VERSIONS_${policyId}` },
        { type: "Dpdp", id: "ACTIVE_POLICIES" },
      ],
    }),

    archivePolicy: builder.mutation<DpdpPolicy, string>({
      query: (policyId) => ({ url: `/policies/${policyId}/archive`, method: "POST" }),
      invalidatesTags: (_res, _err, policyId) => [
        { type: "Dpdp", id: "POLICIES" },
        { type: "Dpdp", id: policyId },
        { type: "Dpdp", id: "ACTIVE_POLICIES" },
      ],
    }),

    // ── Active Policies (for consent screen) ────────────────────────
    getActivePolicies: builder.query<DpdpPolicy[], void>({
      query: () => "/policies/active",
      providesTags: [{ type: "Dpdp", id: "ACTIVE_POLICIES" }],
    }),

    // ── User Consent ────────────────────────────────────────────────
    getUserConsents: builder.query<UserConsentState, void>({
      query: () => "/me/consents",
      providesTags: [{ type: "Dpdp", id: "MY_CONSENTS" }],
    }),

    recordConsent: builder.mutation<
      DpdpConsentEvent,
      {
        policyId: string;
        policyVersionId: string;
        status: "GRANTED" | "REJECTED";
        consentMethod?: string;
        source?: string;
      }
    >({
      query: (body) => ({ url: "/me/consents", method: "POST", body }),
      invalidatesTags: [
        { type: "Dpdp", id: "MY_CONSENTS" },
        { type: "Dpdp", id: "MY_HISTORY" },
      ],
    }),

    withdrawConsent: builder.mutation<DpdpConsentEvent, string>({
      query: (policyId) => ({
        url: `/me/consents/${policyId}/withdraw`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "Dpdp", id: "MY_CONSENTS" },
        { type: "Dpdp", id: "MY_HISTORY" },
      ],
    }),

    getUserConsentHistory: builder.query<
      PaginatedResponse<DpdpConsentEvent>,
      {
        page?: number;
        limit?: number;
        status?: string;
        from?: string;
        to?: string;
        search?: string;
      }
    >({
      query: (params) => ({ url: "/me/consents/history", params }),
      providesTags: [{ type: "Dpdp", id: "MY_HISTORY" }],
    }),

    // ── Admin Consent ───────────────────────────────────────────────
    searchAdminConsents: builder.query<
      PaginatedResponse<DpdpConsentEvent>,
      {
        page?: number;
        limit?: number;
        userId?: string;
        policyId?: string;
        status?: string;
        from?: string;
        to?: string;
        search?: string;
      }
    >({
      query: (params) => ({ url: "/admin/consents", params }),
      providesTags: [{ type: "Dpdp", id: "ADMIN_CONSENTS" }],
    }),

    getAdminUserConsents: builder.query<
      { user: { id: string; email: string; name: string | null }; events: DpdpConsentEvent[] },
      string
    >({
      query: (userId) => `/admin/consents/${userId}`,
      providesTags: (_res, _err, userId) => [{ type: "Dpdp", id: `ADMIN_CONSENTS_${userId}` }],
    }),

    // ── DPDP Audit Log ──────────────────────────────────────────────
    getDpdpAuditLogs: builder.query<
      PaginatedResponse<DpdpAuditLogEntry>,
      {
        page?: number;
        limit?: number;
        action?: string;
        entityType?: string;
        entityId?: string;
        actorId?: string;
      }
    >({
      query: (params) => ({ url: "/admin/dpdp-audit", params }),
      providesTags: [{ type: "Dpdp", id: "AUDIT" }],
    }),
  }),
});

export const {
  useListPoliciesQuery,
  useGetPolicyQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
  useGetPolicyVersionsQuery,
  useCreatePolicyVersionMutation,
  usePublishPolicyMutation,
  useArchivePolicyMutation,
  useGetActivePoliciesQuery,
  useGetUserConsentsQuery,
  useRecordConsentMutation,
  useWithdrawConsentMutation,
  useGetUserConsentHistoryQuery,
  useSearchAdminConsentsQuery,
  useGetAdminUserConsentsQuery,
  useGetDpdpAuditLogsQuery,
} = dpdpApi;
