# School Registration

## Endpoint

`POST /api/v1/auth/school/register`

This is the only public school-registration endpoint. The former
`/auth/register-school` and `/auth/schools/register` aliases have been removed.

The endpoint is public, rate-limited, and does not issue a session. A new
administrator must verify their email with a 5-digit code before signing in
unless verification is explicitly disabled in a non-production environment.

## Request

```json
{
  "school": {
    "name": "Accra Model Academy",
    "type": "Basic School (Primary & JHS)",
    "country": "Ghana",
    "region": "Greater Accra",
    "city": "Accra",
    "district": "Accra Metropolitan",
    "address": "12 Independence Avenue",
    "phone": "+233 20 000 0000",
    "email": "office@example.edu.gh"
  },
  "admin": {
    "fullName": "Ama Mensah",
    "email": "ama@example.edu.gh",
    "password": "StrongPass!2345"
  },
  "consentToTerms": true
}
```

- `school.name`, `school.type`, `school.country`, `school.region`,
  `school.city`, `admin.fullName`, `admin.email`, and `admin.password` are
  required.
- `school.district`, `school.address`, `school.phone`, and `school.email` are
  optional.
- `consentToTerms` must be `true`.
- Passwords must be 12–128 characters and include uppercase, lowercase, a
  number, and a special character.
- Registration cannot assign `SUPER_ADMIN` or any role other than
  `SCHOOL_ADMIN` to the registering administrator.

Supported school types:

- Basic School (Primary & JHS)
- Primary School Only
- Junior High School (JHS)
- Senior High School (SHS)
- TVET / Technical & Vocational
- Nursery / Preschool / Kindergarten
- International / Private School

## Success response

`201 Created`

```json
{
  "success": true,
  "message": "School workspace created. Enter the 5-digit code sent to the administrator email.",
  "requiresVerification": true,
  "emailSent": true,
  "emailDelivery": "sent",
  "verificationCodeLength": 5,
  "verificationExpiresInSeconds": 300,
  "school": {
    "id": "uuid",
    "name": "Accra Model Academy",
    "code": "AMA1",
    "slug": "accra-model-academy",
    "email": "office@example.edu.gh",
    "status": "ACTIVE"
  },
  "administrator": {
    "id": "uuid",
    "fullName": "Ama Mensah",
    "firstName": "Ama",
    "lastName": "Mensah",
    "email": "ama@example.edu.gh",
    "role": "SCHOOL_ADMIN",
    "accountState": "PENDING_VERIFICATION"
  }
}
```

The 5-digit verification code is never included in the response, logs, or
database. Only a SHA-256 hash of `EMAIL_VERIFICATION:<userId>:<code>` is stored.

`emailDelivery` is one of `sent`, `pending`, `failed`, or `skipped`. The
registration response waits at most four seconds for the email provider. A
`pending` result means the workspace is created and the verification email is
still being delivered; clients should offer resend verification rather than
repeating registration. A `failed` result also means the workspace exists; the
client should offer resend or contact support.

## Verification

`POST /api/v1/auth/verify-email`

```json
{
  "email": "ama@example.edu.gh",
  "code": "12345"
}
```

A successful verification activates the administrator account, records
`emailVerified`, consumes the code, and returns:

```json
{
  "success": true,
  "message": "Email verified successfully. You can now sign in."
}
```

Codes are 5 digits, expire after 5 minutes, are single-use, and allow at most
five failed attempts. Requesting a new code invalidates the previous one.

`POST /api/v1/auth/resend-verification` accepts `{ "email": "..." }`. It returns
a generic response so it cannot be used to enumerate unverified accounts.

## Sign-in

Every sign-in uses a password plus a fresh 5-digit email code:

1. `POST /api/v1/auth/login` with `{ "email": "...", "password": "..." }`
   returns `201` with a challenge and no session:

   ```json
   {
     "otpRequired": true,
     "otp_token": "short-lived-jwt",
     "email": "ama@example.edu.gh",
     "emailSent": true,
     "emailDelivery": "sent",
     "codeLength": 5,
     "expiresInSeconds": 300
   }
   ```

2. `POST /api/v1/auth/login/otp` with `{ "otpToken": "...", "code": "12345" }`
   validates the code, creates the session, sets the `auth_token` HTTP-only
   cookie, and returns `access_token`, `session_token`, and the user profile.

3. `POST /api/v1/auth/login/resend` with `{ "otpToken": "..." }` issues a new
   5-digit code and challenge token.

Pending accounts receive `403` at the password step. Incorrect or expired codes
return `401`. Sign-in codes are single-use, expire after 5 minutes, and are
limited to five failed attempts. The `otp_token` expires after 10 minutes.
There is no email verification link.

## Transaction behavior

The following records are created in one database transaction:

- school and school settings;
- administrator user with an Argon2id password hash;
- ACTIVE school membership and `SCHOOL_ADMIN` assignment;
- standard non-user school roles;
- current academic year, three terms, and school-type class/section presets;
- hashed verification-code challenge when verification is required;
- audit event.

If any database step fails, the transaction rolls back. Email delivery happens
after commit and does not roll back a successfully created workspace.

## Errors

- `400 VALIDATION_ERROR`: missing or invalid fields, weak password, missing
  consent, or an incorrect/expired verification code.
- `401 UNAUTHORIZED`: incorrect, expired, locked, or replayed sign-in code.
- `403 FORBIDDEN`: pending, disabled, suspended, or locked account.
- `409 CONFLICT`: administrator email already exists, or a unique school
  identifier could not be allocated.
- `429`: rate limit exceeded.
- `503`: database unavailable.

## Configuration

- `SKIP_EMAIL_VERIFICATION`: `false` in development/production; `true` only for
  controlled non-production setup.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
  `EMAIL_FROM`: email delivery configuration. Never commit real credentials.
- `APP_URL` / `FRONTEND_URL`: application base URL for password-reset and
  invitation links. These links are separate from registration and sign-in
  verification codes.
