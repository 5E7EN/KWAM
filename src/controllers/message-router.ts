import { injectable, inject } from 'inversify';
import type createWASocket from '@whiskeysockets/baileys';

import { whatsapp as WhatsAppConfig } from '../constants';
import type { IMessageController } from '../types/classes';
import type { IMsgContext, IMsgMeta } from '../types/message';
import type { CommandsModule } from '../modules/commands';
import type { BaseLogger } from '../utilities/logger';

import { TYPES } from '../constants';

@injectable()
export class MessageController implements IMessageController {
    private _logger: BaseLogger;
    private _commandsModule: CommandsModule;

    public constructor(
        @inject(TYPES.BaseLogger) logger: BaseLogger,
        @inject(TYPES.CommandsModule) commandsModule: CommandsModule
    ) {
        this._logger = logger;
        this._commandsModule = commandsModule;
    }

    public async handleMessage(
        client: ReturnType<typeof createWASocket>,
        msgMeta: IMsgMeta,
        msgContext: IMsgContext
    ): Promise<void> {
        const { message, user, isGroup, group } = msgMeta;

        // Ignore messages from self
        // TODO: Debug; uncomment this (unless the project becomes a selfbot bot)
        // if (user.number === WhatsAppConfig.OPERATING_NUMBER) return;

        // Ignore if group is locked (only admins can send messages)
        // TODO: Does this belong here? Technically we should still handle the incoming message (not sure for what purpose yet though...)
        if (msgMeta.isGroup && msgMeta.group.isLocked) return;

        // Mark message as read
        client.readMessages([message.rawKey]);

        // Print message to console
        this._logger.debug(
            `[${isGroup ? group.name : user.number}] ${user.number}: ${message.text}`
        );

        // Check if message starts with prefix; then execute command
        if (message.trimmed.startsWith(WhatsAppConfig.PREFIX)) {
            await this._commandsModule.executeCommand(msgMeta, msgContext);
        }
    }
}
