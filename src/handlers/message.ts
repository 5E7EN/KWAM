import MessageHandlerParams from './../types';

export async function handleMessage({ client, msg, metadata }: MessageHandlerParams) {
    if (metadata.isGroup && metadata.groupMetaData.groupName === 'Test Group KWAM') {
        if (metadata.text.startsWith('!ping')) {
            client.sendMessage(metadata.remoteJid, { text: 'Pong!' });
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
    }

    console.log(`Received message: ${metadata.text}`);

    // const modelInfo = Util.getModelByPrefix(metadata.text);

    // if (!modelInfo) {
    //     if (ENV.Debug) {
    //         console.log("[Debug] Model '" + modelInfo + "' not found");
    //     }
    //     return;
    // }

    // let model = modelTable[modelInfo.name];
    // let prefix = modelInfo.name !== 'Custom' ? modelInfo.meta.prefix : '';

    // if (modelInfo.name === 'Custom') {
    //     if (!modelInfo.customMeta) return;
    //     const customModels = model as Array<CustomAIModel>;
    //     const potentialCustomModel = customModels.find((model) => model.modelName === modelInfo.customMeta?.meta.modelName);

    //     model = potentialCustomModel;
    //     prefix = modelInfo.customMeta.meta.prefix;
    // }

    // if (!model) {
    //     if (ENV.Debug) {
    //         console.log("[Debug] Model '" + JSON.stringify(modelInfo, null, 2) + "' is disabled or not found");
    //     }
    //     return;
    // }

    // const prompt: string = metadata.text.split(' ').slice(1).join(' ');
    // const messageResponse = await client.sendMessage(metadata.remoteJid, { text: ENV.Processing }, { quoted: msg });

    // model.sendMessage(
    //     {
    //         sender: metadata.sender,
    //         prompt: prompt,
    //         metadata: metadata,
    //         prefix: prefix
    //     },
    //     async (res: any, err: any) => {
    //         if (err) {
    //             client.sendMessage(metadata.remoteJid, {
    //                 text: "Sorry, i can't handle your request right now.",
    //                 edit: messageResponse?.key
    //             });
    //             console.error(err);
    //             return;
    //         }

    //         if (res.image) {
    //             // delete the old message
    //             if (messageResponse?.key) {
    //                 client.sendMessage(metadata.remoteJid, { delete: messageResponse.key });
    //             }
    //             client.sendMessage(metadata.remoteJid, res, { quoted: msg });
    //         } else {
    //             res.edit = messageResponse?.key;
    //             client.sendMessage(metadata.remoteJid, res);
    //         }
    //     }
    // );
}
