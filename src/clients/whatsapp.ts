import makeWASocket, {
    ConnectionState,
    DisconnectReason,
    MessageUpsertType,
    useMultiFileAuthState,
    WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

import { whatsapp as WhatsAppConfig } from '../constants';
import { IMsgMeta, TMsgType } from '../types/message';

class WhatsAppClient {
    public chatClient: ReturnType<typeof makeWASocket>;
    // Keep track of when the client connected so that old messages aren't processed (as they will flood in after bot inactivity)
    private timeOfConnect: number;

    constructor() {}

    /**
     * @description Constructs the chat client, configures global message ratebucket, and connects to Twitch IRC servers.
     * @returns A `Promise` which resolves when the client has established a connection.
     */
    initialize = async (): Promise<void> => {
        let initialEventFired = false;
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        this.chatClient = makeWASocket({
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
     * @description Called when the connection state of the client changes.
     */
    onConnectionUpdate = (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect } = update;

        switch (connection) {
            case 'connecting':
                bot.Logger.info('[WhatsApp] Connecting...');
                break;
            case 'open':
                bot.Logger.info('[WhatsApp] Connected to Web.');
                // Set the time of connect so that old messages aren't processed
                this.timeOfConnect = Date.now();
                break;
            case 'close':
                const shouldReconnect =
                    (lastDisconnect.error as Boom)?.output?.statusCode !==
                    DisconnectReason.loggedOut;

                bot.Logger.error(
                    `[${
                        shouldReconnect ? 'RECONNECTING' : 'NOT_RECONNECTING'
                    }] Connection closed: ${lastDisconnect.error.message} - ${
                        lastDisconnect.error.stack
                    }`
                );

                // Reconnect if not logged out
                if (shouldReconnect) {
                    this.initialize();
                }

                break;

            default:
                break;
        }
    };

    /**
     * @description Called when a message is received on WhatsApp.
     */
    onMessage = async ({
        client,
        messages,
        type
    }: {
        client: ReturnType<typeof makeWASocket>;
        messages: WAMessage[];
        type: MessageUpsertType;
    }) => {
        Promise.all(
            messages.map(async (msg) => {
                // Ignore messages that were sent before the bot connected
                if (Number(msg.messageTimestamp) * 1000 < this.timeOfConnect) return;

                const { fromMe, remoteJid } = msg.key;
                if (!remoteJid) return;

                // Check if no message
                const message = msg.message;
                if (!msg.message) return;

                const {
                    extendedTextMessage,
                    imageMessage,
                    videoMessage,
                    audioMessage,
                    documentMessage,
                    contactMessage,
                    locationMessage,
                    conversation
                } = message;

                let msgType: TMsgType = 'unknown';

                if (conversation) msgType = 'text';
                else if (extendedTextMessage) msgType = 'text';
                else if (imageMessage) msgType = 'image';
                else if (videoMessage) msgType = 'video';
                else if (audioMessage) msgType = 'audio';
                else if (documentMessage) msgType = 'document';
                else if (contactMessage) msgType = 'contact';
                else if (locationMessage) msgType = 'location';

                // Ignore if message type is unknown
                // TODO: Delete, debugging only
                console.log('MsgTYPE:', msgType);
                console.log('---', msgType);
                if (msgType === 'unknown') return;

                // Extract message text
                const messageText = extendedTextMessage?.text || conversation || '';
                // Determine if message is a command
                const isCommand = messageText.startsWith(WhatsAppConfig.PREFIX);
                const args = messageText.slice(WhatsAppConfig.PREFIX.length).trim().split(/ +/g);

                // Fetch group metadata, if applicable
                const isGroup = remoteJid.endsWith('@g.us');
                let groupMetadata = null;
                if (isGroup) {
                    try {
                        groupMetadata = await this.chatClient.groupMetadata(remoteJid);
                    } catch (err) {
                        bot.Logger.error(
                            `[WhatsApp] Failed to fetch group metadata: ${err.message}`
                        );
                    }
                }

                // Determine sender JID
                const fromUserJid = isGroup ? msg.key.participant : msg.key.remoteJid;

                // Construct message metadata object
                // TODO: This msgMeta object should really only contain data directly related to the message
                // TODO: Create a separate object for internal data/methods associated with the message/its origin
                const msgMeta: IMsgMeta = {
                    msgType,
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
                              isLocked: groupMetadata.restrict,
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
                bot.Controllers.messageRouter.handleMessage(msgMeta);
            })
        );
    };

    /**
     * @description Sends a WhatsApp message via the Baileys client.
     * @param msgMeta Message meta object.
     * @param jid jid in which to deliver the message.
     * @param message Message string.
     * @returns A `Promise` which resolves when the message has been delivered successfully.
     */
    sendMsg = async (msgMeta: IMsgMeta, jid: string, message: string) => {
        try {
            await this.chatClient.sendMessage(jid, { text: message });
        } catch (err) {
            bot.Logger.error(
                `[WhatsApp | Message Sender] Error sending message: ${err + err?.stack}`
            );
        }
    };
}

export default new WhatsAppClient();
