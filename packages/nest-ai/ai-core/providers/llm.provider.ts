import { Provider } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { LLM_PROVIDER } from '../constants';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import aiConfig from "../config/ai.config";

export const llmProvider: Provider = {
    provide: LLM_PROVIDER,
    useFactory: (config: ConfigType<typeof aiConfig>) => {
        return new ChatGoogleGenerativeAI({
            apiKey: config.apiKey,
            model: config.model,
            temperature: config.temperature,
            topP: config.topP,
        });
    },
    inject: [aiConfig.KEY],
};
