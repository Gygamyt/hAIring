import { Module } from '@nestjs/common';
import { AudioExtractorService } from './audio-extractor.service';
import { GoogleDriveModule } from '@hairing/google-drive';

@Module({
    imports: [
        GoogleDriveModule
    ],
    providers: [AudioExtractorService],
    exports: [AudioExtractorService],
})

export class AudioExtractorModule {}
