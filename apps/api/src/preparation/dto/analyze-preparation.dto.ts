import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AnalyzePreparationDto {

    @ApiProperty({
        description: 'Фидбэк от рекрутера в виде текста.',
        example: 'Кандидат показался очень мотивированным...',
    })
    @IsNotEmpty()
    @IsString()
    feedback_text!: string;

    @ApiProperty({
        description: 'Ссылка на Google Таблицу с требованиями.',
        example: 'https://docs.google.com/spreadsheets/d/xxxxxxxx/edit',
    })
    @IsNotEmpty()
    @IsUrl()
    requirements_link!: string;
}
