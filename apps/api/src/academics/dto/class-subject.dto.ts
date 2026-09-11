import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class AssignSubjectDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;
}
