import type { ICommandParams } from '../../types/command';

async function run({ msgMeta, msgContext }: ICommandParams): Promise<void> {
    msgContext.sendGroupMessage('Pong!');
}

export default {
    name: 'ping',
    aliases: [],
    accessLevel: 'owner',
    cooldown: { type: 'UserCommand', length: 5 },
    category: 'Utility',
    description: 'Test',
    run
};
