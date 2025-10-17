import { Provider } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createCandidatePipeline } from '@hairing/ai-pipelines';
import { LLM_PROVIDER, CANDIDATE_PIPELINE_PROVIDER } from '../constants';

export const candidatePipelineProvider: Provider = {
    provide: CANDIDATE_PIPELINE_PROVIDER,
    useFactory: (llm: ChatGoogleGenerativeAI) => {
        return createCandidatePipeline(llm);
    },
    inject: [LLM_PROVIDER],
};
