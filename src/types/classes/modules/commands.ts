import type { IMsgMeta } from '../../message';

export interface ICommandsModule {
    /**
     * Initializes the module by loading commands and setting up any necessary configurations.
     */
    init(): Promise<void>;

    /**
     * Loads commands from the file system and populates the commands and aliases maps.
     *
     * @param purgeExisting - Whether to clear existing commands before loading new ones.
     */
    loadCommands(purgeExisting?: boolean): Promise<void>;

    /**
     * Executes a command based on the provided message metadata.
     *
     * @param msgMeta - Metadata of the received message containing information about the command.
     */
    executeCommand(msgMeta: IMsgMeta): Promise<void>;
}
