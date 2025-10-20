import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreparationModule } from './preparation/preparation.module';
import { ConfigModule } from '@nestjs/config';
import * as path from "node:path";

@Module({
    imports: [
        PreparationModule,
        ConfigModule.forRoot({ isGlobal: true, envFilePath: path.resolve(process.cwd(), '../../.env'), }),
    ],
    controllers: [AppController],
    providers: [AppService],
})

export class AppModule {
}
