import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import { Serialized } from '@langchain/core/load/serializable';
import { LLMResult } from '@langchain/core/outputs';
import { Logger } from '@nestjs/common';
import chalk from "chalk";

export class LoggingCallbackHandler extends BaseCallbackHandler {
    name = 'LoggingCallbackHandler';
    private logger: Logger;
    private runIdToStartTime = new Map<string, number>();

    constructor(logger: Logger) {
        super();
        this.logger = logger;
    }

    handleLLMStart(
        _llm: Serialized,
        _prompts: string[],
        runId: string,
        _parentRunId?: string,
        _extraParams?: Record<string, unknown>,
        _tags?: string[],
        metadata?: Record<string, unknown>,
    ): void {
        this.runIdToStartTime.set(runId, Date.now());
        const nodeName = metadata?.node ?? 'UnknownNode';

        const message = `${chalk.blue('LLM Call Started')} ${chalk.green('for node:')} ${chalk.yellow(nodeName)}`;

        this.logger.log(message);
    }

    handleLLMEnd(output: LLMResult, runId: string): void {
        const startTime = this.runIdToStartTime.get(runId);
        const duration = startTime ? Date.now() - startTime : null;
        const tokenUsage = output.llmOutput?.tokenUsage;
        const tokens = {
            prompt: tokenUsage?.promptTokens ?? 0,
            completion: tokenUsage?.completionTokens ?? 0,
            total: tokenUsage?.totalTokens ?? 0,
        };

        const tokenDetails = `${chalk.gray('Tokens:')} ${chalk.gray('(')}${chalk.gray('I:')} ${chalk.cyan(tokens.prompt)}${chalk.gray(',')} ${chalk.gray('O:')}  ${chalk.magenta(tokens.completion)}${chalk.gray(',')} ${chalk.gray('T:')} ${chalk.yellowBright(tokens.total)}${chalk.gray(')')}`;

        const message = `${chalk.cyan('LLM Call Succeeded')} ${chalk.green('-')} ${chalk.yellow(`${duration}ms`)} ${chalk.green('|')} ${tokenDetails}`;

        this.logger.log(message);
        this.runIdToStartTime.delete(runId);
    }

    handleLLMError(err: Error, runId: string): void {
        const startTime = this.runIdToStartTime.get(runId);
        const duration = startTime ? Date.now() - startTime : null;

        const message = `${chalk.red('LLM Call Failed')} - ${chalk.yellow(`${duration}ms`)} | Error: ${err.message}`;

        this.logger.error(message);
        this.runIdToStartTime.delete(runId);
    }
}
