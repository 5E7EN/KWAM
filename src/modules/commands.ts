import { injectable, inject, postConstruct } from 'inversify';
import { readdir } from 'fs/promises';
import { performance } from 'perf_hooks';
import path from 'path';

import { whatsapp as WhatsAppConfig } from '../constants';
import { EUserPermissions } from '../types/permission';
import type { ICommandsModule } from '../types/classes';
import type { PermissionModule } from './permission';
import type { CooldownModule } from './cooldown';
import type { BaseLogger } from '../utilities/logger';
import type { IMsgContext, IMsgMeta } from '../types/message';
import type { ICommandData } from '../types/command';

import { TYPES } from '../constants';

@injectable()
export class CommandsModule implements ICommandsModule {
    private _logger: BaseLogger;
    private _cooldownModule: CooldownModule;
    private _permissionModule: PermissionModule;
    private readonly _commands = new Map<string, ICommandData>();
    private readonly _aliases = new Map<string, string>();

    public constructor(
        @inject(TYPES.BaseLogger) logger: BaseLogger,
        @inject(TYPES.CooldownModule) cooldownModule: CooldownModule,
        @inject(TYPES.PermissionModule) permissionModule: PermissionModule
    ) {
        this._logger = logger;
        this._cooldownModule = cooldownModule;
        this._permissionModule = permissionModule;
    }

    @postConstruct()
    public async init(): Promise<void> {
        await this.loadCommands();
    }

    // TODO: Instead of these kind of hacky commands, use classes (since this is typescript and can't add files on the go anyway)
    public async loadCommands(purgeExisting?: boolean): Promise<void> {
        if (purgeExisting) {
            this._commands.clear();
            this._aliases.clear();
        }

        this._logger.verbose('Initializing commands...');

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

                    this.addCommand(pull);
                } catch (error) {
                    this._logger.error(`Failed to load command ${file}: ${error + error?.stack}`);
                }
            }
        }

        this._logger.verbose(`Registered ${this._commands.size} commands.`);
    }

    public async executeCommand(msgMeta: IMsgMeta, msgContext: IMsgContext): Promise<void> {
        const commandData = this.getCommand(msgMeta.command);

        if (commandData && commandData.enabled !== false) {
            // if (
            //     (commandData.whisperOnly && msgMeta.group.name) ||
            //     (!commandData.whisperOnly && !msgMeta.group.name)
            // ) {
            //     return;
            // }

            /********************** Permissions ***********************/
            const userPermissions = await this._permissionModule.getUserPermissions(
                msgMeta,
                msgContext
            );

            // Enforce permissions
            if (
                commandData.accessLevel === EUserPermissions.User &&
                !this._permissionModule.isPermitted(userPermissions, EUserPermissions.User)
            )
                return;
            if (
                commandData.accessLevel === EUserPermissions.GroupAdmin &&
                !this._permissionModule.isPermitted(userPermissions, EUserPermissions.GroupAdmin)
            )
                return;
            if (
                commandData.accessLevel === EUserPermissions.GroupOwner &&
                !this._permissionModule.isPermitted(userPermissions, EUserPermissions.GroupOwner)
            )
                return;
            if (
                commandData.accessLevel === EUserPermissions.BotOwner &&
                !this._permissionModule.isPermitted(userPermissions, EUserPermissions.BotOwner)
            )
                return;
            if (
                commandData.accessLevel === undefined ||
                (commandData.accessLevel && !(commandData.accessLevel in EUserPermissions))
            ) {
                this._logger.warn(
                    `[Permissions] Unable to determine access level of command: ${commandData.name}.`
                );
                return;
            }

            /********************** Cooldowns *************************/
            // Check if any cooldown is active
            const cooldowns = this._cooldownModule.checkAny(commandData.name, msgMeta);
            const activeCooldown = Object.values(cooldowns).find((cd) => cd?.isOnCooldown);
            if (activeCooldown) {
                const { type, remainingTimeMs } = activeCooldown!;
                this._logger.verbose(
                    `Cooldown enforced - Type: ${type} | Remaining: ${remainingTimeMs}ms | User: ${msgMeta.user.number} | Group: ${msgMeta.group.name} | Command: ${commandData.name}`
                );
                return;
            }

            // if (
            //     !bot.Services.permission.isPermitted(
            //         msgMeta.user.permissions,
            //         permissionEnum.GLOBAL_ADMIN
            //     ) &&
            //     !commandData.whisperOnly
            // ) {
            if (commandData.cooldown) {
                this._cooldownModule.add(
                    msgMeta,
                    commandData.cooldown.type,
                    (commandData.cooldown.length || 1) * 1000,
                    commandData.name
                );
            }
            // }

            /************************ Usage ***************************/
            if (commandData.usage && !msgMeta.args[commandData.usage.split(' ').length - 1]) {
                // if (!commandData.whisperOnly) {
                //     bot.Modules.cooldown(commandData.name, msgMeta, {
                //         mode: 'remove',
                //         type: commandData.cooldown?.type || ''
                //     });
                // }
                return msgContext.replyUsage(commandData.usage);
            }

            /********************** Execution *************************/
            const execStart = performance.now();
            const commandResult = await commandData.run({ msgMeta, msgContext });
            const execTotal = Math.round(performance.now() - execStart);

            /**************** Post Execution & Logging ****************/
            // await this.logExecution(msgMeta, commandData, commandResult, execTotal);
        }
    }

    /**
     * Adds a command to the command registry.
     * @param command The command data object to add.
     */
    private addCommand(command: ICommandData): void {
        if (command.name) {
            this._commands.set(command.name, command);
        }
        if (command.aliases) {
            command.aliases.forEach((alias) => this._aliases.set(alias, command.name));
        }
    }

    /**
     * Retrieves a command from the registry by its name or alias.
     * @param name The name or alias of the command to retrieve.
     * @returns The command data object, or null if not found.
     */
    private getCommand(name: string): ICommandData | null {
        return this._commands.get(name) ?? this._commands.get(this._aliases.get(name)) ?? null;
    }

    // async private logExecution(
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
