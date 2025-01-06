import * as Modules from './modules';
import * as Controllers from './controllers';
import Commands from './services/commands';
import { WinstonLogger } from './services/logger';

import WhatsApp from './clients/whatsapp';

// TODO: Move this elsewhere
declare global {
    namespace bot {
        let Store: {
            cmds: Map<string, any>;
            cmdAliases: Map<string, any>;
            cooldowns: any;
        };

        let Modules: any;
        let Logger: any;
        let Commands: any;
        let Controllers: any;
        let WhatsApp: any;
    }
}

// Globals Initialization
// TODO: Don't use globals like this, use dependency injection instead
globalThis.bot = {} as typeof bot;

bot.Store = {
    cmds: new Map(),
    cmdAliases: new Map(),
    cooldowns: {}
};

// Load Services, Modules, Utils, and Preferences
bot.Commands = Commands;
bot.Controllers = Controllers;
bot.Logger = new WinstonLogger().logger;
bot.Modules = Modules;

// Load Client
bot.WhatsApp = WhatsApp;

// Main Initialization Function
(async () => {
    try {
        await bot.Commands.initialize();
        await bot.WhatsApp.initialize();

        bot.Logger.info('ALL SERVICES RUNNING!');
    } catch (err) {
        bot.Logger.error(`[Main] Error encountered during initialization: ${err + err?.stack}`);
    }
})();
