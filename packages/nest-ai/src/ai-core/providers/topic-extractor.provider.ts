import { Provider } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createTopicExtractorSubgraph } from '@hairing/ai-pipelines';
import { LLM_PROVIDER, TOPIC_EXTRACTOR_PROVIDER } from '../constants';

export const TopicExtractorPipelineProvider: Provider = {
    provide: TOPIC_EXTRACTOR_PROVIDER,
    useFactory: (llm: ChatGoogleGenerativeAI) => {
        console.log('Compiling TopicExtractorSubgraph...');
        const pipeline = createTopicExtractorSubgraph(llm);
        console.log('TopicExtractorSubgraph compiled.');
        return pipeline;
    },
    inject: [LLM_PROVIDER],
};
