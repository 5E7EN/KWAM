import makeWASocket, {
    DisconnectReason,
    MessageUpsertType,
    useMultiFileAuthState,
    WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';

import { whatsapp as WhatsAppConfig } from '../constants';
import { IMsgMeta } from '../types/message';

class WhatsAppClient {
    public chatClient: ReturnType<typeof makeWASocket>;

    constructor() {}

    /**
     * @description Constructs the chat client, configures global message ratebucket, and connects to Twitch IRC servers.
     * @returns A `Promise` which resolves when the client has established a connection.
     */
    initialize = async () => {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        this.chatClient = makeWASocket({
            printQRInTerminal: true,
            auth: state
        });

        // Events
        this.chatClient.ev.on('connection.update', this.onConnectionUpdate);
        this.chatClient.ev.on('creds.update', saveCreds);
        this.chatClient.ev.on('messages.upsert', this.onMessage);

        // this.chatClient.on('connect', this.onConnect);
        // this.chatClient.on('ready', this.onReady);
        // this.chatClient.on('reconnect', this.onReconnect);
        // this.chatClient.on('error', this.onError);
        // this.chatClient.on('close', this.onClose);
        // this.chatClient.on('JOIN', this.onJoin);
        // this.chatClient.on('PART', this.onPart);
        // this.chatClient.on('PRIVMSG', this.onMessage);
        // this.chatClient.on('WHISPER', this.onWhisper);

        // TODO: Return a promise that resolves when the client is ready
    };

    /**
     * @description Called when the connection state of the client changes.
     */
    onConnectionUpdate = (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            bot.Logger.error(
                'Connection closed due to ',
                lastDisconnect.error,
                ', reconnecting ',
                shouldReconnect
            );

            // Reconnect if not logged out
            // if (shouldReconnect) {
            //     connectToWhatsApp();
            // }
        } else if (connection === 'open') {
            bot.Logger.info('[WhatsApp] Connected to Web.');
        }
    };

    /**
     * @description Called when a message is received from IRC.
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

                let msgType:
                    | 'unknown'
                    | 'text'
                    | 'extendedText'
                    | 'image'
                    | 'video'
                    | 'document'
                    | 'contact'
                    | 'location'
                    | 'audio' = 'unknown';

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

                // Message Properties
                const messageText = extendedTextMessage?.text || conversation || '';
                const isCommand = messageText.startsWith(WhatsAppConfig.PREFIX);
                const args = messageText.slice(WhatsAppConfig.PREFIX.length).trim().split(/ +/g);

                // Message Metadata
                const msgMeta: IMsgMeta = {
                    msgType,
                    command: isCommand ? args.shift().toLowerCase() : null,
                    args: isCommand ? args : null,
                    user: {
                        name: msg.pushName,
                        number: msg.key.participant.split('@')[0],
                        jid: msg.key.participant
                    },
                    message: {
                        id: msg.key.id,
                        text: messageText,
                        trimmed: messageText.trim(),
                        timestamp: msg.messageTimestamp,
                        rawKey: msg.key
                    },
                    group: {
                        isGroup: false,
                        // TODO: Should this be the default?
                        isLocked: false,
                        name: '', // Will be filled below, if message is from a group
                        jid: remoteJid,
                        // TODO: Eventually this should be pulled from DB
                        enabled: true
                    },

                    sendGroupMessage: async (message) => {
                        // TODO: Ensure it's actually a group before sending
                        await this.sendMsg(msgMeta, remoteJid, `${message}`);
                    },
                    replyGroupMessage: async (message) => {
                        // TODO: Implement
                    },
                    sendPrivateMessage: async (message) => {
                        await this.sendMsg(msgMeta, msgMeta.user.jid, `${message}`);
                    },
                    replyPrivateMessage: async (message) => {
                        // TODO: Implement
                    },
                    replyUsage: async (usageString) => {
                        // TODO: Implement
                    }
                };

                // Fill in group name if message is from a group
                if (remoteJid.endsWith('@g.us')) {
                    msgMeta.group.isGroup = true;

                    const groupMetadata = await this.chatClient.groupMetadata(remoteJid);

                    msgMeta.group.name = groupMetadata.subject;
                    msgMeta.group.isLocked = groupMetadata.restrict;
                }

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
