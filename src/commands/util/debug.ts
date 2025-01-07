import { IMsgMeta } from '../../types/message';

const run = async (d: IMsgMeta): Promise<void> => {
    d.group.sendMessage('Hello world!');
};

export default {
    name: 'test',
    aliases: [],
    accessLevel: 'Owner',
    cooldown: { type: 'UserCommand', length: 1 },
    category: 'Utility',
    description: 'Test',
    run
};
