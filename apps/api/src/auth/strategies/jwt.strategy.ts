import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { AccountState, SchoolStatus, SessionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  expandRoleAliases,
  isPlatformSuperAdmin,
  PLATFORM_ROLE_VALUES,
} from "../platform-roles";

const cookieExtractor = (req: any) => {
  const cookieHeader = req?.headers?.cookie ?? "";
  const tokenFromCookie = req?.cookies?.auth_token ?? null;

  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  const match = cookieHeader
    .split(";")
    .find((cookie: string) => cookie.trim().startsWith("auth_token="));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  return "development-only-insecure-secret";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid session");
    }

    if (!payload.sid) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    const session = await this.prisma.userSession.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });

    if (
      !session ||
      session.userId !== payload.sub ||
      session.status !== SessionStatus.ACTIVE ||
      session.expiresAt < new Date()
    ) {
      throw new UnauthorizedException("Session expired. Please sign in again.");
    }

    const user = session.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Your account is unavailable.");
    }

    const blockedStates: AccountState[] = [
      AccountState.DISABLED,
      AccountState.SUSPENDED,
      AccountState.LOCKED,
      AccountState.COMPROMISED,
    ];

    if (
      blockedStates.includes(user.accountState) ||
      (user.accountState === AccountState.PENDING_VERIFICATION &&
        process.env.SKIP_EMAIL_VERIFICATION !== "true")
    ) {
      throw new UnauthorizedException("Your account is unavailable. Please contact your administrator.");
    }

    const headerSchoolId =
      typeof request?.headers?.["x-school-id"] === "string"
        ? request.headers["x-school-id"]
        : undefined;

    // Roles are resolved from the database for the active school only. A role held
    // in one school must never grant access in another school. Global roles
    // (schoolId: null) are platform roles and are intentionally included.
    const roleRows = await this.prisma.userRole.findMany({
      where: {
        userId: user.id,
        ...(headerSchoolId
          ? { OR: [{ schoolId: headerSchoolId }, { schoolId: null }] }
          : { schoolId: null }),
      },
      include: { role: { select: { name: true } } },
    });

    const persistedRoles = roleRows.map((row) => row.role.name);
    const roles = new Set(expandRoleAliases(persistedRoles));

    // SCHOOL_ADMIN is the persisted school-level administrator role. Some
    // endpoints use the shorter ADMIN label, so expose it as an alias rather
    // than weakening those endpoint checks.
    if (roles.has("SCHOOL_ADMIN")) {
      roles.add("ADMIN");
    }

    const resolvedRoles = Array.from(roles);
    const platformSuperAdmin = isPlatformSuperAdmin(resolvedRoles);

    if (headerSchoolId && !platformSuperAdmin) {
      const school = await this.prisma.school.findUnique({
        where: { id: headerSchoolId },
        select: { status: true },
      });
      const blockedSchoolStatuses: SchoolStatus[] = [
        SchoolStatus.SUSPENDED,
        SchoolStatus.DEACTIVATED,
        SchoolStatus.REJECTED,
        SchoolStatus.EXPIRED,
      ];

      if (!school) {
        throw new ForbiddenException("School workspace not found");
      }
      if (blockedSchoolStatuses.includes(school.status)) {
        throw new ForbiddenException(
          "This school workspace is not available. Please contact your school administrator.",
        );
      }
    }

    const rolePriority = [
      ...PLATFORM_ROLE_VALUES,
      "SUPER_ADMIN",
      "SCHOOL_ADMIN",
      "ADMIN",
      "PRINCIPAL",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "PARENT",
    ];
    const primaryRole =
      rolePriority.find((role) => roles.has(role)) ?? resolvedRoles[0];

    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      schoolId: headerSchoolId,
      roles: resolvedRoles,
      role: primaryRole,
      isPlatformAdmin: resolvedRoles.some((role) =>
        (PLATFORM_ROLE_VALUES as string[]).includes(role),
      ),
      sessionId: session.id,
    };
  }
}
