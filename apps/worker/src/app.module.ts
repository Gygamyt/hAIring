import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ResultsModule } from './results/results.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env', // Assumes .env is in the monorepo root
        }),
        // Configure the global BullMQ connection to Redis
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
        // Import the module that contains our worker's logic
        ResultsModule,
    ],
})
export class AppModule {}