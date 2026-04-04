import { z } from "zod";

const paymentMethodSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(120),
  provider: z.string().max(120),
  accountName: z.string().max(120),
  accountNumber: z.string().max(80),
  instructions: z.string().max(1000),
  isEnabled: z.boolean(),
});

const adminUserSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  username: z.string().min(2).max(80),
  pin: z.string().min(4).max(32),
  role: z.enum(["owner", "staff", "support"]),
  isEnabled: z.boolean(),
  lastLoginAt: z.string().max(80).optional(),
});

export const settingsPatchSchema = z.object({
  whatsappNumber: z.string().max(30).optional(),
  supportEmail: z.string().email().max(160).optional(),
  brandLogoPath: z.string().max(600000).optional(),
  footerContactTitle: z.string().max(120).optional(),
  workingHoursLabel: z.string().max(220).optional(),
  currencyCode: z.enum(["SAR", "YER", "USD"]).optional(),
  currencySymbol: z.string().max(8).optional(),
  lowStockThreshold: z.number().int().min(1).max(10000).optional(),
  smartMode: z.boolean().optional(),
  adminPin: z.string().min(4).max(32).optional(),
  walletName: z.string().max(120).optional(),
  walletAccountNumber: z.string().max(80).optional(),
  paymentMethods: z.array(paymentMethodSchema).max(20).optional(),
  adminUsers: z.array(adminUserSchema).max(30).optional(),
}).strict();

const snapshotListSchema = z.array(z.record(z.string(), z.unknown())).max(10000);

export const adminStatePutPayloadSchema = z.object({
  baseRevision: z.number().int().min(0),
  products: snapshotListSchema.optional(),
  offers: snapshotListSchema.optional(),
  orders: snapshotListSchema.optional(),
  leads: snapshotListSchema.optional(),
  settings: settingsPatchSchema.optional(),
  auditLogs: snapshotListSchema.optional(),
}).strict();

export type AdminStatePutPayload = z.infer<typeof adminStatePutPayloadSchema>;
