import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/, {
    message: 'Password must contain uppercase, lowercase, numbers and special characters',
  })
  password: string;
}

export class VerifyEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @Matches(/^\d{5}$/, { message: 'Verification code must be 5 digits' })
  code: string;
}

export class AcceptInviteDto {
  @IsString()
  @IsNotEmpty({ message: 'Invitation token is required' })
  token: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/, {
    message: 'Password must contain uppercase, lowercase, numbers and special characters',
  })
  password: string;
}

export class LoginOtpDto {
  @IsString()
  @IsNotEmpty()
  otpToken: string;

  @IsString()
  @Matches(/^\d{5}$/, { message: 'Sign-in code must be 5 digits' })
  code: string;
}

export class ResendLoginOtpDto {
  @IsString()
  @IsNotEmpty()
  otpToken: string;
}
