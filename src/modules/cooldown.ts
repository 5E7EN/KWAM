import { injectable } from 'inversify';
import type { IMsgMeta } from '../types/message';

import type { TCooldownType, ICooldownCheckResult } from '../types/cooldown';

@injectable()
export class CooldownModule {
    private cooldowns: Map<string, number> = new Map();

    /**
     * Generates a unique storage key based on cooldown type and message metadata.
     * @param msgMeta - Metadata containing group and user details.
     * @param type - The type of cooldown.
     * @param commandName - The command name, if applicable.
     * @returns A unique key for the cooldown.
     */

    private generateKey(msgMeta: IMsgMeta, type: TCooldownType, commandName?: string): string {
        // Ensure command name has been provided if required, which is the case most of the time
        //* (User does not require command name since it's a cooldown applied for ALL commands)
        if (type !== 'User' && !commandName) {
            throw new Error(`Command name is required for cooldown type: ${type}`);
        }

        const { group, user } = msgMeta;
        switch (type) {
            case 'User':
                return `${group.jid}:user:${user.number}`;
            case 'Group':
                return `${group.jid}:group:${commandName}`;
            case 'UserCommand':
                return `${group.jid}:user:${user.number}:command:${commandName}`;
            default:
                throw new Error(`Unsupported cooldown type: ${type}`);
        }
    }

    /**
     * Adds a cooldown for a specific type.
     * @param msgMeta - Metadata containing group and user details.
     * @param type - Type of cooldown.
     * @param durationMs - Duration of cooldown in milliseconds.
     * @param commandName - The command name, if applicable.
     */
    public add(
        msgMeta: IMsgMeta,
        type: TCooldownType,
        durationMs: number,
        commandName?: string
    ): void {
        // Generate unique key associated with the provided metadata and cooldown type
        const key = this.generateKey(msgMeta, type, commandName);
        const expiration = Date.now() + durationMs;

        // Add unique cooldown key
        this.cooldowns.set(key, expiration);
    }

    /**
     * Checks if a cooldown of any type (User, Group, etc.) is currently active.
     * @param commandName - The command name.
     * @param msgMeta - Metadata containing group and user details.
     * @returns Cooldown check result.
     */
    public checkAny(
        commandName: string,
        msgMeta: IMsgMeta
    ): { [type in TCooldownType]?: ICooldownCheckResult } {
        const result: { [type in TCooldownType]?: ICooldownCheckResult } = {};

        // Check for any active cooldowns of any type
        for (const type of ['User', 'Group', 'UserCommand'] as TCooldownType[]) {
            const key = this.generateKey(msgMeta, type, commandName);
            const now = Date.now();

            // Check for active cooldown
            if (this.cooldowns.has(key)) {
                const expiration = this.cooldowns.get(key)!;

                // Check if expiry date has been passed
                if (expiration > now) {
                    result[type] = {
                        isOnCooldown: true,
                        type,
                        remainingTimeMs: expiration - now
                    };
                } else {
                    // If the cooldown has expired, remove the entry
                    this.cooldowns.delete(key);
                }
            }
        }

        return result;
    }

    /**
     * Removes a specific cooldown.
     * @param msgMeta - Metadata containing group and user details.
     * @param type - Type of cooldown.
     * @param commandName - The command name, if applicable.
     */
    public remove(msgMeta: IMsgMeta, type: TCooldownType, commandName?: string): void {
        const key = this.generateKey(msgMeta, type, commandName);

        if (!this.cooldowns.has(key)) return;

        // Delete cooldown entry
        this.cooldowns.delete(key);
    }
}
