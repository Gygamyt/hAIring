import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PreparationModule } from './preparation/preparation.module';

@Module({
  imports: [PreparationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
