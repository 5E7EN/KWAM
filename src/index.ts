import 'reflect-metadata';
import { Container } from 'inversify';

import { bindings } from './inversify.config';
import { WhatsappClient } from './clients/whatsapp';
import { WinstonLogger } from './utils/logger';
import { TYPES } from './constants';

(async () => {
    // Create logger for this context
    const logger = new WinstonLogger('Main').logger;

    try {
        // Create a new container for dependency injection and load bindings
        const container = new Container();
        await container.loadAsync(bindings);

        // Connect to whatsapp
        const whatsappClient = await container.getAsync<WhatsappClient>(TYPES.WhatsappClient);

        // TODO: Replace with a proper logger instance somehow
        logger.info(
            `ALL SERVICES RUNNING! | Logged in as: ${
                whatsappClient.chatClient.user.id.split(':')[0]
            } | GLHF!`
        );
    } catch (err) {
        logger.error(`Error encountered during initialization: ${err + err?.stack}`);
    }
})();
