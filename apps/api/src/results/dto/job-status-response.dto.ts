import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from "class-transformer";
import { MetadataDto } from "@hairing/dto/src";

export class JobStatusResponseDto {
    @ApiProperty({
        description: 'Уникальный идентификатор задачи',
        example: '123',
    })
    job_id!: string;

    @ApiProperty({
        description: 'Текущий статус задачи (например, "queued", "active", "completed", "failed")',
        example: 'queued',
    })
    status!: string;

    @ApiProperty({
        description: 'Результат выполнения задачи, если она успешно завершена',
        required: false,
        nullable: true,
    })
    result?: Record<string, any> | null;

    @ApiProperty({
        description: 'Текст ошибки, если задача провалилась',
        required: false,
        nullable: true,
    })
    error?: string | null;

    @ApiProperty({
        description: 'Метаданные о выполнении задачи, включая историю шагов',
        required: false,
        nullable: true,
    })
    @Type(() => MetadataDto)
    @IsOptional()
    metadata?: MetadataDto | null;
}
