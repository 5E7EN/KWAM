import { IMsgMeta } from '../types/message';

import { whatsapp as WhatsAppConfig } from '../constants';

class MessageRouter {
    handleMessage = async (msgMeta: IMsgMeta) => {
        const { message, user, isGroup, group } = msgMeta;

        // console.log(msgMeta);

        // Ignore if group is locked (only admins can send messages)
        if (msgMeta.isGroup && msgMeta.group.isLocked) return;

        // Add message to group cache
        const contextId = isGroup ? msgMeta.group.jid : msgMeta.user.jid;
        const groupCache = bot.Store.messageCache.get(contextId);
        if (groupCache) {
            groupCache.push(msgMeta);
        } else {
            bot.Store.messageCache.set(contextId, [msgMeta]);
        }

        // Print Message
        bot.Logger.debug(`[${isGroup ? group.name : user.number}] ${user.number}: ${message.text}`);

        // Ignore messages from self
        if (user.number === WhatsAppConfig.OPERATING_NUMBER) return;

        // Ignore messages from disabled groups
        // TODO: Is this really necessary, because I can just leave the group
        if (isGroup && group.enabled === false) return;

        // Check if message starts with prefix; then execute command
        if (message.trimmed.startsWith(WhatsAppConfig.PREFIX)) {
            await bot.Commands.execute(msgMeta);
        }
    };
}

export default new MessageRouter();
