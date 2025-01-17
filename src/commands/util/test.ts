import { BaseCommand, type IRunParams } from '../../types/classes/commands';
import { EUserPermissions } from '../../types/permission';
import { ECooldownType } from '../../types/cooldown';

export default class TestCommand extends BaseCommand {
    name = 'test';
    description = 'Test command';
    category = 'Utility';
    usage = '<a1>';
    accessLevel = EUserPermissions.GroupAdmin;
    cooldown = { type: ECooldownType.UserCommand, length: 5 };

    public async run({ msgMeta, msgContext }: IRunParams): Promise<void> {
        msgContext.sendGroupMessage('Success!');
    }
}
