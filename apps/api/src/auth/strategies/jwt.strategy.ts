import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";

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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "fallback-secret",
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
      sessionId: payload.sid,
    };
  }
}
