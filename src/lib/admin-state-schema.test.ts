import { describe, expect, it } from "vitest";
import { adminStatePutPayloadSchema } from "./admin-state-schema";

describe("adminStatePutPayloadSchema", () => {
  it("accepts a valid minimal payload", () => {
    const parsed = adminStatePutPayloadSchema.safeParse({
      baseRevision: 5,
      settings: {
        supportEmail: "support@example.com",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid payload", () => {
    const parsed = adminStatePutPayloadSchema.safeParse({
      baseRevision: "5",
      settings: {
        supportEmail: "not-an-email",
      },
    });

    expect(parsed.success).toBe(false);
  });
});
