import type createWASocket from '@whiskeysockets/baileys';
import type { IMsgMeta } from '../../message';

export interface IMessageController {
    /**
     * Handles and processes an incoming message (including command execution).
     *
     * @param client - The WhatsApp socket instance.
     * @param msgMeta - Metadata of the received message.
     * @returns A promise that resolves when the message handling process is complete.
     */
    handleMessage(client: ReturnType<typeof createWASocket>, msgMeta: IMsgMeta): Promise<void>;
}
