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
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { AnalyzeResultsDto } from "./dto/analyze-results.dto";

@ApiTags('Results Analysis')
@Controller('api/results')
export class ResultsController {
    private readonly logger = new Logger(ResultsController.name);

    constructor(
        @InjectQueue('analysis-workflow') private readonly analysisQueue: Queue,
    ) {}

    @Post('/')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
        status: 202,
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
        @Body() body: AnalyzeResultsDto,
        @UploadedFile(new ParseFilePipe({ fileIsRequired: false }))
        cvFile?: Express.Multer.File,
    ): Promise<JobStatusResponseDto> {

        const parentJobId = uuidv4();

        const jobPayload = {
            ...body,
            cvFileBuffer: cvFile?.buffer,
            cvFileName: cvFile?.originalname,
        };

        this.logger.log(
            `Queueing job ${chalk.yellow('job-1-download')} (Parent ID: ${chalk.cyan(parentJobId)})`,
        );

        await this.analysisQueue.add(
            'job-1-download',
            {
                parentJobId: parentJobId,
                payload: jobPayload,
            },
            {
                jobId: parentJobId,
            },
        );

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
        const progress = job.progress as any;

        let currentStep = 'queued';
        if (status === 'active' || status === 'waiting' || status === 'delayed') {
            currentStep = progress?.step || 'processing';
        } else if (status === 'completed') {
            currentStep = progress?.step === 'completed' ? 'completed' : (progress?.step || 'processing');
        } else if (status === 'failed') {
            currentStep = 'failed';
        }

        const result = progress?.report || null;

        const error = (status === 'failed') ? job.failedReason : null;

        return {
            job_id: job.id as string,
            status: currentStep,
            result: result,
            error,
        };
    }
}
