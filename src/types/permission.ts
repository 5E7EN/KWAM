/**
 * User level types.
 * These are mostly inferred via the incoming message metadata - with the exception of 'BotOwner'.
 * - User: Regular user in the WhatsApp group
 * - GroupAdmin: Admin of the WhatsApp group
 * - GroupOwner: Creator or current owner of the WhatsApp group
 * - BotOwner: Bot owner
 */
// TODO: Maybe call these "traits" or "roles" instead - since they're not really permissions, just context-inferred traits
// TODO: Once database is implemented and actual permissions are stored, only then does "permissions" make sense to me
export enum EUserPermissions {
    BotOwner = 'BotOwner',
    GroupOwner = 'GroupOwner',
    GroupAdmin = 'GroupAdmin',
    User = 'User',
    Self = 'Self'
}
