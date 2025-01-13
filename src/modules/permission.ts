import { injectable, inject } from 'inversify';

import { whatsapp as WhatsAppConfig } from '../constants';
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
    ): Promise<EUserPermissions> {
        let permissionLevel = EUserPermissions.User;

        if (msgMeta.isGroup) {
            const membersData = await msgContext.client.groupMetadata(msgMeta.group.jid);
            const userData = membersData.participants.find((p) => p.id === msgMeta.user.jid);

            if (!userData) {
                this._logger.warn(
                    `Couldn't load user info: "${msgMeta.user.jid}" in group "${msgMeta.group.jid}"`
                );
            }

            // Check if user is group owner or admin
            if (userData.admin) {
                permissionLevel |=
                    userData.admin === 'superadmin'
                        ? EUserPermissions.GroupOwner
                        : EUserPermissions.GroupAdmin;
            }

            // Check if user is bot owner
            if (msgMeta.user.number === WhatsAppConfig.OWNER_NUMBER) {
                permissionLevel |= EUserPermissions.BotOwner;
            }
        }

        return permissionLevel;
    }

    public hasPermissionLevel = (
        bitFlag: EUserPermissions,
        permission: EUserPermissions
    ): boolean => {
        return (bitFlag & permission) === permission;
    };

    public isPermitted = (
        bitFlag: EUserPermissions,
        minimumPermission: EUserPermissions = EUserPermissions.User,
        staticPermission?: EUserPermissions
    ): boolean => {
        if (typeof staticPermission !== 'undefined') {
            return this.hasPermissionLevel(bitFlag, staticPermission);
        } else {
            return bitFlag >= minimumPermission;
        }
    };

    public getHighestPermission = (bitFlag: EUserPermissions): EUserPermissions => {
        let last = bitFlag;

        while (bitFlag !== 0) {
            last = bitFlag;
            bitFlag &= bitFlag - 1;
        }

        return last;
    };
}
