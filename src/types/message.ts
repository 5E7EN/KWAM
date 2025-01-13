import createWASocket from '@whiskeysockets/baileys';
import type { proto } from '@whiskeysockets/baileys';

/**
 * User level types. These are mostly inferred via the incoming message metadata - with the exception of 'owner'.
 * - User: Regular user in the WhatsApp group
 * - Admin: Admin of the WhatsApp group
 * - Superadmin: Creator of the WhatsApp group
 * - Owner: Bot owner
 */
export type TUserLevels = 'user' | 'admin' | 'superadmin' | 'owner';

/**
 * Message metadata object.
 * Contains information about the message, user, and group.
 */
export interface IMsgMeta {
    msgType: string;
    command: string;
    user: {
        name: string;
        number: string;
        jid: string;
    };
    message: {
        id: string;
        text: string;
        trimmed: string;
        rawKey: proto.IMessageKey;
        timestamp: number | Long.Long;
    };
    isGroup: boolean;
    group: {
        isLocked: boolean;
        name: string;
        jid: string;
    };
    args: string[];
}

/**
 * Message context object.
 * Includes methods for user interaction. Will eventually include data associated with the message origin, from the database.
 */
export interface IMsgContext {
    client: ReturnType<typeof createWASocket>;
    sendPrivateMessage: (message: string) => Promise<void>;
    replyPrivateMessage: (message: string) => Promise<void>;
    sendGroupMessage?: (message: string) => Promise<void>;
    replyGroupMessage?: (message: string) => Promise<void>;
    replyUsage: (usageString: string) => Promise<void>;
}

export type TMsgType =
    | 'unknown'
    | 'text'
    | 'extendedText'
    | 'image'
    | 'video'
    | 'document'
    | 'contact'
    | 'location'
    | 'audio';
