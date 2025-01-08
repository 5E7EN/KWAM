export type TCooldownType = 'User' | 'Group' | 'UserCommand';

export interface ICooldownCheckResult {
    isOnCooldown: boolean;
    type?: TCooldownType;
    remainingTimeMs?: number;
}
