import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Body,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';

import { PreparationService } from './preparation.service';
import { AnalyzePreparationDto } from './dto/analyze-preparation.dto';
import { PreparationAnalysisResponseDto } from './dto/preparation-analysis-response.dto';
import { ErrorResponseDto } from "../shared/dto/error-response.dto";

@Controller('api/prep')
export class PreparationController {
    constructor(private readonly preparationService: PreparationService) {
    }

    @Post('/')
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, type: PreparationAnalysisResponseDto })
    @ApiResponse({ status: 400, type: ErrorResponseDto })
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
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /(pdf|docx|txt)$/ }),
                ],
            }),
        )
        cvFile: Express.Multer.File,
        @Body() body: AnalyzePreparationDto,
    ): Promise<PreparationAnalysisResponseDto> {
        return this.preparationService.analyze(
            cvFile.buffer,
            cvFile.originalname,
            body.feedback_text,
            body.requirements_link,
        );
    }
}
