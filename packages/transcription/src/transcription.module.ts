import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TranscriptionService } from "./transcription.service";


@Module({
    imports: [ConfigModule],
    providers: [TranscriptionService],
    exports: [TranscriptionService],
})

export class TranscriptionModule {}
