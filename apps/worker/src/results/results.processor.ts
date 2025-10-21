import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ResultsService } from './results.service';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

@Processor('analysis-workflow')
export class ResultsProcessor extends WorkerHost {
    private readonly logger = new Logger(ResultsProcessor.name);

    constructor(private readonly resultsService: ResultsService) {
        super();
    }

    /**
     * This method is called for every job in the 'analysis-workflow' queue.
     * It routes the job to the correct service method based on its name.
     */
    async process(job: Job): Promise<any> {
        this.logger.log(
            `Processing job ${chalk.yellow(job.name)} (ID: ${chalk.cyan(job.id)})`,
        );

        try {
            switch (job.name) {
                case 'job-1-download':
                    return await this.resultsService.runDownloadStep(job);

                case 'job-2-transcribe':
                    return await this.resultsService.runTranscriptionStep(job);

                case 'job-3-run-ai':
                    return await this.resultsService.runAiPipelineStep(job);
                default:
                    throw new Error(`Unknown job name: ${job.name}`);
            }
        } catch (error: any) {
            this.logger.error(
                `Job ${chalk.yellow(job.name)} (ID: ${chalk.cyan(
                    job.id,
                )}) failed: ${chalk.red(error.message)}`,
                error.stack,
            );
            throw error;
        }
    }
}
