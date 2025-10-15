import { ApiProperty } from '@nestjs/swagger';

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
}
