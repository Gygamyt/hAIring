import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const logger = new Logger('WorkerApplication');
    logger.log('Worker is running and listening for jobs...');
}

bootstrap();
