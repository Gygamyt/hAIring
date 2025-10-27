import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResultsController } from './results.controller';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'analysis-workflow',
        }),
    ],
    controllers: [
        ResultsController
    ],
    providers: [
    ],
})

export class ResultsModule {}
