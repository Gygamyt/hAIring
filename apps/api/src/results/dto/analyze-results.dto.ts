import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AnalyzeResultsDto {
    @ApiProperty({
        description: 'Link to the Google Drive video/audio of the interview',
        example: 'https://docs.google.com/document/d/123xyz...',
    })
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    video_link!: string;

    @ApiProperty({
        description: 'Link to the Google Sheet with the competency matrix',
        example: 'https://docs.google.com/spreadsheets/d/123xyz...',
    })
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    competency_matrix_link!: string;

    @ApiProperty({
        description: 'Link to the Google Sheet with department values',
        example: 'https://docs.google.com/spreadsheets/d/123xyz...',
    })
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    department_values_link!: string;

    @ApiProperty({
        description: 'Link to the Google Sheet with the employee portrait',
        example: 'https://docs.google.com/spreadsheets/d/123xyz...',
    })
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    employee_portrait_link!: string;

    @ApiProperty({
        description: 'Link to the Google Sheet with job requirements',
        example: 'https://docs.google.com/spreadsheets/d/123xyz...',
    })
    @IsString()
    @IsUrl()
    @IsNotEmpty()
    job_requirements_link!: string;
}
