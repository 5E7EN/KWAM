import inversify, { AsyncContainerModule } from 'inversify';

import { WhatsappClient } from './clients/whatsapp';

import { MessageController } from './controllers/message-router';

import { CooldownModule } from './modules/cooldown';
import { CommandsModule } from './modules/commands';

import { BaseLogger, WinstonLogger } from './utils/logger';

import { TYPES } from './constants';

// TODO: Use self binding? See: https://github.com/inversify/InversifyJS/blob/master/wiki/classes_as_id.md
export const bindings = new AsyncContainerModule(async (bind: inversify.interfaces.Bind) => {
    // Bind Modules
    bind<CooldownModule>(TYPES.CooldownModule).to(CooldownModule).inSingletonScope;
    bind<CommandsModule>(TYPES.CommandsModule).to(CommandsModule).inSingletonScope;

    // Bind Utils
    bind<BaseLogger>(TYPES.BaseLogger).toDynamicValue((context) => {
        // Get requesting class name
        const className =
            (context.currentRequest.parentRequest?.bindings?.[0]?.implementationType as any)
                ?.name || 'Unknown';

        // Add spaces between camel case words
        const spacedName = className.replace(/([A-Z])/g, ' $1').trim();

        // Return a new logger instance with context tag
        return new WinstonLogger(spacedName).logger;
    });

    // Bind Clients
    //? Does binding order matter?
    bind<WhatsappClient>(TYPES.WhatsappClient).to(WhatsappClient).inSingletonScope();

    // Bind Controllers
    bind<MessageController>(TYPES.MessageController).to(MessageController).inSingletonScope();
});
