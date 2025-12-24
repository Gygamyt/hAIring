import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,

} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';

import { PreparationService } from './preparation.service';
import { AnalyzePreparationDto } from './dto/analyze-preparation.dto';
import { PreparationAnalysisResponseDto } from './dto/preparation-analysis-response.dto';
import { ErrorResponseDto } from "../shared/dto/error-response.dto";
import { FallbackFileValidatorPipe } from "./fallback-file-validator.pipe";

@Controller('api/prep')
export class PreparationController {
    constructor(private readonly preparationService: PreparationService) {
    }

    @Post('/')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, type: PreparationAnalysisResponseDto })
    @ApiResponse({ status: 400, type: ErrorResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized. Missing or invalid JWT token.' })
    @ApiResponse({ status: 403, description: 'Forbidden. User does not have permission.' })
    @ApiResponse({ status: 422, description: 'Unprocessable Entity. The AI pipeline failed to process the data (e.g., validation failed after retries).', type: ErrorResponseDto })
    @ApiResponse({ status: 500, type: ErrorResponseDto })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                cv_file: { type: 'string', format: 'binary' },
                feedback_text: { type: 'string' },
                requirements_link: { type: 'string' },
            },
        },
    })
    @UseInterceptors(FileInterceptor('cv_file'))
    async analyzePreparation(
        @Body() body: AnalyzePreparationDto,
        @UploadedFile(new FallbackFileValidatorPipe()) cvFile: Express.Multer.File,
    ): Promise<PreparationAnalysisResponseDto> {
        return this.preparationService.analyze(
            cvFile.buffer,
            cvFile.originalname,
            body.feedback_text,
            body.requirements_link,
        );
    }
}
