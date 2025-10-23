import { Annotation } from '@langchain/langgraph';
import { TopicExtractorOutput } from './topic-extractor.types';
import { InferGraphState } from "../../../utils";

export const TopicExtractorStateAnnotation = Annotation.Root({
    transcript: Annotation<string>(),

    extractedTopics: Annotation<TopicExtractorOutput | null>(),

    rawTopics: Annotation<string | null>(),
    topicsError: Annotation<string | null>(),
    topicsRetries: Annotation<number>(),
    topicTraceId: Annotation<string | null>(),
});

export type TopicExtractorState = InferGraphState<typeof TopicExtractorStateAnnotation>;
