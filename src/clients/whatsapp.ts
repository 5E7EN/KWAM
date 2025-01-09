import { injectable, inject, postConstruct } from 'inversify';
import createWASocket, {
    ConnectionState,
    DisconnectReason,
    GroupMetadata,
    MessageUpsertType,
    useMultiFileAuthState,
    WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

import { whatsapp as WhatsAppConfig } from '../constants';
import { IMsgMeta, TMsgType } from '../types/message';

import type { IWhatsappClient } from '../types/classes/clients/whatsapp';
import type { MessageController } from '../controllers/message-router';
import type { BaseLogger } from '../utils/logger';

import { TYPES } from '../constants';

@injectable()
export class WhatsappClient implements IWhatsappClient {
    public chatClient: ReturnType<typeof createWASocket>;
    // Keep track of when the client connected so that old messages aren't processed (as they will flood in after bot inactivity)
    private timeOfConnect: number;
    private readonly _logger: BaseLogger;
    private readonly _messageController: MessageController;

    public constructor(
        @inject(TYPES.BaseLogger) logger: BaseLogger,
        @inject(TYPES.MessageController) messageController: MessageController
    ) {
        this._logger = logger;
        this._messageController = messageController;
    }

    @postConstruct()
    public async init(): Promise<void> {
        await this.connectWhatsapp();
    }

    /**
     * Initializes and connects the WhatsApp client socket.
     * @returns A promise that resolves when the client has connected successfully, or rejects if an error occurs.
     */
    private connectWhatsapp = async (): Promise<void> => {
        let initialEventFired = false;
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        this.chatClient = createWASocket({
            printQRInTerminal: true,
            auth: state
        });

        // Events
        this.chatClient.ev.on('connection.update', this.onConnectionUpdate);
        this.chatClient.ev.on('creds.update', saveCreds);
        this.chatClient.ev.on('messages.upsert', this.onMessage);

        // Return a promise that resolves when the client is ready
        return new Promise((resolve, reject) => {
            this.chatClient.ev.on('connection.update', (update) => {
                // Ensure callbacks are only called once (since there's no way to de-register from this listener after it fired already, which would be ideal)
                if (initialEventFired) return;

                if (update.connection === 'open') {
                    initialEventFired = true;
                    resolve();
                } else if (update.connection === 'close') {
                    initialEventFired = true;
                    reject(update.lastDisconnect.error);
                }
            });
        });
    };

    /**
     * Called when the connection state changes.
     * @param update - The connection state update.
     * @returns Nothing. Just a pintel'e function.
     */
    private onConnectionUpdate = (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect } = update;

        switch (connection) {
            case 'connecting':
                this._logger.info('Connecting...');
                break;
            case 'open':
                this._logger.info('Connected to Web.');
                // Set the time of connect so that old messages aren't processed
                this.timeOfConnect = Date.now();
                break;
            case 'close':
                const shouldReconnect =
                    (lastDisconnect.error as Boom)?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                this._logger.error(
                    `[${
                        shouldReconnect ? 'RECONNECTING' : 'NOT_RECONNECTING'
                    }] Connection closed: ${lastDisconnect.error.message} - ${
                        lastDisconnect.error.stack
                    }`
                );

                // Reconnect if not logged out
                if (shouldReconnect) {
                    this.connectWhatsapp();
                }

                break;

            default:
                break;
        }
    };

    /**
     * Called when new messages are received.
     * @param client - The WhatsApp client instance.
     * @param messages - The messages that were received.
     * @param type - The type of message upsert (e.g., 'append', 'notify' - see MessageUpsertType type for description).
     * @returns Nothing. Just a pintel'e function.
     */
    private onMessage = async ({
        client,
        messages,
        type
    }: {
        client: ReturnType<typeof createWASocket>;
        messages: WAMessage[];
        type: MessageUpsertType;
    }) => {
        Promise.all(
            messages.map(async (msg) => {
                // Ignore messages that were sent before the bot came online
                if (Number(msg.messageTimestamp) * 1000 < this.timeOfConnect) return;

                // Ignore if no remoteJid somehow
                const remoteJid = msg.key.remoteJid;
                if (!remoteJid) return;

                // Ignore if no message somehow
                if (!msg.message) return;

                // Get message type and text
                const messageType = this.getMessageType(msg);
                const messageText = this.getMessageText(msg);

                // Ignore if message type is unknown
                if (messageType === 'unknown') return;

                // Determine if message is a command
                const isCommand = messageText.startsWith(WhatsAppConfig.PREFIX);
                const args = messageText.slice(WhatsAppConfig.PREFIX.length).trim().split(/ +/g);

                // Fetch group metadata, if applicable
                const isGroup = remoteJid.endsWith('@g.us');
                let groupMetadata: GroupMetadata = null;
                if (isGroup) {
                    try {
                        groupMetadata = await this.chatClient.groupMetadata(remoteJid);
                    } catch (err) {
                        this._logger.error(`Failed to fetch group metadata: ${err.message}`);
                    }
                }

                // Determine sender JID
                const fromUserJid = isGroup ? msg.key.participant : msg.key.remoteJid;

                // Construct message metadata object
                // TODO: This msgMeta object should really only contain data directly related to the message
                // TODO: Create a separate object for internal data/methods associated with the message/its origin
                const msgMeta: IMsgMeta = {
                    msgType: messageType,
                    command: isCommand ? args.shift().toLowerCase() : null,
                    args: isCommand ? args : null,
                    user: {
                        name: msg.pushName,
                        number: fromUserJid.split('@')[0],
                        jid: fromUserJid,
                        sendPrivateMessage: async (message) => {
                            await this.sendMsg(msgMeta, msgMeta.user.jid, `${message}`);
                        },
                        replyPrivateMessage: async (message) => {
                            // TODO: Implement
                        }
                    },
                    message: {
                        id: msg.key.id,
                        text: messageText,
                        trimmed: messageText.trim(),
                        timestamp: msg.messageTimestamp,
                        rawKey: msg.key
                    },
                    isGroup,
                    group: isGroup
                        ? {
                              isLocked: groupMetadata.announce,
                              name: groupMetadata.subject,
                              jid: remoteJid,
                              enabled: true, // TODO: Eventually this should be pulled from DB
                              sendMessage: async (message) => {
                                  await this.sendMsg(msgMeta, remoteJid, `${message}`);
                              },
                              replyMessage: async (message) => {
                                  // TODO: Implement
                              }
                          }
                        : null,

                    replyUsage: async (usageString) => {
                        // TODO: Implement
                        // If message originated from a group, reply in the group, otherwise reply privately
                    }
                };

                // Forward Message to Router
                this._messageController.handleMessage(this.chatClient, msgMeta);
            })
        );
    };

    /**
     * Sends a WhatsApp message via the Baileys client.
     * @param msgMeta - Metadata about the message being sent.
     * @param jid - JID (WhatsApp ID) of the recipient.
     * @param message - The message content to be sent.
     * @returns A promise that resolves when the message has been delivered successfully.
     */
    private sendMsg = async (msgMeta: IMsgMeta, jid: string, message: string) => {
        try {
            await this.chatClient.sendMessage(jid, { text: message });
        } catch (err) {
            this._logger.error(
                `[WhatsApp | Message Sender] Error sending message: ${err + err?.stack}`
            );
        }
    };

    /**
     * Determines the type of a received WhatsApp message.
     * @param msg - The received message object.
     * @returns The type of the message (e.g., text, image, video).
     */
    private getMessageType = (msg: WAMessage) => {
        const {
            extendedTextMessage,
            imageMessage,
            videoMessage,
            audioMessage,
            documentMessage,
            contactMessage,
            locationMessage,
            conversation
        } = msg.message;

        let msgType: TMsgType = 'unknown';

        if (conversation) msgType = 'text';
        else if (extendedTextMessage) msgType = 'text';
        else if (imageMessage) msgType = 'image';
        else if (videoMessage) msgType = 'video';
        else if (audioMessage) msgType = 'audio';
        else if (documentMessage) msgType = 'document';
        else if (contactMessage) msgType = 'contact';
        else if (locationMessage) msgType = 'location';

        return msgType;
    };

    /**
     * Extracts the text content from a received WhatsApp message.
     * @param msg - The received message object.
     * @returns The text content of the message, or `null` if none exists.
     */
    private getMessageText = (msg: WAMessage): string | null => {
        const {
            extendedTextMessage,
            imageMessage,
            videoMessage,
            audioMessage,
            documentMessage,
            contactMessage,
            locationMessage,
            conversation
        } = msg.message;

        let msgText = '';

        if (conversation) msgText = conversation;
        else if (extendedTextMessage) msgText = extendedTextMessage.text;
        else if (imageMessage) msgText = imageMessage.caption;
        else if (videoMessage) msgText = videoMessage.caption;
        else if (audioMessage) msgText = null; // Audio clip messages don't come with any text
        else if (documentMessage) msgText = documentMessage.caption;
        else if (contactMessage) msgText = contactMessage.vcard;
        else if (locationMessage) msgText = locationMessage.name;

        return msgText;
    };
}
