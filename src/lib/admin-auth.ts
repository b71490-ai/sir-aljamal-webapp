import "server-only";

import crypto from "node:crypto";

const ADMIN_SESSION_COOKIE = "sir_aljamal_admin_session";
const ADMIN_ROLES = ["owner", "staff", "support"] as const;
const RUNTIME_SESSION_SECRET = crypto.randomBytes(48).toString("hex");

export type AdminSessionRole = (typeof ADMIN_ROLES)[number];

type TokenParts = {
  role: AdminSessionRole;
  signature: string;
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || RUNTIME_SESSION_SECRET;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

export function isAdminSessionRole(value: string): value is AdminSessionRole {
  return ADMIN_ROLES.includes(value as AdminSessionRole);
}

function parseToken(token: string | undefined): TokenParts | null {
  if (!token) {
    return null;
  }

  const [version, role, signature] = token.split(":");
  if (version !== "v1" || !role || !signature || !isAdminSessionRole(role)) {
    return null;
  }

  return {
    role,
    signature,
  };
}

function createRoleSignature(adminPin: string, role: AdminSessionRole) {
  return sign(`admin:${adminPin}:${role}`);
}

export function createAdminSessionToken(adminPin: string, role: AdminSessionRole) {
  const signature = createRoleSignature(adminPin, role);
  return `v1:${role}:${signature}`;
}

export function readAdminSessionRole(token: string | undefined, adminPin: string): AdminSessionRole | null {
  const parsed = parseToken(token);
  if (!parsed) {
    return null;
  }

  const expected = createRoleSignature(adminPin, parsed.role);
  if (parsed.signature.length !== expected.length) {
    return null;
  }

  const isValid = crypto.timingSafeEqual(Buffer.from(parsed.signature), Buffer.from(expected));
  return isValid ? parsed.role : null;
}

export function readAdminSessionRoleByPins(token: string | undefined, pins: string[]): AdminSessionRole | null {
  const parsed = parseToken(token);
  if (!parsed || !Array.isArray(pins) || pins.length === 0) {
    return null;
  }

  for (const pin of pins) {
    const expected = createRoleSignature(pin, parsed.role);
    if (parsed.signature.length !== expected.length) {
      continue;
    }

    const isValid = crypto.timingSafeEqual(Buffer.from(parsed.signature), Buffer.from(expected));
    if (isValid) {
      return parsed.role;
    }
  }

  return null;
}

export function verifyAdminSessionToken(token: string | undefined, adminPin: string) {
  return Boolean(readAdminSessionRole(token, adminPin));
}

export function verifyAdminSessionTokenByPins(token: string | undefined, pins: string[]) {
  return Boolean(readAdminSessionRoleByPins(token, pins));
}

export function getAdminSessionCookieName() {
  return ADMIN_SESSION_COOKIE;
}
