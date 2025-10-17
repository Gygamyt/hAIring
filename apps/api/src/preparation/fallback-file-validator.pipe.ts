import { PipeTransform, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common';
import { FileExtensionValidator } from './file-extension.validator';

@Injectable()
export class FallbackFileValidatorPipe implements PipeTransform {
    async transform(file: Express.Multer.File): Promise<Express.Multer.File | undefined> {
        if (!file) {
            return undefined;
        }

        const sizeValidator = new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 });
        if (!sizeValidator.isValid(file)) {
            throw new HttpException('Validation failed: File is too large.', HttpStatus.BAD_REQUEST);
        }

        const standardValidator = new FileTypeValidator({ fileType: '.(pdf|docx|txt)$' });
        const fallbackValidator = new FileExtensionValidator({ allowedExtensions: /(pdf|docx|txt)$/ });

        if (await standardValidator.isValid(file)) {
            return file;
        }

        if (fallbackValidator.isValid(file)) {
            return file;
        }

        throw new HttpException('Validation failed: Invalid file type.', HttpStatus.BAD_REQUEST);
    }
}
