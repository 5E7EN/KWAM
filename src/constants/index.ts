import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const app = {
    ENVIRONMENT: process.env.NODE_ENV,
    LOG_LEVEL: process.env.NODE_ENV
};

export const whatsapp = {
    OPERATING_NUMBER: process.env.OPERATING_NUMBER || '',
    PREFIX: process.env.Twitch_Prefix || '!'
};

export const chatCache = {
    maxMessagesInCache: 5000,
    nukeDepth: 200
};

export const misc = {
    BOT_OWNER: { name: '5E7EN', number: process.env.OWNER_NUMBER }
};

export const TYPES = {
    WhatsappClient: Symbol.for('WhatsappClient'),

    BaseLogger: Symbol.for('BaseLogger'),

    CooldownModule: Symbol.for('CooldownModule'),
    CommandsModule: Symbol.for('CommandsModule'),

    MessageController: Symbol('MessageController')
};
