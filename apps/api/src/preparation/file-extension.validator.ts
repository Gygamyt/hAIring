import { FileValidator } from '@nestjs/common';

export class FileExtensionValidator extends FileValidator<{ allowedExtensions: RegExp }> {
    constructor(options: { allowedExtensions: RegExp }) {
        super(options);
    }

    isValid(file?: Express.Multer.File): boolean {
        if (!file) {
            return false;
        }
        const extension = file.originalname.split('.').pop();
        return extension ? this.validationOptions.allowedExtensions.test(extension) : false;
    }

    buildErrorMessage(): string {
        return `Validation failed: File extension is not allowed. Expected one of: ${this.validationOptions.allowedExtensions.toString()}`;
    }
}
