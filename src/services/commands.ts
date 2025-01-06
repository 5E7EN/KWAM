import { readdir } from 'fs/promises';
import { performance } from 'perf_hooks';
import path from 'path';

import type { IMsgMeta } from '../types/message';
import type { ICommandData } from '../types/command';

class CommandHandler {
    async initialize(purge: boolean): Promise<void> {
        if (purge) {
            bot.Store.cmds.clear();
            bot.Store.cmdAliases.clear();
        }

        bot.Logger.verbose('[Command Manager] Initializing commands...');

        const isDev = process.env.NODE_ENV !== 'production';
        const commandDir = isDev ? './src/commands' : './dist/commands';

        const dirs = await readdir(commandDir);

        for (const dir of dirs) {
            const commands = (await readdir(path.join(commandDir, dir))).filter((file) =>
                isDev ? file.endsWith('.ts') : file.endsWith('.js')
            );

            for (const file of commands) {
                try {
                    const commandPath = path.resolve(commandDir, dir, file);

                    // Remove cached module for reloading during development
                    delete require.cache[require.resolve(commandPath)];

                    // Import the command
                    const pull: ICommandData = require(commandPath).default;

                    if (pull.name) {
                        bot.Store.cmds.set(pull.name, pull);
                    }

                    if (pull.aliases && Array.isArray(pull.aliases)) {
                        pull.aliases.forEach((alias) => bot.Store.cmdAliases.set(alias, pull.name));
                    }
                } catch (err) {
                    bot.Logger.error(`[Command Manager] Failed to load command ${file}: ${err}`);
                }
            }
        }

        bot.Logger.verbose(`[Command Manager] Registered ${bot.Store.cmds.size} commands.`);
    }

    async execute(msgMeta: IMsgMeta): Promise<void> {
        let commandData: ICommandData | undefined = bot.Store.cmds.get(msgMeta.command);

        if (!commandData) {
            commandData = bot.Store.cmds.get(bot.Store.cmdAliases.get(msgMeta.command));
        }

        if (commandData) {
            if (commandData.enabled === false) return;

            // if (
            //     (commandData.whisperOnly && msgMeta.group.name) ||
            //     (!commandData.whisperOnly && !msgMeta.group.name)
            // ) {
            //     return;
            // }

            // const permissionEnum = bot.Services.permission.enum;

            /********************** Permissions ***********************/
            // if (
            //     commandData.accessLevel === 'Owner' &&
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.BOT_OWNER
            //     )
            // )
            //     return;
            // if (
            //     commandData.accessLevel === 'GlobalAdmin' &&
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.GLOBAL_ADMIN
            //     )
            // )
            //     return;
            // if (
            //     commandData.accessLevel === 'Reporter' &&
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.REPORTER
            //     )
            // )
            //     return;
            // if (
            //     commandData.accessLevel === 'Broadcaster' &&
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.BROADCASTER
            //     )
            // )
            //     return;
            // if (
            //     commandData.accessLevel === 'ChannelAdmin' &&
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.CHANNEL_ADMIN
            //     )
            // )
            //     return;
            // if (
            //     commandData.accessLevel === 'Moderator' &&
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.MODERATOR
            //     )
            // )
            //     return;
            // if (!commandData.accessLevel)
            //     return bot.Logger.warn(
            //         `[Command Executer | Permissions] Unable to determine access level of command: ${commandData.name}.`
            //     );

            /********************** Cooldowns *************************/
            if (bot.Modules.cooldown(commandData.name, msgMeta, { mode: 'check' })) {
                return bot.Logger.verbose(
                    `[Command Executer | Cooldown] Cooldown enforced - User: ${msgMeta.user.number} | Group: #${msgMeta.group.name} | Command: ${commandData.name}.`
                );
            }

            // if (
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.GLOBAL_ADMIN
            //     ) &&
            //     !commandData.whisperOnly
            // ) {
            bot.Modules.cooldown(commandData.name, msgMeta, {
                mode: 'add',
                type: commandData.cooldown?.type || '',
                length: (commandData.cooldown?.length || 0) * 1000
            });
            // }

            /************************ Usage ***************************/
            if (commandData.usage && !msgMeta.args[commandData.usage.split(' ').length - 1]) {
                // if (!commandData.whisperOnly) {
                //     bot.Modules.cooldown(commandData.name, msgMeta, {
                //         mode: 'remove',
                //         type: commandData.cooldown?.type || ''
                //     });
                // }
                return msgMeta.replyUsage(commandData.usage);
            }

            /********************** Execution *************************/
            const execStart = performance.now();
            const commandResult = await commandData.run(msgMeta);
            const execTotal = Math.round(performance.now() - execStart);

            /**************** Post Execution & Logging ****************/
            // await this.logExecution(msgMeta, commandData, commandResult, execTotal);
        }
    }

    // async logExecution(
    //     msgMeta: IMsgMeta,
    //     commandData: ICommandData,
    //     commandResult: any,
    //     executionDuration: number
    // ): Promise<void> {
    //     const { user, channel, args } = msgMeta;
    //     const { name, category, accessLevel } = commandData;

    //     const query =
    //         'INSERT INTO command_logs (identifier, args, category, accessLevel, userName, userID, channelName, channelID, executionTimeMs, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    //     const insert = [
    //         name,
    //         args.join(' ') || null,
    //         category || null,
    //         accessLevel || null,
    //         user.login,
    //         user.id,
    //         channel.name,
    //         channel.id,
    //         executionDuration,
    //         JSON.stringify(commandResult) || null
    //     ];

    //     await bot.Database.pool.query(query, insert);
    // }
}

export default new CommandHandler();
