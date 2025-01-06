import type { WAProto } from '@whiskeysockets/baileys';

import MessageHandlerParams from './../types';

// Create message store
const messageStore: WAProto.IWebMessageInfo[] = [];

export async function handleMessage({ client, msg, metadata }: MessageHandlerParams) {
    console.log(`[${msg.key.id}] Received message: ${metadata.text}`);

    // Add message to store
    // TODO: Segregate messages on a per-group basis, with a max message buffer (cannot delete from over 2 days anyway)
    messageStore.push(msg);

    if (metadata.isGroup && metadata.groupMetaData.groupName === 'Test Group KWAM') {
        if (metadata.text.startsWith('!ping')) {
            client.sendMessage(msg.key.participant, { text: 'Pong!' });
        }

        if (metadata.text.startsWith('!getmembers')) {
            let replyBuilder = 'Members in this group:\n';
            const membersData = await client.groupFetchAllParticipating();

            // Get participants
            membersData[metadata.remoteJid].participants.forEach((participant) => {
                replyBuilder += `${participant.id.split('@')[0]}${
                    participant.admin
                        ? participant.admin === 'superadmin'
                            ? ' - Super Admin'
                            : ' - Admin'
                        : ''
                }\n`;
            });

            // Send message
            client.sendMessage(metadata.remoteJid, { text: replyBuilder });
        }

        // Kick specified user
        if (metadata.text.startsWith('!kick')) {
            // TODO: Ensure bot is an admin before continuing

            const target = metadata.text.split(' ')[1];

            if (!target) {
                client.sendMessage(metadata.remoteJid, { text: 'Please specify the target!' });
                return;
            }

            const targetId = target + '@s.whatsapp.net';
            const membersData = await client.groupFetchAllParticipating();

            // Ensure target is in the group
            if (
                !membersData[metadata.remoteJid].participants.find(
                    (participant) => participant.id === targetId
                )
            ) {
                client.sendMessage(metadata.remoteJid, { text: 'Target user not found in group!' });
                return;
            }

            // Kick the target
            await client.groupParticipantsUpdate(metadata.remoteJid, [targetId], 'remove');

            // Send message
            client.sendMessage(metadata.remoteJid, { text: 'User has been kicked!' });
        }

        // Delete specific message
        if (metadata.text.startsWith('!deletemessage')) {
            const targetMessageId = metadata.text.split(' ')[1];

            if (!targetMessageId) {
                client.sendMessage(metadata.remoteJid, { text: 'Please specify the target!' });
                return;
            }

            // Get target message from store
            const targetMessage = messageStore.find(
                (message) => message.key.id === targetMessageId
            );

            if (!targetMessage || !targetMessage.key) {
                client.sendMessage(metadata.remoteJid, {
                    text: 'Target message not found or its key is missing!'
                });
                return;
            }

            // Delete message by ID
            client.sendMessage(metadata.remoteJid, { delete: targetMessage.key });

            // Remove message from store
            messageStore.splice(
                messageStore.findIndex((message) => message.key.id === targetMessageId),
                1
            );
        }

        // Delete x amount of past (recorded) messages from a specific user
        if (metadata.text.startsWith('!deletemessage')) {
            const [, targetUser, messageCount] = metadata.text.split(' ');

            if (!targetUser) {
                client.sendMessage(metadata.remoteJid, { text: 'Please specify the target user!' });
                return;
            }

            if (!messageCount) {
                client.sendMessage(metadata.remoteJid, {
                    text: 'Please specify the amount of messages to delete from history!'
                });
                return;
            }

            // Get target messages from store, with the newest messages first
            const targetMessages = messageStore
                .filter((message) => message.key.participant.split('@')[0] === targetUser)
                .sort((a, b) => {
                    return Number(b.messageTimestamp) - Number(a.messageTimestamp);
                });

            if (!targetMessages.length) {
                client.sendMessage(metadata.remoteJid, {
                    text: 'No messages found from the target user in history!'
                });
                return;
            }

            // Delete messages
            targetMessages.slice(0, parseInt(messageCount)).forEach((message) => {
                console.log(`Deleting message: ${message.key.id}`);
                client.sendMessage(metadata.remoteJid, { delete: message.key });
            });
        }

        // Nuke x amount of past (recorded) messages containing a specific keyword
        // TODO: Add time range filter (e.g. last 1m, 1h, 1d, etc.)
        if (metadata.text.startsWith('!nuke')) {
            const phrase = metadata.text.split(' ').slice(1).join(' ');

            if (!phrase) {
                client.sendMessage(metadata.remoteJid, {
                    text: 'Please specify a banphrase to nuke!'
                });
                return;
            }

            // Get target messages from store, with the newest messages first
            const targetMessages = messageStore
                .filter((message) => message.message.extendedTextMessage.text.includes(phrase))
                .sort((a, b) => {
                    return Number(b.messageTimestamp) - Number(a.messageTimestamp);
                });

            if (!targetMessages.length) {
                client.sendMessage(metadata.remoteJid, {
                    text: 'No messages found from the target user in history!'
                });
                return;
            }

            // Delete messages
            targetMessages.forEach((message) => {
                console.log(`Deleting message: ${message.key.id}`);
                client.sendMessage(metadata.remoteJid, { delete: message.key });
            });
        }
    }
}
