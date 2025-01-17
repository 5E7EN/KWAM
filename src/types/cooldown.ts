export enum ECooldownType {
    User = 'User',
    Group = 'Group',
    UserCommand = 'UserCommand'
}

export interface ICooldownCheckResult {
    isOnCooldown: boolean;
    type?: ECooldownType;
    remainingTimeMs?: number;
}
