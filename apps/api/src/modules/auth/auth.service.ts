import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Profile } from 'passport-google-oauth20';
import { OrgRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../common/redis/redis.service';
import { slugify, parseExpiresIn } from '../../../common/utils/slug';
import { SignupDto } from './dto/auth.dto';
import type { AuthTokens, AuthUser, OrganizationSummary } from '@researchsoul/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private config: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user?.passwordHash) return null;
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;
    return { id: user.id, email: user.email, name: user.name };
  }

  async signup(dto: SignupDto): Promise<{ user: AuthUser; tokens: AuthTokens; organization: OrganizationSummary }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const orgName = dto.organizationName ?? `${dto.name ?? dto.email.split('@')[0]}'s Org`;
    const orgSlug = await this.uniqueOrgSlug(slugify(orgName));

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name ?? null,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: orgName,
          slug: orgSlug,
        },
      });

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: OrgRole.OWNER,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          organizationId: organization.id,
          name: 'Default',
          slug: 'default',
        },
      });

      return { user, organization, workspace };
    });

    const tokens = await this.createSession(result.user.id, result.user.email);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tokens,
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
        credits: Number(result.organization.credits),
        role: OrgRole.OWNER,
      },
    };
  }

  async login(user: { id: string; email: string; name: string | null }): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const tokens = await this.createSession(user.id, user.email);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      tokens,
    };
  }

  async logout(sessionId: string) {
    await this.redis.deleteSession(sessionId);
  }

  async findOrCreateGoogleUser(profile: Profile) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.id }, { email }],
      },
    });

    if (!user) {
      const orgName = `${profile.displayName ?? email.split('@')[0]}'s Org`;
      const orgSlug = await this.uniqueOrgSlug(slugify(orgName));

      user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            name: profile.displayName ?? null,
            googleId: profile.id,
          },
        });

        const organization = await tx.organization.create({
          data: { name: orgName, slug: orgSlug },
        });

        await tx.organizationMember.create({
          data: {
            userId: created.id,
            organizationId: organization.id,
            role: OrgRole.OWNER,
          },
        });

        await tx.workspace.create({
          data: {
            organizationId: organization.id,
            name: 'Default',
            slug: 'default',
          },
        });

        return created;
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
      });
    }

    return { id: user.id, email: user.email, name: user.name };
  }

  async getOrganizations(userId: string): Promise<OrganizationSummary[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: { organization: true },
    });

    return memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      credits: Number(m.organization.credits),
      role: m.role,
    }));
  }

  async createOrganization(userId: string, name: string): Promise<OrganizationSummary> {
    const orgSlug = await this.uniqueOrgSlug(slugify(name));

    const organization = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name, slug: orgSlug },
      });

      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: org.id,
          role: OrgRole.OWNER,
        },
      });

      await tx.workspace.create({
        data: {
          organizationId: org.id,
          name: 'Default',
          slug: 'default',
        },
      });

      return org;
    });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      credits: Number(organization.credits),
      role: OrgRole.OWNER,
    };
  }

  isGoogleOAuthEnabled(): boolean {
    return Boolean(
      this.config.get('GOOGLE_CLIENT_ID') &&
        this.config.get('GOOGLE_CLIENT_SECRET'),
    );
  }

  private async createSession(userId: string, email: string): Promise<AuthTokens> {
    const sessionId = uuidv4();
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
    const ttl = parseExpiresIn(expiresIn);

    await this.redis.setSession(sessionId, userId, ttl);

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, sessionId },
      { expiresIn },
    );

    return { accessToken, expiresIn };
  }

  private async uniqueOrgSlug(base: string): Promise<string> {
    let slug = base || 'org';
    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? slug : `${slug}-${suffix}`;
      const exists = await this.prisma.organization.findUnique({
        where: { slug: candidate },
      });
      if (!exists) return candidate;
      suffix += 1;
    }
  }
}
