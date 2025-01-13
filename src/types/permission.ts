/**
 * User level types. These are mostly inferred via the incoming message metadata - with the exception of 'owner'.
 * - User: Regular user in the WhatsApp group
 * - GroupAdmin: Admin of the WhatsApp group
 * - GroupOwner: Creator or current owner of the WhatsApp group
 * - Owner: Bot owner
 */
export enum EUserPermissions {
    User = 0,
    GroupAdmin = 1 << 0,
    GroupOwner = 1 << 1,
    BotOwner = 1 << 2
}
