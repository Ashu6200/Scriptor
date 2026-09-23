export { DpdpService, dpdpService } from "./dpdp.service";
export {
  createPolicySchema,
  updatePolicySchema,
  createPolicyVersionSchema,
  listPoliciesSchema,
  grantConsentSchema,
  listUserConsentHistorySchema,
  listAdminConsentsSchema,
  listDpdpAuditLogsSchema,
} from "./dpdp.schema";
export type {
  CreatePolicyInput,
  UpdatePolicyInput,
  CreatePolicyVersionInput,
  ListPoliciesQuery,
  GrantConsentInput,
  ListUserConsentHistoryQuery,
  ListAdminConsentsQuery,
  ListDpdpAuditLogsQuery,
} from "./dpdp.schema";
