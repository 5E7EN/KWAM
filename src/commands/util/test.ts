import type { ICommandParams } from '../../types/command';

async function run({ msgMeta, msgContext }: ICommandParams): Promise<void> {
    msgContext.sendGroupMessage('Hello world!');
}

export default {
    name: 'test',
    aliases: [],
    accessLevel: 'Owner',
    cooldown: { type: 'UserCommand', length: 5 },
    category: 'Utility',
    description: 'Test',
    run
};
