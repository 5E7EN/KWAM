import type { TCooldownType } from './cooldown';
import type { IMsgMeta } from './message';

export interface ICommandParams {
    msgMeta: IMsgMeta;
}

// TODO: Actually use/infer this type in command files
export interface ICommandData {
    name: string;
    aliases?: string[];
    enabled?: boolean;
    pmOnly?: boolean;
    accessLevel?: string;
    cooldown?: { type: TCooldownType; length: number };
    usage?: string;
    category?: string;
    run: (commandParams: ICommandParams) => Promise<any>;
}
