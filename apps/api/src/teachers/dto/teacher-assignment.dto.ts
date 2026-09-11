import { IsNotEmpty, IsUUID, IsOptional, IsEnum } from "class-validator";
import { TeacherDesignation, TeacherAssignmentStatus } from "@prisma/client";

export class CreateTeacherAssignmentDto {
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsUUID()
  @IsNotEmpty()
  sectionId: string;

  @IsUUID()
  @IsNotEmpty()
  academicYearId: string;

  @IsUUID()
  @IsOptional()
  termId?: string;

  @IsEnum(TeacherDesignation)
  @IsOptional()
  designation?: TeacherDesignation;

  @IsEnum(TeacherAssignmentStatus)
  @IsOptional()
  status?: TeacherAssignmentStatus;
}
