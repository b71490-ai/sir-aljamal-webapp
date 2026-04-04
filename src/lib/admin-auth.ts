import "server-only";

import crypto from "node:crypto";

const ADMIN_SESSION_COOKIE = "sir_aljamal_admin_session";
const ADMIN_ROLES = ["owner", "staff", "support"] as const;
const RUNTIME_SESSION_SECRET = crypto.randomBytes(48).toString("hex");

export type AdminSessionRole = (typeof ADMIN_ROLES)[number];

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || RUNTIME_SESSION_SECRET;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function isAdminSessionRole(value: string): value is AdminSessionRole {
  return ADMIN_ROLES.includes(value as AdminSessionRole);
}

function createRoleSignature(adminPin: string, role: AdminSessionRole) {
  return sign(`admin:${adminPin}:${role}`);
}

export function createAdminSessionToken(adminPin: string, role: AdminSessionRole) {
  const signature = createRoleSignature(adminPin, role);
  return `v1:${role}:${signature}`;
}

export function readAdminSessionRole(token: string | undefined, adminPin: string): AdminSessionRole | null {
  if (!token) {
    return null;
  }

  const [version, role, signature] = token.split(":");
  if (version !== "v1" || !role || !signature || !isAdminSessionRole(role)) {
    return null;
  }

  const expected = createRoleSignature(adminPin, role);
  if (signature.length !== expected.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  return isValid ? role : null;
}

export function verifyAdminSessionToken(token: string | undefined, adminPin: string) {
  return Boolean(readAdminSessionRole(token, adminPin));
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}
