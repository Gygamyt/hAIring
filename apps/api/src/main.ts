import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { ValidationPipe } from "@nestjs/common";
import { ColoredLogger } from "./common/logger/colored.logger";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // logger: process.env.NODE_ENV === 'build' ? false : ['log', 'error', 'warn'],
        logger: false,
    });
    app.useLogger(new ColoredLogger());

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    const config = new DocumentBuilder()
        .setTitle('Hairing API')
        .setDescription('The Hairing API description')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    if (process.env.NODE_ENV === 'build') {
        const outputPath = join(__dirname, 'openapi.json');
        writeFileSync(outputPath, JSON.stringify(document, null, 2));
        console.log(`✅ OpenAPI spec generated at ${outputPath}`);
        await app.close();
        return;
    }

    SwaggerModule.setup('docs', app, document);
    await app.listen(3001);
    console.log(`🚀 Application is running on: ${await app.getUrl()}`);
}

bootstrap();
