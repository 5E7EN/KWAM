export interface IMsgMeta {
    msgType: string;
    command: string;
    user: {
        name: string; // senderName
        number: string; // message.key.participant.split('@')[0]
        jid: string; // message.key.participant
        // permissions: number[];
        replyPrivateMessage: (text: string) => Promise<void>;
        sendPrivateMessage: (text: string) => Promise<void>;
    };
    message: {
        id: string; // message.key.id
        text: string; // text
        trimmed: string; // text.trim()
        rawKey: any; // message.key
        timestamp: number | Long.Long; // message.messageTimestamp
    };
    isGroup: boolean;
    group: {
        isLocked: boolean;
        name: string; // groupMetadata.groupName
        jid: string; // remoteJid,
        enabled: boolean; // Eventually this should be pulled from DB
        sendMessage: (text: string) => Promise<void>;
        replyMessage: (text: string) => Promise<void>;
    };
    args: string[];

    replyUsage: (usage: string) => Promise<void>;
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
