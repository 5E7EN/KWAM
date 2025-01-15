import dotenv from 'dotenv';

import { EUserPermissions } from '../types/permission';

// Load environment variables from .env file
dotenv.config();

export const app = {
    ENVIRONMENT: process.env.NODE_ENV,
    LOG_LEVEL: process.env.NODE_ENV
};

export const whatsapp = {
    OWNER_NUMBER: process.env.OWNER_NUMBER || '',
    OPERATING_NUMBER: process.env.OPERATING_NUMBER || '',
    PREFIX: process.env.Twitch_Prefix || '!'
};

export const chatCache = {
    maxMessagesInCache: 5000,
    nukeDepth: 200
};

// Permissions hierarchy
//* This list defines the child permissions for each permission level.
//* E.g. BotOwner includes all permissions, GroupOwner includes GroupAdmin and User, etc.
//* Decided not to support nested permissions, as it would be overkill for this project as of now.
// TODO: Put this into a parent object for categorization (like "whatsapp" and "app" above)
export const permissionHierarchy: Record<EUserPermissions, EUserPermissions[]> = {
    [EUserPermissions.BotOwner]: [
        EUserPermissions.GroupOwner,
        EUserPermissions.GroupAdmin,
        EUserPermissions.User
    ],
    [EUserPermissions.GroupOwner]: [EUserPermissions.GroupAdmin, EUserPermissions.User],
    [EUserPermissions.GroupAdmin]: [EUserPermissions.User],
    [EUserPermissions.User]: [] // Base level, contains no child permissions
};

export const misc = {
    BOT_OWNER: { name: '5E7EN', number: process.env.OWNER_NUMBER }
};

export const TYPES = {
    WhatsappClient: Symbol.for('WhatsappClient'),

    BaseLogger: Symbol.for('BaseLogger'),

    CooldownModule: Symbol.for('CooldownModule'),
    CommandsModule: Symbol.for('CommandsModule'),
    PermissionModule: Symbol.for('PermissionModule'),

    MessageController: Symbol('MessageController')
};
