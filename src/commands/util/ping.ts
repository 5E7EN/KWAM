import { BaseCommand, type IRunParams } from '../../types/classes/commands';
import { EUserPermissions } from '../../types/permission';
import { ECooldownType } from '../../types/cooldown';

export default class TestCommand extends BaseCommand {
    name = 'ping';
    description = 'Ping!';
    category = 'Utility';
    pmOnly = true;
    accessLevel = EUserPermissions.GroupAdmin;
    cooldown = { type: ECooldownType.UserCommand, length: 5 };

    async run({ msgMeta, msgContext }: IRunParams): Promise<void> {
        msgContext.sendGroupMessage('Hello world!');
    }
}
