import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

export const LLM_PROVIDER = 'LLM_PROVIDER';

export const aiBaseProviders: Provider[] = [
    {
        provide: LLM_PROVIDER,
        useFactory: (configService: ConfigService) => {
            const apiKey = configService.get<string>('GOOGLE_API_KEY');
            if (!apiKey) {
                throw new Error('GOOGLE_API_KEY is not configured!');
            }

            return new ChatGoogleGenerativeAI({
                apiKey,
                model: 'gemini-pro', //todo change this shiet
            });
        },
        inject: [ConfigService],
    },
];
