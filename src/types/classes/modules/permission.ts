import type { IMsgMeta, IMsgContext } from '../../message';
import type { EUserPermissions } from '../../permission';

export interface IPermissionModule {
    /**
     * Determines the permissions a user has based on the message context.
     * @param msgMeta - Metadata of the received message.
     * @param msgContext - Context for the message, including the client instance.
     * @returns A promise that resolves to a set of user permissions.
     */
    getUserPermissions(msgMeta: IMsgMeta, msgContext: IMsgContext): Promise<Set<EUserPermissions>>;

    /**
     * Checks if a user has a specific permission or has a permission level that includes the required permission.
     * @param userPermissions - A set of permissions assigned to the user.
     * @param requiredPermission - The permission to check for.
     * @returns `true` if the user has the required permission; otherwise, `false`.
     */
    hasPermission(
        userPermissions: Set<EUserPermissions>,
        requiredPermission: EUserPermissions
    ): boolean;
}
