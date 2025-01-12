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

        if (AppConfig.LOG_LEVEL && AppConfig.LOG_LEVEL in ELogLevel) {
            envLevel = ELogLevel[AppConfig.LOG_LEVEL] as ELogLevel;
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

                        const message: string[] = [
                            // Add the current date and time
                            chalk.gray(new Date().toLocaleString()),
                            // Add the log level in uppercase and pad with spaces
                            chalk[color](info.level.toUpperCase().padEnd(7)),
                            // Add the context tag (if present) and pad with spaces
                            contextTag ? chalk.yellow(`[${contextTag}]`.padEnd(20)) + ' -' : '',
                            // Remove the context tag and add log message
                            isMessageString ? info.message.replace(/^\[.*?]( )/, '') : '',
                            // Stringify message object (if present)
                            !isMessageString ? JSON.stringify(info.message, null, 2) : ''
                        ];

                        // Return the formatted log message
                        return message.join(' ').trim();
                    })
                })
            ]
        });
    }

    public get logger() {
        return this._logger;
    }
}
