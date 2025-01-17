import { EUserPermissions } from '../../permission';
import { ECooldownType } from '../../cooldown';
import type { IMsgContext, IMsgMeta } from '../../message';

interface IBaseCommand {
    /**
     * The name of the command. This is the string that users will use to call the command.
     * This should be unique across all commands.
     * @example 'ping'
     */
    name: string;
    /**
     * An array of aliases for the command. These are additional strings that users can use to call the command.
     * @example ['p']
     */
    aliases?: string[];
    /**
     * A brief description of what the command does. This will eventually be used for some kind of commands list.
     */
    description: string;
    /**
     * The category that the command belongs to. This will eventually be used for some kind of commands list.
     * @default 'Uncategorized'
     */
    category?: string;
    /**
     * A string that shows the user how to use the command. This is validated and enforced upon command execution.
     * @example '<arg1> <arg2>'
     */
    usage?: string;
    /**
     * Whether the command can only be used in private messages. Currently not enforced.
     * @default false
     */
    pmOnly?: boolean;
    /**
     * The minimum permission level required to use the command.
     * @see EUserPermissions
     */
    accessLevel: EUserPermissions;
    /**
     * The cooldown settings for the command. This determines how often the command can be used (and by whom, depending on the provided type).
     * @example { type: ECooldownType.UserCommand, length: 3 }
     */
    cooldown: { type: ECooldownType; length: number };
    /**
     * Whether the command is enabled or not. If disabled, the command will not be usable.
     * @default true
     */
    enabled?: boolean;

    /**
     * Executes the command logic.
     * @param runParams Message metadata and context to execute the command with.
     * @returns The return value of the command execution (unused at the moment).
     */
    run: (runParams: IRunParams) => Promise<any>;

    /**
     * Validates the command object to ensure it has all required properties and methods.
     * @returns True if the command implementation is valid, false otherwise.
     */
    validate?: () => boolean;
}

export interface IRunParams {
    msgMeta: IMsgMeta;
    msgContext: IMsgContext;
}

export abstract class BaseCommand implements IBaseCommand {
    public readonly name: string;
    public readonly aliases: string[] = [];
    public readonly description: string;
    public readonly category: string = 'Uncategorized';
    public readonly usage: string = null;
    public readonly pmOnly: boolean = false;
    public readonly accessLevel: EUserPermissions;
    public readonly cooldown: { type: ECooldownType; length: number } = {
        type: ECooldownType.UserCommand,
        length: 3
    };
    public readonly enabled: boolean = true;

    // constructor(data: IBaseCommand) {
    //     this.name = data.name;
    //     this.aliases = data.aliases || [];
    //     this.description = data.description;
    //     this.category = data.category ?? 'Uncategorized';
    //     this.usage = data.usage ?? null;
    //     this.pmOnly = data.pmOnly || false;
    //     this.accessLevel = data.accessLevel;
    //     this.cooldown = data.cooldown || { type: ECooldownType.UserCommand, length: 3 };
    //     this.enabled = data.enabled || true;
    // }

    public abstract run(params: IRunParams): Promise<void>;

    public validate(): boolean {
        // Validate required properties and methods
        if (
            !this.name ||
            !this.description ||
            !this.accessLevel ||
            !this.run ||
            typeof this.run !== 'function'
        ) {
            throw new Error(`Command ${this.name} is missing required properties or methods.`);
        }

        // Validate valid access level
        if (!Object.values(EUserPermissions).includes(this.accessLevel)) {
            throw new Error(`Command ${this.name} has an invalid access level.`);
        }

        // Validate valid cooldown values
        if (
            !Object.values(ECooldownType).includes(this.cooldown.type) ||
            typeof this.cooldown.length !== 'number' ||
            this.cooldown.length < 0
        ) {
            throw new Error(`Command ${this.name} has an invalid cooldown type.`);
        }

        return true;
    }
}
