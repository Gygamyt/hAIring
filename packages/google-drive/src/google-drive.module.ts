import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import googleDriveConfig from "./config/google-drive.config";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule.forFeature(googleDriveConfig),
    ],
    providers: [GoogleDriveService],
    exports: [GoogleDriveService],
})

export class GoogleDriveModule {
}
