import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import chalk from 'chalk';
chalk.level = 2;

@Injectable({ scope: Scope.TRANSIENT })
export class ColoredLogger extends ConsoleLogger {
    colorize(message: string, logLevel: string): string {
        switch (logLevel) {
            case 'error':
                return chalk.red(message);
            case 'warn':
                return chalk.yellow(message);
            case 'log':
                return chalk.green(message);
            case 'verbose':
                return chalk.cyan(message);
            case 'debug':
                return chalk.magenta(message);
            default:
                return message;
        }
    }

    protected printMessages(
        messages: unknown[],
        context = '',
        logLevel = 'log',
        writeStreamType?: 'stdout' | 'stderr',
    ) {
        messages.forEach((message) => {
            const isChalked = typeof message === 'string' && message.includes('\u001b[');

            const pid = chalk.gray(`[Nest] ${process.pid}`);
            const timestamp = new Date().toLocaleString();
            const contextMessage = context ? chalk.yellow(`[${context}] `) : '';
            const levelMessage = this.colorize(logLevel.toUpperCase(), logLevel);

            let finalMessage: string;

            if (isChalked) {
                finalMessage = `${pid}  - ${timestamp}   ${levelMessage}${contextMessage}${message}\n`;
            } else {
                const plainMessage = this.colorize(String(message), logLevel);
                finalMessage = `${pid}  - ${timestamp}   ${levelMessage}${contextMessage}${plainMessage}\n`;
            }

            process[writeStreamType ?? 'stdout'].write(finalMessage);
        });
    }
}
