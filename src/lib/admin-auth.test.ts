import { beforeEach, describe, expect, it } from "vitest";
import {
  createAdminSessionToken,
  readAdminSessionRole,
  verifyAdminSessionToken,
} from "./admin-auth";

describe("admin auth", () => {
  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = "test-secret-for-vitest";
  });

  it("creates a valid session token for a role", () => {
    const token = createAdminSessionToken("1234", "owner");
    expect(verifyAdminSessionToken(token, "1234")).toBe(true);
    expect(readAdminSessionRole(token, "1234")).toBe("owner");
  });

  it("rejects token when pin changes", () => {
    const token = createAdminSessionToken("1234", "staff");
    expect(verifyAdminSessionToken(token, "9876")).toBe(false);
    expect(readAdminSessionRole(token, "9876")).toBeNull();
  });
});
