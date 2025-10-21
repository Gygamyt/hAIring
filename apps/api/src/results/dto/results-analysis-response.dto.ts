import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CandidateInfoDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    full_name!: string;

    @ApiProperty()
    @IsString()
    experience_years!: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    tech_stack!: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    projects!: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    domains!: string[];

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    tasks!: string[];
}

class InterviewAnalysisDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    topics!: string[];

    @ApiProperty()
    @IsString()
    tech_assignment!: string;

    @ApiProperty()
    @IsString()
    knowledge_assessment!: string;
}

class CommunicationSkillsDto {
    @ApiProperty()
    @IsString()
    assessment!: string;
}

class ForeignLanguagesDto {
    @ApiProperty()
    @IsString()
    assessment!: string;
}

class FinalConclusionDto {
    @ApiProperty()
    @IsString()
    recommendation!: string;

    @ApiProperty()
    @IsString()
    assessed_level!: string;

    @ApiProperty()
    @IsString()
    summary!: string;
}

class FullReportDto {
    @ApiProperty()
    @IsString()
    ai_summary!: string;

    @ApiProperty()
    @ValidateNested()
    @Type(() => CandidateInfoDto)
    candidate_info!: CandidateInfoDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => InterviewAnalysisDto)
    interview_analysis!: InterviewAnalysisDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => CommunicationSkillsDto)
    communication_skills!: CommunicationSkillsDto;

    @ApiProperty()
    @ValidateNested()
    @Type(() => ForeignLanguagesDto)
    foreign_languages!: ForeignLanguagesDto;

    @ApiProperty()
    @IsString()
    team_fit!: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    additional_information!: string[];

    @ApiProperty()
    @ValidateNested()
    @Type(() => FinalConclusionDto)
    conclusion!: FinalConclusionDto;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    recommendations_for_candidate!: string[];
}

export class ResultsAnalysisResponseDto {
    @ApiProperty()
    @IsString()
    message!: string;

    @ApiProperty({ default: true })
    @IsBoolean()
    success!: boolean;

    @ApiProperty()
    @ValidateNested()
    @Type(() => FullReportDto)
    report!: FullReportDto;
}
