import { injectable, inject, postConstruct } from 'inversify';
import { readdir } from 'fs/promises';
import { performance } from 'perf_hooks';
import path from 'path';

import { EUserPermissions } from '../types/permission';
import { BaseCommand } from '../types/classes/commands';
import type { ICommandsModule } from '../types/classes';
import type { PermissionModule } from './permission';
import type { CooldownModule } from './cooldown';
import type { BaseLogger } from '../utilities/logger';
import type { IMsgContext, IMsgMeta } from '../types/message';

import { TYPES } from '../constants';

@injectable()
export class CommandsModule implements ICommandsModule {
    private _logger: BaseLogger;
    private _cooldownModule: CooldownModule;
    private _permissionModule: PermissionModule;
    private readonly _commands = new Map<string, BaseCommand>();
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
            // Skip if not a directory
            if (dir.includes('.')) continue;

            const files = (await readdir(path.join(commandDir, dir))).filter((file) =>
                isDev ? file.endsWith('.ts') : file.endsWith('.js')
            );

            for (const file of files) {
                const filePath = path.resolve(commandDir, dir, file);

                try {
                    // Import the command dynamically
                    const CommandClass = (await import(filePath)).default;

                    if (!(CommandClass?.prototype instanceof BaseCommand)) {
                        throw new Error(`File does not export a valid BaseCommand class.`);
                    }

                    const commandInstance = new CommandClass() as BaseCommand;
                    // Run validation to ensure command is properly implemented
                    commandInstance.validate();

                    // Add command to registry
                    this.addCommand(commandInstance);
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
            // Get user permissions
            const userPermissions = await this._permissionModule.getUserPermissions(
                msgMeta,
                msgContext
            );

            // Enforce permissions
            if (
                commandData.accessLevel === undefined ||
                (commandData.accessLevel && !(commandData.accessLevel in EUserPermissions))
            ) {
                // TODO: This check probably isn't necessary, since the command validation should catch this
                this._logger.warn(
                    `[Executor] Unable to determine access level of command: ${commandData.name}.`
                );
                return;
            }
            if (!this._permissionModule.hasPermission(userPermissions, commandData.accessLevel)) {
                this._logger.debug(
                    `[Executor] Access denied; insufficient permissions - 
                    User: ${msgMeta.user.number}
                    Group: ${msgMeta.group.name}
                    Command: ${commandData.name}
                    Needs: "${commandData.accessLevel}" - Has: "${Array.from(userPermissions).join(
                        ', '
                    )}"`
                );

                return;
            }

            /********************** Cooldowns *************************/
            // Check if any cooldown is active (if user is not a global admin)
            if (!this._permissionModule.hasPermission(userPermissions, EUserPermissions.BotOwner)) {
                const cooldowns = this._cooldownModule.checkAny(commandData.name, msgMeta);
                const activeCooldown = Object.values(cooldowns).find((cd) => cd?.isOnCooldown);
                if (activeCooldown) {
                    const { type, remainingTimeMs } = activeCooldown!;
                    this._logger.debug(
                        `[Executor] Cooldown enforced -
                        Command: ${commandData.name} 
                        Type: ${type}
                        Time Remaining: ${remainingTimeMs}ms
                        User: ${msgMeta.user.number}
                        Group: ${msgMeta.group.name}`
                    );
                    return;
                }
            }

            // Apply cooldown (if user is not a global admin)
            if (!this._permissionModule.hasPermission(userPermissions, EUserPermissions.BotOwner)) {
                if (commandData.cooldown) {
                    this._cooldownModule.add(
                        msgMeta,
                        commandData.cooldown.type,
                        (commandData.cooldown.length || 1) * 1000,
                        commandData.name
                    );
                }
            }

            /************************ Usage ***************************/
            if (commandData.usage && !msgMeta.args[commandData.usage.split(' ').length - 1]) {
                // Remove cooldown since there's a usage error/no command execution
                this._cooldownModule.remove(msgMeta, commandData.cooldown.type, commandData.name);

                msgContext.replyUsage(commandData.usage);
                return;
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
    private addCommand(commandInstance: BaseCommand): void {
        if (commandInstance.name) {
            this._commands.set(commandInstance.name, commandInstance);
        }

        if (commandInstance.aliases) {
            commandInstance.aliases.forEach((alias) =>
                this._aliases.set(alias, commandInstance.name)
            );
        }
    }

    /**
     * Retrieves a command from the registry by its name or alias.
     * @param name The name or alias of the command to retrieve.
     * @returns The command data object, or null if not found.
     */
    private getCommand(name: string): BaseCommand | null {
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
