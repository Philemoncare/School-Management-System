import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  Query,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "./guards/optional-jwt-auth.guard";
import { AuthService } from "./auth.service";
import { SchoolRegistrationService } from "./school-registration.service";
import { Public } from "./decorators/public.decorator";
import type { Response } from "express";
import { RegisterSchoolRequestDto } from "./dto/register-school.dto";
import { SessionService } from "../security/services/session.service";
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  AcceptInviteDto,
  LoginOtpDto,
  ResendLoginOtpDto,
} from "./dto/auth-requests.dto";

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly schoolRegistration: SchoolRegistrationService,
    private readonly sessionService: SessionService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("login")
  async login(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: any = await this.authService.login(req.user, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceId: req.headers["x-device-id"],
    });

    if (result.access_token) {
      this.setAuthCookie(req, res, result.access_token);
    }

    return result;
  }

  private setAuthCookie(req: any, res: Response, token: string) {
    const isSecure =
      req.secure || req.headers["x-forwarded-proto"] === "https";

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
      path: "/",
    });
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("school/login")
  async loginSchool(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.login(req, res);
  }

  @Public()
  @Post("login/otp")
  async loginOtp(
    @Body() dto: LoginOtpDto,
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result: any = await this.authService.verifyLoginOtp(
      dto.otpToken,
      dto.code,
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        deviceId: req.headers["x-device-id"],
      },
    );

    this.setAuthCookie(req, res, result.access_token);

    return result;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login/resend")
  async resendLoginOtp(
    @Body() dto: ResendLoginOtpDto,
    @Request() req: any,
  ) {
    return this.authService.resendLoginOtp(dto.otpToken, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceId: req.headers["x-device-id"],
    }, dto.channel);
  }

  /**
   * Canonical public school-registration endpoint.
   *
   * Creates the school, its SCHOOL_ADMIN account, tenant membership and initial
   * academic setup in one transaction. The account remains pending verification
   * unless SKIP_EMAIL_VERIFICATION is explicitly enabled outside production.
   */
  @Public()
  @Post("school/register")
  async registerSchool(@Body() dto: RegisterSchoolRequestDto) {
    return this.schoolRegistration.register(dto);
  }

  @Public()
  @Post("verify-email")
  async verifyEmail(@Body() dto: VerifyEmailDto, @Request() req: any) {
    return this.authService.verifyEmail(dto.email, dto.code, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
  }

  @Public()
  @Post("resend-verification")
  async resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Get("invite/details")
  async getInviteDetails(@Query("token") token: string) {
    return this.authService.getInvitationDetails(token);
  }

  @Public()
  @Post("invite/accept")
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvitation(dto.token, dto.password, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @Get("me")
  async getProfile(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Post("logout")
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    if (req.user?.sessionId) {
      try {
        await this.sessionService.revokeSession(req.user.sessionId, "USER_LOGOUT");
      } catch {
        // The session may already be expired or revoked.
      }
    }

    // Always clear the cookie, even when the token was already invalid. Otherwise
    // the browser keeps sending a dead cookie and cannot leave the app.
    res.clearCookie("auth_token", { path: "/" });
    return { success: true };
  }
}
