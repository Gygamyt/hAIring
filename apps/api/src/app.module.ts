import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreparationModule } from './preparation/preparation.module';
import { ConfigModule } from '@nestjs/config';
import { AiCoreModule } from "@hairing/ai-pipelines";

@Module({
  imports: [
      PreparationModule,
      ConfigModule.forRoot({isGlobal: true}),
      AiCoreModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
