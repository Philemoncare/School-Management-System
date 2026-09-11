# Authentication Architecture

## Overview
The platform uses a centralized JWT-based authentication system.

## Flow
1. **Login:** User provides email and password via `POST /auth/login`.
2. **Verification:** The `AuthService` validates the user against the database and verifies the password hash using **Argon2id**.
3. **Token Generation:** Upon successful validation, a short-lived **JWT Access Token** is generated containing user identity and platform roles.
4. **Session:** The token is sent to the client. Subsequent requests must include this token in the `Authorization: Bearer <token>` header.

## Security Controls
- **Argon2id Hashing:** Industry-standard protection against brute-force and rainbow table attacks.
- **Generic Errors:** Authentication failures do not reveal whether the email exists.
- **Rate Limiting:** Protects against credential stuffing and brute-force attacks.
- **Account States:** Suspended or disabled accounts are immediately blocked from authenticating.
- **Audit Logging:** Every successful and failed login is recorded.
