import { IMsgMeta } from '../types/message';

import { whatsapp as WhatsAppConfig } from '../constants';

class MessageRouter {
    handleMessage = async (msgMeta: IMsgMeta) => {
        const { message, user, isGroup, group } = msgMeta;

        // Ignore messages from self
        if (user.number === WhatsAppConfig.OPERATING_NUMBER) return;

        // Ignore messages from disabled groups
        // TODO: Is this really necessary, because I can just leave the group
        if (isGroup && group.enabled === false) return;

        // Ignore if group is locked (only admins can send messages)
        // TODO: Does this belong here? Technically we should still handle the incoming message (not sure for what purpose yet though...)
        if (msgMeta.isGroup && msgMeta.group.isLocked) return;

        // Add message to group cache
        // TODO: Refactor this implementation to have it accessible inside an object passed to command `run`s (via msgMeta?)
        const contextId = isGroup ? msgMeta.group.jid : msgMeta.user.jid;
        const groupCache = bot.Store.messageCache.get(contextId);
        if (groupCache) {
            groupCache.push(msgMeta);
        } else {
            bot.Store.messageCache.set(contextId, [msgMeta]);
        }

        // Print Message
        bot.Logger.debug(`[${isGroup ? group.name : user.number}] ${user.number}: ${message.text}`);

        // Check if message starts with prefix; then execute command
        if (message.trimmed.startsWith(WhatsAppConfig.PREFIX)) {
            await bot.Commands.execute(msgMeta);
        }
    };
}

export default new MessageRouter();
