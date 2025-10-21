import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreparationModule } from './preparation/preparation.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from "node:path";
import { BullModule } from "@nestjs/bullmq";
import { ResultsModule } from "./results/results.module";

@Module({
    imports: [
        PreparationModule,
        ConfigModule.forRoot({ isGlobal: true, envFilePath: path.resolve(process.cwd(), '../../.env'), }),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                },
            }),
            inject: [ConfigService],
        }),
        ResultsModule
    ],
    controllers: [AppController],
    providers: [AppService],
})

export class AppModule {
}
