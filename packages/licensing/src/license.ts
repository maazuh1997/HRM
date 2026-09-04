import { createPublicKey, verify } from 'node:crypto';

export type LicenseEdition = 'SOLO' | 'COMPANY';
export type DeploymentMode = 'CLOUD' | 'SELF_HOSTED';

export type LicensePayload = {
  licenseId: string;
  organizationId?: string;
  edition: LicenseEdition;
  deployment: DeploymentMode;
  issuedAt: string;
  expiresAt: string;
  maxHrUsers: number;
  maxEmployees: number;
  entitlements: string[];
};

export type SignedLicense = {
  payload: string;
  signature: string;
  keyId: string;
};

export type LicenseVerificationResult =
  | { valid: true; license: LicensePayload }
  | { valid: false; reason: string };

export function verifyLicense(
  signed: SignedLicense,
  publicKeyPem: string,
  now = new Date(),
): LicenseVerificationResult {
  try {
    const validSignature = verify(
      null,
      Buffer.from(signed.payload, 'utf8'),
      createPublicKey(publicKeyPem),
      Buffer.from(signed.signature, 'base64url'),
    );

    if (!validSignature) return { valid: false, reason: 'INVALID_SIGNATURE' };

    const license = JSON.parse(signed.payload) as LicensePayload;
    if (!license.licenseId || !license.issuedAt || !license.expiresAt) {
      return { valid: false, reason: 'INVALID_PAYLOAD' };
    }

    const issuedAt = new Date(license.issuedAt);
    const expiresAt = new Date(license.expiresAt);
    if (Number.isNaN(issuedAt.valueOf()) || Number.isNaN(expiresAt.valueOf()) || expiresAt <= issuedAt) {
      return { valid: false, reason: 'INVALID_DATES' };
    }

    if (now < issuedAt) return { valid: false, reason: 'NOT_YET_ACTIVE' };
    if (now >= expiresAt) return { valid: false, reason: 'EXPIRED' };
    if (!Number.isInteger(license.maxHrUsers) || license.maxHrUsers < 1) {
      return { valid: false, reason: 'INVALID_HR_USER_LIMIT' };
    }
    if (!Number.isInteger(license.maxEmployees) || license.maxEmployees < 1) {
      return { valid: false, reason: 'INVALID_EMPLOYEE_LIMIT' };
    }

    return { valid: true, license };
  } catch {
    return { valid: false, reason: 'INVALID_LICENSE' };
  }
}
