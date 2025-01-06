import type { IMsgMeta } from '../types/message';

interface CooldownOptions {
    type?: 'User' | 'Group' | 'UserCommand';
    mode?: 'add' | 'check' | 'remove';
    length?: number; // Applicable for 'add' mode
}

const cooldown = (
    commandName: string,
    msgMeta: IMsgMeta,
    options: CooldownOptions = {}
): boolean => {
    const botStore = bot.Store;

    // Default options
    options.type = options.type || 'UserCommand';
    options.mode = options.mode || 'add';

    // Initialize cooldown data structure if it doesn't exist
    if (!botStore.cooldowns[msgMeta.group.jid]) {
        botStore.cooldowns[msgMeta.group.jid] = { name: msgMeta.group.name, cooldown: 0 };
    }

    const groupCooldown = botStore.cooldowns[msgMeta.group.jid];

    if (!groupCooldown[commandName]) {
        groupCooldown[commandName] = { cooldown: 0 };
    }

    if (!groupCooldown[msgMeta.user.number]) {
        groupCooldown[msgMeta.user.number] = {
            name: msgMeta.user.name,
            number: msgMeta.user.number,
            cooldown: 0
        };
    }

    const now = Date.now();

    if (options.mode === 'add') {
        if (options.type === 'User') {
            groupCooldown[msgMeta.user.number].cooldown = now + (options.length || 0);
        }

        if (options.type === 'Group') {
            groupCooldown[commandName].cooldown = now + (options.length || 0);
        }

        if (options.type === 'UserCommand') {
            groupCooldown[msgMeta.user.number][commandName] = {
                cooldown: now + (options.length || 0)
            };
        }
    }

    if (options.mode === 'check') {
        const userCooldown = groupCooldown[msgMeta.user.number]?.cooldown;
        if (userCooldown > now) return true;

        const commandCooldown = groupCooldown[commandName]?.cooldown;
        if (commandCooldown > now) return true;

        const userCommandCooldown = groupCooldown[msgMeta.user.number]?.[commandName]?.cooldown;
        if (userCommandCooldown && userCommandCooldown > now) return true;

        return false;
    }

    if (options.mode === 'remove') {
        if (options.type === 'User') {
            groupCooldown[msgMeta.user.number].cooldown = now;
        }

        if (options.type === 'Group') {
            groupCooldown[commandName].cooldown = now;
        }

        if (options.type === 'UserCommand') {
            groupCooldown[msgMeta.user.number][commandName] = { cooldown: now };
        }
    }

    return false; // Default return for non-check modes
};

export default cooldown;
