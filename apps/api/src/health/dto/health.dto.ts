import { IsString, IsOptional, IsEnum, IsDate, IsNumber, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { HealthSeverity, ClinicAppointmentStatus } from '@prisma/client';

export class UpdateHealthProfileDto {
  @IsString() @IsOptional() bloodGroup?: string;
  @IsString() @IsOptional() preferredHospital?: string;
  @IsString() @IsOptional() emergencyInstructions?: string;
  @IsBoolean() @IsOptional() consentStatus?: boolean;
}

export class CreateClinicVisitDto {
  @IsUUID() studentId: string;
  @IsString() visitType: string;
  @IsString() reason: string;
  @IsString() @IsOptional() symptoms?: string;
  @IsString() @IsOptional() observations?: string;
  @IsString() @IsOptional() treatment?: string;
  @IsString() @IsOptional() outcome?: string;
  @IsString() @IsOptional() status?: string;

  @IsArray() @IsOptional() suppliesUsed?: { itemId: string; locationId: string; quantity: number }[];
}

export class CreateHealthIncidentDto {
  @IsUUID() studentId: string;
  @IsString() category: string;
  @IsString() @IsOptional() location?: string;
  @IsDate() @Type(() => Date) incidentDate: Date;
  @IsString() description: string;
  @IsString() @IsOptional() immediateAction?: string;
  @IsEnum(HealthSeverity) severity: HealthSeverity;
}

export class AdministerMedicationDto {
  @IsString() status: string;
  @IsString() @IsOptional() notes?: string;
}

export class CreateFirstAidRecordDto {
  @IsUUID() studentId: string;
  @IsDate() @Type(() => Date) @IsOptional() incidentDate?: Date;
  @IsString() @IsOptional() location?: string;
  @IsString() description: string;
  @IsString() @IsOptional() initialCondition?: string;
  @IsString() firstAidPerformed: string;
  @IsString() @IsOptional() outcome?: string;
  @IsArray() @IsOptional() staffInvolved?: string[];
  @IsString() @IsOptional() witnesses?: string;
  @IsBoolean() @IsOptional() guardianNotified?: boolean;
}

export class CreateClinicAppointmentDto {
  @IsUUID() studentId: string;
  @IsString() title: string;
  @IsString() @IsOptional() description?: string;
  @IsDate() @Type(() => Date) startTime: Date;
  @IsDate() @Type(() => Date) endTime: Date;
  @IsString() @IsOptional() appointmentType?: string;
}

export class CreateHealthFollowUpDto {
  @IsUUID() studentId: string;
  @IsString() title: string;
  @IsString() @IsOptional() description?: string;
  @IsDate() @Type(() => Date) dueDate: Date;
  @IsUUID() @IsOptional() visitId?: string;
  @IsUUID() @IsOptional() incidentId?: string;
  @IsUUID() @IsOptional() assignedToId?: string;
}

export class CreateHealthConsentDto {
  @IsUUID() studentId: string;
  @IsString() type: string;
  @IsString() status: string;
  @IsUUID() guardianId: string;
  @IsDate() @Type(() => Date) @IsOptional() validUntil?: Date;
}

export class CreateHealthReferralDto {
  @IsUUID() visitId: string;
  @IsString() reason: string;
  @IsString() destination: string;
  @IsDate() @Type(() => Date) @IsOptional() referralDate?: Date;
}

export class CreateCarePlanDto {
  @IsUUID() studentId: string;
  @IsString() title: string;
  @IsString() instructions: string;
  @IsString() @IsOptional() emergencyActions?: string;
  @IsDate() @Type(() => Date) effectiveDate: Date;
  @IsDate() @Type(() => Date) @IsOptional() reviewDate?: Date;
}

export class UpdateCarePlanDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() instructions?: string;
  @IsString() @IsOptional() emergencyActions?: string;
  @IsString() @IsOptional() status?: string;
  @IsDate() @Type(() => Date) @IsOptional() reviewDate?: Date;
  @IsString() changeReason: string;
}

export class CreateVitalSignDto {
  @IsUUID() @IsOptional() visitId?: string;
  @IsUUID() @IsOptional() studentId?: string;
  @IsUUID() @IsOptional() profileId?: string;
  @IsString() type: string;
  @IsString() value: string;
  @IsString() unit: string;
}

export class CreateHealthDocumentDto {
  @IsUUID() studentId: string;
  @IsString() documentType: string;
  @IsString() title: string;
  @IsString() fileUrl: string;
  @IsString() storageKey: string;
  @IsDate() @Type(() => Date) @IsOptional() issueDate?: Date;
  @IsDate() @Type(() => Date) @IsOptional() expiryDate?: Date;
}
