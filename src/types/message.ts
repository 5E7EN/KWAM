export interface IMsgMeta {
    msgType: string;
    command: string;
    user: {
        name: string;
        number: string;
        jid: string;
        replyPrivateMessage: (text: string) => Promise<void>;
        sendPrivateMessage: (text: string) => Promise<void>;
    };
    message: {
        id: string;
        text: string;
        trimmed: string;
        rawKey: any;
        timestamp: number | Long.Long;
    };
    isGroup: boolean;
    group: {
        isLocked: boolean;
        name: string;
        jid: string;
        enabled: boolean;
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
