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
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import type { Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      deviceId: req.headers["x-device-id"],
    });

    if (result.access_token) {
      res.cookie("auth_token", result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 1000,
        path: "/",
      });
      delete result.access_token;
    }

    return result;
  }

  @Public()
  @Post("register-school")
  async registerSchool(@Body() dto: any) {
    return this.authService.registerSchool(dto);
  }

  @Public()
  @Post("verify-email")
  async verifyEmail(@Body("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @Post("forgot-password")
  async forgotPassword(@Body("email") email: string) {
    return this.authService.forgotPassword(email);
  }

  @Public()
  @Post("reset-password")
  async resetPassword(@Body() dto: any) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Get("invite/details")
  async getInviteDetails(@Query("token") token: string) {
    return this.authService.getInvitationDetails(token);
  }

  @Public()
  @Post("invite/accept")
  async acceptInvite(@Body() dto: any) {
    return this.authService.acceptInvitation(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getProfile(@Request() req) {
    return this.authService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Request() req, @Res({ passthrough: true }) res: Response) {
    res.clearCookie("auth_token", { path: "/" });
    return { success: true };
  }
}
