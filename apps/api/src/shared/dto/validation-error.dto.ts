import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

type ValidationErrorLoc = (string | number)[];

class ValidationErrorDto {
    @ApiProperty({
        description: 'Путь к полю, вызвавшему ошибку.',
        example: ['body', 'requirements_link'],
    })
    @IsArray()
    loc!: ValidationErrorLoc;

    @ApiProperty({
        description: 'Сообщение об ошибке.',
        example: 'URL is not valid',
    })
    @IsString()
    msg!: string;

    @ApiProperty({
        description: 'Тип ошибки.',
        example: 'UrlError',
    })
    @IsString()
    type!: string;
}

export class HttpValidationErrorDto {
    @ApiProperty({
        type: [ValidationErrorDto],
        description: 'Массив деталей по ошибкам валидации.',
        required: false,
    })

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ValidationErrorDto)
    detail?: ValidationErrorDto[];
}
