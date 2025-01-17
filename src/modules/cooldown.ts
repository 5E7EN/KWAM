import { injectable } from 'inversify';
import type { IMsgMeta } from '../types/message';

import { ECooldownType } from '../types/cooldown';
import type { ICooldownModule } from '../types/classes';
import type { ICooldownCheckResult } from '../types/cooldown';

//* We make this injectable since in the future it might be used for app health stats, even though right now it's only used in one place (and has no deps)
@injectable()
export class CooldownModule implements ICooldownModule {
    private cooldowns: Map<string, number> = new Map();

    /**
     * Generates a unique storage key based on cooldown type and message metadata.
     * @param msgMeta - Metadata containing group and user details.
     * @param type - The type of cooldown.
     * @param commandName - The command name, if applicable.
     * @returns A unique key for the cooldown.
     */

    private generateKey(msgMeta: IMsgMeta, type: ECooldownType, commandName?: string): string {
        // Ensure command name has been provided if required, which is the case most of the time
        //* (User does not require command name since it's a cooldown applied for ALL commands)
        if (type !== ECooldownType.User && !commandName) {
            throw new Error(`Command name is required for cooldown type: ${type}`);
        }

        const { group, user } = msgMeta;
        switch (type) {
            case ECooldownType.User:
                return `${group.jid}:user:${user.number}`;
            case ECooldownType.Group:
                return `${group.jid}:group:${commandName}`;
            case ECooldownType.UserCommand:
                return `${group.jid}:user:${user.number}:command:${commandName}`;
            default:
                throw new Error(`Unsupported cooldown type: ${type}`);
        }
    }

    public add(
        msgMeta: IMsgMeta,
        type: ECooldownType,
        durationMs: number,
        commandName?: string
    ): void {
        // Generate unique key associated with the provided metadata and cooldown type
        const key = this.generateKey(msgMeta, type, commandName);
        const expiration = Date.now() + durationMs;

        // Add unique cooldown key
        this.cooldowns.set(key, expiration);
    }

    public checkAny(
        commandName: string,
        msgMeta: IMsgMeta
    ): { [type in ECooldownType]?: ICooldownCheckResult } {
        const result: { [type in ECooldownType]?: ICooldownCheckResult } = {};

        // Check for any active cooldowns of any type
        for (const type of Object.values(ECooldownType)) {
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

    public remove(msgMeta: IMsgMeta, type: ECooldownType, commandName?: string): void {
        const key = this.generateKey(msgMeta, type, commandName);

        if (!this.cooldowns.has(key)) return;

        // Delete cooldown entry
        this.cooldowns.delete(key);
    }
}
