import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  MaxLength,
} from 'class-validator';
import {
  ResearchType,
  ResearchDepth,
  ResearchOutputType,
  ResearchPriority,
  CitationStyle,
  CitationMode,
  ReportFormat,
} from '@prisma/client';

export class CreateResearchDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  objective!: string;

  @IsEnum(ResearchType)
  researchType!: ResearchType;

  @IsEnum(ResearchDepth)
  depth!: ResearchDepth;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsEnum(ResearchOutputType)
  outputType!: ResearchOutputType;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  customInstructions?: string;

  @IsOptional()
  @IsEnum(ResearchPriority)
  priority?: ResearchPriority;

  @IsOptional()
  @IsEnum(CitationStyle)
  citationStyle?: CitationStyle;

  @IsOptional()
  @IsEnum(CitationMode)
  citationMode?: CitationMode;
}

export class ExportReportDto {
  @IsEnum(ReportFormat)
  format!: ReportFormat;
}
