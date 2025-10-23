import { Provider } from '@nestjs/common';
import { FINAL_REPORT_GRAPH_PROVIDER, LLM_PROVIDER } from "../constants";
import { createFinalReportSubgraph } from "@hairing/ai-pipelines/src/post-interview/final-report/finalreport.graph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const FinalReportProvider: Provider = {
    provide: FINAL_REPORT_GRAPH_PROVIDER,
    useFactory: (llm: ChatGoogleGenerativeAI) => {
        return createFinalReportSubgraph(llm);
    },
    inject: [LLM_PROVIDER],
};
