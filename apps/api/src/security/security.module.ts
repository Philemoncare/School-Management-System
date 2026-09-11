import { Module, Global } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { MfaService } from './services/mfa.service';
import { SecurityRiskService } from './services/security-risk.service';
import { SecurityEventService } from './services/security-event.service';
import { SecurityPolicyService } from './services/security-policy.service';
import { ResourceAuthorizationService } from './services/resource-authorization.service';
import { SecurityIncidentService } from './services/security-incident.service';
import { PrivacyService } from './services/privacy.service';
import { ImpersonationService } from './services/impersonation.service';
import { FileSecurityService } from './services/file-security.service';
import { EncryptionService } from './services/encryption.service';
import { SecurityController } from './controllers/security.controller';

@Global()
@Module({
  providers: [
    SessionService,
    MfaService,
    SecurityRiskService,
    SecurityEventService,
    SecurityPolicyService,
    ResourceAuthorizationService,
    SecurityIncidentService,
    PrivacyService,
    ImpersonationService,
    FileSecurityService,
    EncryptionService,
  ],
  controllers: [SecurityController],
  exports: [
    SessionService,
    MfaService,
    SecurityRiskService,
    SecurityEventService,
    SecurityPolicyService,
    ResourceAuthorizationService,
    SecurityIncidentService,
    PrivacyService,
    ImpersonationService,
    FileSecurityService,
    EncryptionService,
  ],
})
export class SecurityModule {}
