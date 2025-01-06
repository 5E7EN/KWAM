export interface IMsgMeta {
    msgType: string;
    command: string;
    user: {
        name: string; // senderName
        number: string; // message.key.participant.split('@')[0]
        jid: string; // message.key.participant
        // permissions: number[];
    };
    message: {
        id: string; // message.key.id
        text: string; // text
        trimmed: string; // text.trim()
        rawKey: any; // message.key
        timestamp: number | Long.Long; // message.messageTimestamp
    };
    group: {
        isGroup: boolean;
        isLocked: boolean;
        enabled: boolean; // Eventually this should be pulled from DB
        name: string; // groupMetadata.groupName
        jid: string; // remoteJid
    };
    args: string[];

    replyUsage: (usage: string) => Promise<void>;
    sendGroupMessage: (text: string) => Promise<void>;
    replyGroupMessage: (text: string) => Promise<void>;
    replyPrivateMessage: (text: string) => Promise<void>;
    sendPrivateMessage: (text: string) => Promise<void>;
}
