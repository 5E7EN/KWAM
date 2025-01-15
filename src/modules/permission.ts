import { injectable, inject } from 'inversify';

import { permissionHierarchy, whatsapp as WhatsAppConfig } from '../constants';
import { EUserPermissions } from '../types/permission';
import type { IPermissionModule } from '../types/classes';
import type { IMsgContext, IMsgMeta } from '../types/message';
import type { BaseLogger } from '../utilities/logger';

import { TYPES } from '../constants';

@injectable()
export class PermissionModule implements IPermissionModule {
    private _logger: BaseLogger;

    public constructor(@inject(TYPES.BaseLogger) logger: BaseLogger) {
        this._logger = logger;
    }

    public async getUserPermissions(
        msgMeta: IMsgMeta,
        msgContext: IMsgContext
    ): Promise<Set<EUserPermissions>> {
        const permissions = new Set<EUserPermissions>();

        // Determine group-related permissions
        // TODO: Use cache for group metadata: https://github.com/WhiskeySockets/Baileys?tab=readme-ov-file#caching-group-metadata-recommended
        if (msgMeta.isGroup) {
            const membersData = await msgContext.client.groupMetadata(msgMeta.group.jid);
            const userData = membersData.participants.find((p) => p.id === msgMeta.user.jid);

            if (!userData) {
                this._logger.warn(
                    `Couldn't load user info: "${msgMeta.user.jid}" in group "${msgMeta.group.jid}"`
                );
                return permissions;
            }

            // Check if user is a type of admin
            if (userData.admin === 'superadmin') {
                permissions.add(EUserPermissions.GroupOwner);
            } else if (userData.admin === 'admin') {
                permissions.add(EUserPermissions.GroupAdmin);
            }
        }

        // Check if user is bot owner
        if (msgMeta.user.number === WhatsAppConfig.OWNER_NUMBER) {
            permissions.add(EUserPermissions.BotOwner);
        }

        // Assign default permission, if not already assigned at least one
        if (permissions.size === 0) {
            permissions.add(EUserPermissions.User);
        }

        // Check if user is self (for potential self-bot usage if I decide this project isn't going anywhere)
        if (msgMeta.user.number === WhatsAppConfig.OPERATING_NUMBER) {
            permissions.add(EUserPermissions.Self);
        }

        // TODO: If a user is banned in the yet-to-be database, assign a 'Banned' permission (here and define in hierarchy)

        return permissions;
    }

    public hasPermission = (
        userPermissions: Set<EUserPermissions>,
        requiredPermission: EUserPermissions
    ): boolean => {
        // Loop thru all user permissions
        for (const perm of userPermissions) {
            // Check if permission either directly equals the required one,
            // or if the current iterated user permission has the required permission as its child
            if (
                perm === requiredPermission ||
                permissionHierarchy[perm].includes(requiredPermission)
            ) {
                return true;
            }
        }

        return false;
    };
}
