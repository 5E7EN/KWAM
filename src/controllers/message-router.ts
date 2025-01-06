import { IMsgMeta } from '../types/message';

import { whatsapp as WhatsAppConfig } from '../constants';

class MessageRouter {
    handleMessage = async (msgMeta: IMsgMeta) => {
        const { message, user, group } = msgMeta;

        console.log(msgMeta);

        // Ignore if group is locked (only admins can send messages)
        if (msgMeta.group.isGroup && msgMeta.group.isLocked) return;

        // Update Message Cache
        // msgMeta.channel.cache.addMessage(user.login, message.text, group.name);

        let author = `@${user.number}`;

        // Print Message
        bot.Logger.silly(`[#${group.name}] ${author}: ${message.text}`);

        // Ignore Self
        // if (user.login === bot.Constants.twitch.USERNAME.toLowerCase()) return;

        if (!group.enabled) return;

        // Check if message starts with prefix; then execute command
        if (message.trimmed.startsWith(WhatsAppConfig.PREFIX)) {
            await bot.Commands.execute(msgMeta);
        }
    };
}

export default new MessageRouter();
