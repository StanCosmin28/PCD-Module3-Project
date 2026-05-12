import { z } from "zod/v4";

export const AuditEntrySchema = z.object({
    timestamp: z.string().optional(),
    user: z.string().optional(),
    action: z.string().optional(),
    method: z.string().optional(),
    path: z.string().optional(),
});

export type AuditEntry = z.infer<typeof AuditEntrySchema>;

export const AuditLogSchema = z.array(AuditEntrySchema);
