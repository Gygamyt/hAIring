import {
    IsArray,
    IsBoolean,
    IsString,
    ValidateNested,
    IsOptional,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// -------------------------------------------------------------------
// --- DTOs for each AI Subgraph -------------------------------------
// -------------------------------------------------------------------

class TopicsDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    topics!: string[];
}

class CvSummaryDto {
    @ApiProperty()
    @IsString()
    fullName!: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    location?: string;

    @ApiProperty()
    @IsString()
    summary!: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    skills!: string[];

    @ApiProperty({ required: false, type: Number })
    @IsOptional()
    @IsNumber()
    yearsOfExperience?: number;
}

class AssessedValueDto {
    @ApiProperty()
    @IsString()
    value!: string;

    @ApiProperty()
    @IsString() // Using IsString for the enum
    match!: string; // "low" | "medium" | "high" | "not_discussed"

    @ApiProperty()
    @IsString()
    evidence!: string;
}

class CommunicationSkillsDto {
    @ApiProperty()
    @IsString()
    summary!: string;

    @ApiProperty()
    @IsNumber()
    overallScore!: number;

    @ApiProperty()
    @IsString() // Using IsString is fine for enums from the AI
    clarity!: string; // "poor" | "average" | "good" | "excellent"

    @ApiProperty()
    @IsString()
    structure!: string; // "average" | "unstructured" | "well-structured"

    @ApiProperty()
    @IsString()
    engagement!: string; // "low" | "medium" | "high"
}

class ValuesFitDto {
    @ApiProperty()
    @IsString()
    overallSummary!: string;

    @ApiProperty({ type: [AssessedValueDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AssessedValueDto)
    assessedValues!: AssessedValueDto[];
}

class TopicAssessmentDetailDto {
    @ApiProperty()
    @IsString()
    topic!: string;

    @ApiProperty()
    @IsString()
    grade!: string; // 'Excellent', 'Good', 'Moderate', 'Weak', 'Not Assessed'

    @ApiProperty()
    @IsString()
    summary!: string;
}

class TechnicalAssessmentDto {
    @ApiProperty()
    @IsString()
    knowledgeDepth!: string; // 'very-deep', 'deep', 'moderate', ...

    @ApiProperty()
    @IsString()
    practicalExperience!: string; // 'extensive', 'demonstrated', ...

    @ApiProperty()
    @IsString()
    problemSolving!: string; // 'excellent', 'good', ...

    @ApiProperty()
    @IsString()
    summary!: string;

    @ApiProperty({ type: [TopicAssessmentDetailDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TopicAssessmentDetailDto)
    topicAssessments!: TopicAssessmentDetailDto[];
}

class LanguageAssessmentDto {
    @ApiProperty()
    @IsBoolean()
    assessmentSkipped!: boolean;

    // --- Fields for a completed assessment ---
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    summary?: string; // AI calls it 'summary', not 'assessment'

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    overallLevel?: string; // AI calls it 'overallLevel', not 'level'

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    fluency?: string; // new field

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    vocabulary?: string; // new field

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    pronunciation?: string; // new field

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    reason?: string;
}

class AiSummaryDto {
    @ApiProperty()
    @IsString()
    overallSummary!: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    keyStrengths!: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    keyWeaknesses!: string[];
}

class OverallConclusionDto {
    @ApiProperty()
    @IsString()
    recommendation!: string; // 'Strong Hire', 'Hire', 'Consider', 'No Hire'

    @ApiProperty()
    @IsString()
    finalJustification!: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    keyPositives!: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    keyConcerns!: string[];
}

// -------------------------------------------------------------------
// --- Main Full Report DTO (matches AI output) ----------------------
// -------------------------------------------------------------------

class FullReportDto {
    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => TopicsDto)
    @IsOptional()
    topics?: TopicsDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => CvSummaryDto)
    @IsOptional()
    cvSummary?: CvSummaryDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => CommunicationSkillsDto)
    @IsOptional()
    communicationSkills?: CommunicationSkillsDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => ValuesFitDto)
    @IsOptional()
    valuesFit?: ValuesFitDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => TechnicalAssessmentDto)
    @IsOptional()
    technicalAssessment?: TechnicalAssessmentDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => LanguageAssessmentDto)
    @IsOptional()
    languageAssessment?: LanguageAssessmentDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => AiSummaryDto)
    @IsOptional()
    aiSummary?: AiSummaryDto;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => OverallConclusionDto)
    @IsOptional()
    overallConclusion?: OverallConclusionDto;
}

// -------------------------------------------------------------------
// --- API Envelope --------------------------------------------------
// -------------------------------------------------------------------

export class ResultsAnalysisResponseDto {
    @ApiProperty()
    @IsString()
    message!: string;

    @ApiProperty({ default: true })
    @IsBoolean()
    success!: boolean;

    @ApiProperty({ required: false })
    @ValidateNested()
    @Type(() => FullReportDto)
    @IsOptional()
    report?: FullReportDto;
}
