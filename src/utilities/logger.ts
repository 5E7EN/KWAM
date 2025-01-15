import { injectable } from 'inversify';
import chalk from 'chalk';
import winston, { createLogger, format, transports } from 'winston';
import type { Logger } from 'winston';

import { app as AppConfig } from '../constants';

export enum ELogLevel {
    SILLY = 'silly',
    DEBUG = 'debug',
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error'
}

interface ITransformableInfo {
    level: string;
    message: string;
    [key: string]: string;
}

export type BaseLogger = Logger;

@injectable()
export class WinstonLogger {
    private readonly _contextTag: string;
    private readonly _logLevel: ELogLevel;
    private readonly _logger: BaseLogger;

    constructor(contextTag?: string, logLevel?: ELogLevel) {
        let envLevel: ELogLevel;

        // Check if the env log level is set and is a valid value, then use it
        if (
            AppConfig.LOG_LEVEL &&
            Object.values(ELogLevel).includes(AppConfig.LOG_LEVEL as ELogLevel)
        ) {
            envLevel = AppConfig.LOG_LEVEL as ELogLevel;
        }

        // Log level priority:
        // global env -> desired initialization value -> environmental defaults
        this._logLevel =
            envLevel ||
            logLevel ||
            (AppConfig.ENVIRONMENT === 'production' ? ELogLevel.INFO : ELogLevel.DEBUG);

        // Set context tag - example result: [Context Tag]
        this._contextTag = contextTag;

        // Configure logger instance
        this._logger = createLogger({
            format: format.json(),
            level: this._logLevel,
            transports: [
                new transports.Console({
                    //@ts-ignore - TODO: come back to fix this ts error...
                    format: format.printf((info: ITransformableInfo): string => {
                        const NPMColors = winston.config.npm.colors;
                        const colors = NPMColors[info.level];
                        const color = Array.isArray(colors) ? colors[0] : colors;
                        const isMessageString = typeof info.message === 'string';

                        let contextTag: string;

                        // If message is a string, set context tag and append extender, if defined
                        if (isMessageString) {
                            // Extract the context tag from the log message between brackets
                            const contextTagExtension = info.message.match(/^\[(.*?)]/) || [];
                            contextTag =
                                // If the context tag extender exists, concatenate it with the extracted context tag
                                contextTagExtension.length !== 0
                                    ? this._contextTag
                                        ? this._contextTag + ' | ' + contextTagExtension[1]
                                        : contextTagExtension[1]
                                    : // Otherwise, use the context tag defined in the constructor
                                      this._contextTag;
                        }

                        // Pad context tag
                        const paddedContextText = `[${contextTag}]`.padEnd(20);

                        const messageMeta: string[] = [
                            // Add the current date and time
                            chalk.gray(new Date().toLocaleString()),
                            // Add the log level in uppercase and pad with spaces
                            chalk[color](info.level.toUpperCase().padEnd(7)),
                            // Add the context tag (if present) and pad with spaces
                            contextTag ? chalk.yellow(paddedContextText) + ' -' : ''
                        ];

                        const messageContent: string[] = [
                            // Remove the context tag and add log message
                            isMessageString
                                ? // If the message contains newlines is isn't an error, pad each line with spaces to align with the context tag
                                  // Otherwise, just return the message as-is
                                  /\n.+?/.test(info.message) && info.level.toUpperCase() !== 'ERROR'
                                    ? info.message
                                          .replace(/^\[.*?]( )/, '') // Remove context tag extender
                                          .split(/\n/g)
                                          .map((line, idx) => {
                                              // Don't modify the first line since it's already padded
                                              if (idx === 0) return line;

                                              // Remove user-defined spaces at the beginning of the line
                                              line = line.trim();

                                              // Re-add spaces to the beginning of the line enough to align with the context tag
                                              // Ignore ANSI escape sequences (applied by chalk) when calculating the length
                                              return (
                                                  ' '.repeat(
                                                      messageMeta
                                                          .join(' ')
                                                          .replace(/\u001b\[[0-9;]*m/g, '').length +
                                                          1
                                                  ) + line
                                              );
                                          })
                                          .join('\n')
                                    : info.message.replace(/^\[.*?]( )/, '') // Remove context tag extender
                                : '',
                            // Stringify message object (if present)
                            !isMessageString ? JSON.stringify(info.message, null, 2) : ''
                        ];

                        // Return the formatted log message meta and content
                        return messageMeta.join(' ') + ' ' + messageContent.join(' ');
                    })
                })
            ]
        });
    }

    public get logger() {
        return this._logger;
    }
}
