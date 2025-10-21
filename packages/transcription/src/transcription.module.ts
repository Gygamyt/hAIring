import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config'; // Import ConfigType
import { transcriptionConfig } from './config/transcription.config';
import { TranscriptionService } from './transcription.service';
import { RealtimeConnectionService } from './realtime/realtime-connection.service';
import { RealtimeEventHandler } from './realtime/realtime-event.handler';
import { ASSEMBLYAI_CLIENT } from './constants'; // <-- Import the token
import { AssemblyAI } from 'assemblyai'; // <-- Import AssemblyAI class

@Module({
    imports: [
        ConfigModule.forFeature(transcriptionConfig),
    ],
    providers: [
        TranscriptionService,
        RealtimeConnectionService,
        RealtimeEventHandler,
        // --- NEW PROVIDER for AssemblyAI Client ---
        {
            provide: ASSEMBLYAI_CLIENT,
            useFactory: (config: ConfigType<typeof transcriptionConfig>) => {
                if (!config.apiKey) {
                    // Factory should also check, although service constructors do too
                    throw new Error('AssemblyAI API key not configured.');
                }
                // Create the client instance here
                return new AssemblyAI({ apiKey: config.apiKey });
            },
            inject: [transcriptionConfig.KEY], // Inject the config
        },
        // --- END NEW PROVIDER ---
    ],
    exports: [
        TranscriptionService // Still only export the main service
    ],
})

export class TranscriptionModule {}
