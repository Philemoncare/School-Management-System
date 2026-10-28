import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Authenticates the request when a valid token is present but never rejects it.
 *
 * Sign-out must be able to clear the `auth_token` cookie even when that cookie
 * is expired, its session was revoked, or its user was disabled. Using the
 * regular guard there returns 401 before the handler runs, so the stale cookie
 * survives - and the frontend middleware keeps bouncing the browser between
 * /login and the app. This guard lets logout always reach its handler.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser = any>(_err: unknown, user: TUser | false): TUser | null {
    return (user || null) as TUser | null;
  }
}
