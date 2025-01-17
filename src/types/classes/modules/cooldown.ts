import type { IMsgMeta } from '../../message';
import type { ECooldownType, ICooldownCheckResult } from '../../cooldown';

export interface ICooldownModule {
    /**
     * Adds a cooldown for a specific type.
     *
     * @param msgMeta - Metadata containing group and user details.
     * @param type - Type of cooldown.
     * @param durationMs - Duration of cooldown in milliseconds.
     * @param commandName - The command name, if applicable.
     */
    add(msgMeta: IMsgMeta, type: ECooldownType, durationMs: number, commandName?: string): void;

    /**
     * Checks if a cooldown of any type (User, Group, etc.) is currently active.
     *
     * @param commandName - The command name.
     * @param msgMeta - Metadata containing group and user details.
     * @returns A map of cooldown types to their respective check results.
     */
    checkAny(
        commandName: string,
        msgMeta: IMsgMeta
    ): { [type in ECooldownType]?: ICooldownCheckResult };

    /**
     * Removes a specific cooldown.
     *
     * @param msgMeta - Metadata containing group and user details.
     * @param type - Type of cooldown.
     * @param commandName - The command name, if applicable.
     */
    remove(msgMeta: IMsgMeta, type: ECooldownType, commandName?: string): void;
}
