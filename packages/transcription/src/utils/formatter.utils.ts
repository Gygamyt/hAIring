import { Transcript } from "assemblyai";
import { Logger } from "@nestjs/common";
import chalk from "chalk";

export function formatTimestamp(ms: number | null | undefined): string {
    if (ms === null || ms === undefined) return 'N/A';
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = (totalSeconds % 60).toFixed(3);
    const paddedSeconds = seconds.padStart(6, '0');
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${paddedSeconds}`;
}

export function logUtterances(result: Transcript, logger: Logger): void {
    if (!result.utterances || result.utterances.length === 0) {
        logger.warn('No utterance data (speaker labels) available to log.');
        return;
    }
    const fullLogMessage = result.utterances.map(utterance => {
        const speaker = utterance.speaker ?? 'Unknown';
        const start = formatTimestamp(utterance.start);
        const end = formatTimestamp(utterance.end);
        return `[${start} - ${end}] Speaker ${speaker}: ${utterance.text}`;
    }).join('\n');

    logger.log(chalk.bold.underline(`Transcript by Speaker (Utterances for ID: ${result.id}):\n`) + fullLogMessage);
}
