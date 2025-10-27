import { Readable } from 'stream';
import * as cliProgress from 'cli-progress';
import { Logger } from '@nestjs/common';
import chalk from 'chalk';

/**
 * Pipes a readable stream to a writable stream while displaying a progress bar.
 *
 * @param inputStream The source readable stream (e.g., file download).
 * @param outputStream The destination writable stream (e.g., file writer).
 * @param totalSize The total expected size of the stream in bytes.
 * @param logger An optional NestJS logger instance.
 * @param description A description for the progress bar.
 * @returns A promise that resolves when the piping is complete or rejects on error.
 */
export function pipeWithProgress(
    inputStream: Readable,
    outputStream: NodeJS.WritableStream,
    totalSize: number,
    logger?: Logger,
    description = 'Downloading',
): Promise<void> {
    return new Promise((resolve, reject) => {
        let downloadedSize = 0;
        const progressBar = new cliProgress.SingleBar({
            format: `${chalk.green(description)} |${chalk.cyan('{bar}')}| {percentage}% || {value}/{total} Bytes`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true,
            stream: process.stderr,
        });

        progressBar.start(totalSize, 0);

        inputStream.on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length;
            progressBar.update(downloadedSize);
        });

        inputStream.on('error', (err) => {
            progressBar.stop();
            logger?.error(`Input stream error during progress tracking: ${err.message}`);
            reject(err);
        });

        outputStream.on('error', (err) => {
            progressBar.stop();
            logger?.error(`Output stream error during progress tracking: ${err.message}`);
            reject(err);
        });

        outputStream.on('finish', () => {
            progressBar.stop();
            logger?.log(`${description} complete.`);
            resolve();
        });

        inputStream.pipe(outputStream);
    });
}

/**
 * Gets file metadata (like size) from Google Drive.
 * (This function needs to be implemented in GoogleDriveService)
 */
export type FileMetadata = {
    id: string;
    name: string;
    size: number;
    mimeType: string;
}
