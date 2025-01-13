import type { IMsgMeta, IMsgContext } from '../../message';
import type { EUserPermissions } from '../../permission';

export interface IPermissionModule {
    /**
     * Calculates a user's permission level.
     * @param msgMeta - Metadata of the received message.
     * @param msgContext - Context of the received message.
     * @returns A promise resolving to a bit flag built from `EUserPermissions` enum values.
     */
    getUserPermissions(msgMeta: IMsgMeta, msgContext: IMsgContext): Promise<EUserPermissions>;

    /**
     * Checks whether a bit-flag permission has a specific permission level.
     * @param bitFlag - The bit flag permission status stack for a specific user.
     * @param permission - The permission to check exists in `bitFlag`.
     * @returns A boolean indicating whether `permission` is present inside `bitFlag`.
     */
    hasPermissionLevel(bitFlag: EUserPermissions, permission: EUserPermissions): boolean;

    /**
     * Calculates whether a user is permitted for a specific action.
     * @param bitFlag - The bit-flag permission stack for a user.
     * @param minimumPermission - The minimum permission level required.
     * @param staticPermission - The permission level absolutely required for the action.
     * @returns A boolean indicating whether the user is permitted for the action.
     */
    isPermitted(
        bitFlag: EUserPermissions,
        minimumPermission?: EUserPermissions,
        staticPermission?: EUserPermissions
    ): boolean;

    /**
     * Calculates the highest permission level for a user.
     * @param bitFlag - The bit-flag permission stack for a user.
     * @returns The highest `EUserPermissions` value from the `bitFlag`.
     */
    getHighestPermission(bitFlag: EUserPermissions): EUserPermissions;
}
