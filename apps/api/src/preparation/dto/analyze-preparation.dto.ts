import { ApiProperty } from '@nestjs/swagger';

export class AnalyzePreparationDto {
    @ApiProperty()
    feedback_text!: string;

    @ApiProperty()
    requirements_link!: string;
}
