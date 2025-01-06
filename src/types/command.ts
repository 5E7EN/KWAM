import type { IMsgMeta } from './message';

export interface ICommandData {
    name: string;
    aliases?: string[];
    enabled?: boolean;
    whisperOnly?: boolean;
    accessLevel?: string;
    cooldown?: { type: string; length: number };
    usage?: string;
    category?: string;
    run: (msgMeta: IMsgMeta) => Promise<any>;
}
