import type { ICommandParams } from '../../types/command';

async function run({ msgMeta }: ICommandParams): Promise<void> {
    msgMeta.group.sendMessage('Pong!');
}

export default {
    name: 'ping',
    aliases: [],
    accessLevel: 'Owner',
    cooldown: { type: 'UserCommand', length: 5 },
    category: 'Utility',
    description: 'Test',
    run
};
