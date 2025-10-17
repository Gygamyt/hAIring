import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsString, IsArray, IsDefined } from 'class-validator';

class MatchingItemDto {
    @ApiProperty()
    @IsString()
    criterion!: string;

    @ApiProperty()
    @IsString()
    match!: string;

    @ApiProperty()
    @IsString()
    comment!: string;
}

class ConclusionDto {
    @ApiProperty()
    @IsString()
    summary!: string;

    @ApiProperty()
    @IsString()
    recommendations!: string;

    @ApiProperty({ type: [String] })
    @IsArray()
    @IsString({ each: true })
    interview_topics!: string[];

    @ApiProperty()
    @IsString()
    values_assessment!: string;
}

export class ReportDto {
    @ApiProperty({ required: false, nullable: true })
    first_name?: string | null;

    @ApiProperty({ required: false, nullable: true })
    last_name?: string | null;

    @ApiProperty({ type: [MatchingItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MatchingItemDto)
    matching_table!: MatchingItemDto[];

    @ApiProperty()
    @IsString()
    candidate_profile!: string;

    @ApiProperty()
    @IsDefined()
    @ValidateNested()
    @Type(() => ConclusionDto)
    conclusion!: ConclusionDto;
}

export class PreparationAnalysisResponseDto {
    @ApiProperty()
    @IsString()
    message!: string;

    @ApiProperty({ default: true })
    success!: boolean;

    @ApiProperty()
    @IsDefined()
    @ValidateNested()
    @Type(() => ReportDto)
    report!: ReportDto;
}
