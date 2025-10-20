import { BaseMessage } from "@langchain/core/messages";
import { Logger } from '@nestjs/common';

export const getRawContent = (result: BaseMessage, logger: Logger): string | null => {
    if (typeof result.content !== 'string') {
        logger.warn(`LLM output content was not a string. Received: ${JSON.stringify(result.content)}`);
        return null;
    }
    return result.content;
};
