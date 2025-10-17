import { Provider, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import aiConfig from '../config/ai.config';
import { LLM_PROVIDER } from '../constants';
import { LoggingCallbackHandler } from '../callbacks/logging.callback';

export const llmProvider: Provider = {
    provide: LLM_PROVIDER,
    useFactory: (config: ConfigType<typeof aiConfig>) => {
        const logger = new Logger('AILLM');
        const loggingCallback = new LoggingCallbackHandler(logger);

        return new ChatGoogleGenerativeAI({
            apiKey: config.apiKey,
            model: config.model,
            temperature: config.temperature,
            topP: config.topP,
            callbacks: [loggingCallback],
        });
    },
    inject: [aiConfig.KEY],
};
