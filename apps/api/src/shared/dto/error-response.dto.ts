import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ErrorResponseDto {
    @ApiProperty({
        description: 'Подробное описание ошибки.',
        example: 'Задача с указанным ID не найдена',
    })
    @IsString()
    detail!: string;

    @ApiProperty({
        description: 'Внутренний код ошибки для удобства отладки.',
        example: 'JOB_NOT_FOUND',
        required: false,
        nullable: true,
    })

    @IsOptional()
    @IsString()
    error_code?: string | null;
}
