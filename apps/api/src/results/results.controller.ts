import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseInterceptors,
    UploadedFile,
    ParseFilePipe,
    HttpStatus,
    HttpException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse, ApiTags } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';
import { JobStatusResponseDto } from './dto/job-status-response.dto';
import { ResultsAnalysisResponseDto } from './dto/results-analysis-response.dto';
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AnalyzeResultsDto } from "./dto/analyze-results.dto";

@ApiTags('Results Analysis (Pipeline 2)')
@Controller('api/results')
export class ResultsController {
    private readonly logger = new Logger(ResultsController.name);

    constructor(
        @InjectQueue('analysis-workflow') private readonly analysisQueue: Queue,
    ) {}

    @Post('/')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
        status: 202, // 202 Accepted
        description: 'Analysis job has been accepted and queued.',
        type: JobStatusResponseDto,
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cv_file: { type: 'string', format: 'binary' },
                video_link: { type: 'string' },
                competency_matrix_link: { type: 'string' },
                department_values_link: { type: 'string' },
                employee_portrait_link: { type: 'string' },
                job_requirements_link: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('cv_file'))
    async startAnalysis(
        @Body() body: AnalyzeResultsDto, // Your DTO for validation
        @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) // CV is optional
        cvFile?: Express.Multer.File,
    ): Promise<JobStatusResponseDto> {

        // This job ID is the "Parent ID" for the entire workflow
        const parentJobId = uuidv4();

        const jobPayload = {
            ...body,
            cvFileBuffer: cvFile?.buffer,
            cvFileName: cvFile?.originalname,
        };

        this.logger.log(
            `Queueing job ${chalk.yellow('job-1-download')} (Parent ID: ${chalk.cyan(parentJobId)})`,
        );

        // Add the FIRST job in our multi-step workflow
        await this.analysisQueue.add(
            'job-1-download', // The first step
            {
                parentJobId: parentJobId,
                payload: jobPayload,
            },
            {
                jobId: parentJobId, // Use our generated UUID as the main job ID
            },
        );

        // Immediately return the Job ID and "queued" status
        return {
            job_id: parentJobId,
            status: 'queued',
        };
    }

    @Get('/status/:job_id')
    @ApiResponse({
        status: 200,
        description: 'Returns the current status of the job.',
        type: JobStatusResponseDto,
    })
    @ApiResponse({ status: 404, description: 'Job not found.' })
    async getJobStatus(
        @Param('job_id') jobId: string,
    ): Promise<JobStatusResponseDto> {
        const job = await this.analysisQueue.getJob(jobId);

        if (!job) {
            throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
        }

        const status = await job.getState();
        const progress = job.progress as any; // We'll get progress from the worker

        let currentStep = 'queued';
        if (status === 'active') {
            currentStep = progress?.step || 'processing'; // e.g., "downloading", "transcribing"
        } else if (status === 'completed') {
            currentStep = 'completed';
        } else if (status === 'failed') {
            currentStep = 'failed';
        }

        // The final report is stored in `returnvalue` (on success)
        // or `progress` (if we update it from the worker)
        const result = (status === 'completed') ? (job.returnvalue as ResultsAnalysisResponseDto) : (progress?.report || null);
        const error = (status === 'failed') ? job.failedReason : null;

        return {
            job_id: job.id as string,
            status: currentStep,
            result: result,
            error,
        };
    }
}