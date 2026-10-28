import { Module } from '@nestjs/common';
import { GuardiansService } from './guardians.service';
import { GuardiansController } from './guardians.controller';
import { GuardianAccessService } from './guardian-access.service';

@Module({
  controllers: [GuardiansController],
  providers: [GuardiansService, GuardianAccessService],
  exports: [GuardiansService, GuardianAccessService],
})
export class GuardiansModule {}
