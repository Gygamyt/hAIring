import { ApiProperty } from '@nestjs/swagger';

class CandidateInfoDto {
    @ApiProperty()
    full_name!: string;

    @ApiProperty()
    experience_years!: string;

    @ApiProperty({ type: [String] })
    tech_stack!: string[];

    @ApiProperty({ type: [String] })
    projects!: string[];

    @ApiProperty({ type: [String] })
    domains!: string[];

    @ApiProperty({ type: [String] })
    tasks!: string[];
}

class InterviewAnalysisDto {
    @ApiProperty({ type: [String] })
    topics!: string[];

    @ApiProperty()
    tech_assignment!: string;

    @ApiProperty()
    knowledge_assessment!: string;
}

class CommunicationSkillsDto {
    @ApiProperty()
    assessment!: string;
}

class ForeignLanguagesDto {
    @ApiProperty()
    assessment!: string;
}

class FinalConclusionDto {
    @ApiProperty()
    recommendation!: string;

    @ApiProperty()
    assessed_level!: string;

    @ApiProperty()
    summary!: string;
}

class FullReportDto {
    @ApiProperty()
    ai_summary!: string;

    @ApiProperty()
    candidate_info!: CandidateInfoDto;

    @ApiProperty()
    interview_analysis!: InterviewAnalysisDto;

    @ApiProperty()
    communication_skills!: CommunicationSkillsDto;

    @ApiProperty()
    foreign_languages!: ForeignLanguagesDto;

    @ApiProperty()
    team_fit!: string;

    @ApiProperty({ type: [String] })
    additional_information!: string[];

    @ApiProperty()
    conclusion!: FinalConclusionDto;

    @ApiProperty({ type: [String] })
    recommendations_for_candidate!: string[];
}

export class ResultsAnalysisResponseDto {
    @ApiProperty()
    message!: string;

    @ApiProperty({ default: true })
    success!: boolean;

    @ApiProperty()
    report!: FullReportDto;
}
