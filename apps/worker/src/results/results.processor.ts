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
        @InjectQueue('analysis-workflow') private readonly analysisQueue: Queue,
        private readonly downloadService: DownloadService,
        private readonly transcriptionService: TranscriptionOrchestrationService,
        private readonly aiAnalysisService: AiAnalysisService,
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
                    nextJobPayload = await this.downloadService.run(jobData);
                    await this.addNextJob(parentJobId!, 'job-2-transcribe', nextJobPayload);
                    await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'downloaded' });
                    return { step: 'download', status: 'success' };

                case 'job-2-transcribe':
                    nextJobPayload = await this.transcriptionService.run(jobData);
                    await this.addNextJob(parentJobId!, 'job-3-run-ai', nextJobPayload);
                    await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'transcribed' });
                    return { step: 'transcription', status: 'success' };

                case 'job-3-run-ai':
                    finalResult = await this.aiAnalysisService.run(jobData);
                    await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'completed', report: finalResult });
                    this.logger.log(`[Job ${parentJobId}] Workflow completed successfully.`);
                    return finalResult;

                default:
                    throw new Error(`Unknown job name: ${job.name}`);
            }
        } catch (error: any) {
            this.logger.error(
                `Job ${chalk.yellow(job.name)} (ID: ${chalk.cyan(job.id)}, Parent: ${chalk.cyan(parentJobId)}) failed: ${chalk.red(error.message)}`,
                error.stack,
            );
            await this.analysisQueue.updateJobProgress(parentJobId!, { step: 'failed' });
            throw error;
        }
    }

    /** Helper to enqueue next job */
    private async addNextJob(parentJobId: string, jobName: string, payload: any) {
        await this.analysisQueue.add(jobName, { parentJobId, payload });
        this.logger.log(`[Job ${parentJobId}] Enqueued next step: ${chalk.yellow(jobName)}`);
    }
}
