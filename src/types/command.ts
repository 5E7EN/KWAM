import type { TCooldownType } from './cooldown';
import type { IMsgContext, IMsgMeta } from './message';
import type { EUserPermissions } from './permission';

export interface ICommandParams {
    msgMeta: IMsgMeta;
    msgContext: IMsgContext;
}

// TODO: Actually use/infer this type in command files
export interface ICommandData {
    name: string;
    description: string;
    aliases?: string[];
    enabled?: boolean;
    pmOnly?: boolean;
    accessLevel: EUserPermissions;
    cooldown: { type: TCooldownType; length: number };
    usage?: string;
    category?: string;
    run: (commandParams: ICommandParams) => Promise<any>;
}
