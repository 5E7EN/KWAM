import { EUserPermissions } from '../../types/permission';
import type { ICommandParams } from '../../types/command';

async function run({ msgMeta, msgContext }: ICommandParams): Promise<void> {
    msgContext.sendGroupMessage('Pong!');
}

export default {
    name: 'ping',
    aliases: [],
    accessLevel: EUserPermissions.BotOwner,
    cooldown: { type: 'UserCommand', length: 5 },
    category: 'Utility',
    description: 'Test',
    run
};
