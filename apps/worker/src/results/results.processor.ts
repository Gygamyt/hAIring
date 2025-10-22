import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DownloadService } from './download.service';
import { TranscriptionOrchestrationService } from './transcription-orchestration.service';
import { AiAnalysisService } from './ai-analysis.service';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

@Processor('analysis-workflow')
export class ResultsProcessor extends WorkerHost {
    private readonly logger = new Logger(ResultsProcessor.name);

    constructor(
        // Inject the queue to add subsequent jobs
        @InjectQueue('analysis-workflow') private readonly analysisQueue: Queue,
        // Inject the step-specific services
        private readonly downloadService: DownloadService,
        private readonly transcriptionService: TranscriptionOrchestrationService,
        private readonly aiAnalysisService: AiAnalysisService,
        // Remove ResultsService if no longer needed for orchestration
        // private readonly resultsService: ResultsService,
    ) {
        super();
    }

    async process(job: Job): Promise<any> {
        const jobData = job.data;
        const parentJobId = jobData.parentJobId || job.id;

        this.logger.log(
            `Processing job ${chalk.yellow(job.name)} (ID: ${chalk.cyan(job.id)}, Parent: ${chalk.cyan(parentJobId)})`,
        );

        try {
            let nextJobPayload: any;
            let finalResult: any;

            switch (job.name) {
                case 'job-1-download':
                    // Run download step
                    nextJobPayload = await this.downloadService.run(jobData);
                    // Enqueue transcription step
                    await this.addNextJob(parentJobId!, 'job-2-transcribe', nextJobPayload); // Use parentJobId from data
                    await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'downloaded' });
                    return { step: 'download', status: 'success' }; // Return value for THIS job

                case 'job-2-transcribe':
                    // Run transcription step
                    nextJobPayload = await this.transcriptionService.run(jobData);
                    // Enqueue AI step
                    await this.addNextJob(parentJobId!, 'job-3-run-ai', nextJobPayload);
                    await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'transcribed' });
                    return { step: 'transcription', status: 'success' }; // Return value for THIS job

                case 'job-3-run-ai':
                    // Run AI step (final step)
                    finalResult = await this.aiAnalysisService.run(jobData);
                    // Update the original parent job with the final result
                    await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'completed', report: finalResult });
                    this.logger.log(`[Job ${parentJobId}] Workflow completed successfully.`);
                    return finalResult; // Return final result for THIS job

                default:
                    throw new Error(`Unknown job name: ${job.name}`);
            }
        } catch (error: any) {
            this.logger.error(
                `Job ${chalk.yellow(job.name)} (ID: ${chalk.cyan(job.id)}, Parent: ${chalk.cyan(parentJobId)}) failed: ${chalk.red(error.message)}`,
                error.stack,
            );
            // Update the original parent job progress to failed
            await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'failed' });
            // Re-throw the error so BullMQ marks the CURRENT job as 'failed'
            throw error;
        }
    }

    /** Helper to enqueue next job */
    private async addNextJob(parentJobId: string, jobName: string, payload: any) {
        await this.analysisQueue.add(jobName, { parentJobId, payload }); // Pass parentJobId in data
        this.logger.log(`[Job ${parentJobId}] Enqueued next step: ${chalk.yellow(jobName)}`);
    }
}
