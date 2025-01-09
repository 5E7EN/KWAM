import type { Logger } from 'winston';

export interface ILogger {
    /**
     * Returns the logger instance.
     */
    logger: Logger;
}
