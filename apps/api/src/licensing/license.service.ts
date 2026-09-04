import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { verifyLicense, type SignedLicense } from '@hrm/licensing';

@Injectable()
export class LicenseService {
  async activate(organizationId: string, signed: SignedLicense, publicKeyPem: string) {
    const result = verifyLicense(signed, publicKeyPem);
    if (!result.valid) throw new BadRequestException(`License validation failed: ${result.reason}`);

    if (result.license.organizationId && result.license.organizationId !== organizationId) {
      throw new UnauthorizedException('License is not assigned to this organization');
    }

    if (result.license.deployment !== 'CLOUD' && result.license.deployment !== 'SELF_HOSTED') {
      throw new BadRequestException('Unsupported deployment mode');
    }

    const existing = await prisma.license.findUnique({ where: { licenseId: result.license.licenseId } });
    if (existing && existing.organizationId !== organizationId) {
      throw new UnauthorizedException('License is already assigned to another organization');
    }

    return prisma.license.upsert({
      where: { licenseId: result.license.licenseId },
      create: {
        organizationId,
        licenseId: result.license.licenseId,
        keyId: signed.keyId,
        status: 'ACTIVE',
        edition: result.license.edition,
        deployment: result.license.deployment,
        issuedAt: new Date(result.license.issuedAt),
        expiresAt: new Date(result.license.expiresAt),
        maxHrUsers: result.license.maxHrUsers,
        maxEmployees: result.license.maxEmployees,
        entitlements: result.license.entitlements,
        payload: signed.payload,
        signature: signed.signature,
      },
      update: {
        keyId: signed.keyId,
        status: 'ACTIVE',
        expiresAt: new Date(result.license.expiresAt),
        maxHrUsers: result.license.maxHrUsers,
        maxEmployees: result.license.maxEmployees,
        entitlements: result.license.entitlements,
        payload: signed.payload,
        signature: signed.signature,
      },
    });
  }

  async getActive(organizationId: string) {
    return prisma.license.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'desc' },
    });
  }
}
