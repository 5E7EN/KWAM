# KBAM: Algorithms & Stuff

## Joining Groups

Group admin wants bot? Have them send invite link. Then, join (or request to join) and verify that requester is a "superadmin" in that group.
If yes, stay and activate.  
If not, leave immediately.

Group conditions:

-   Must be popular (at least 20 members) - (check before joining, if able)

## Message Moderation

### Flagging System

3 strikes and you're out.  
If a specific user is flagged 3 times by regular admins (same or different) in 3 different groups, user is globally blacklisted and removed across all channels the bot is activated in.  
For admin to flag user, the user must actually be in the group he's being flagged in.

Flagging is done by invoking a command with the user's number and the reason for flagging (e.g. `!flaguser 18008008800 crypto spam`).

Confirmation of flagging should be sent to the admin who flagged the user via PM.  
If action was actually taken as a result of the flagging (flag threshold reached), this should also be communicated to the admin.  
Additionally, the superadmin of each group the user has been banned in should be notified upon the user's ban - with the reasons given for flagging that triggered it communicated to him.

Any time a user joins a group, the bot should check if the user is globally blacklisted. If so, the user should be removed from the group and the superadmin notified of the reasons, as listed above.

## Automatially Determining Suspicious Messages

### Idea #1 - Trust Score

Calculate a trust score for all messages that are monitored.  
Message content will be analyzed for spam, phishing, and other malicious content as detailed below.  
If trust score is below a certain threshold, message is flagged automatically.  
If flagged 3 times by system, only 1 manual flag by an admin is needed to blacklist and ban user globally.

## Suspicious Content Classification

1.  From international phone numbers (non-US) (in a mostly US group) (specific country codes more suspicious than others)
2.  Invite links (scan group name for suspicious keywords too if possible; e.g. `stock`, `crypto`, `investment`, etc.)
3.  Crypto related content
4.  Weird links (shortened, etc) & #3
5.  Long messages with newlines & #4

## Additional Information

-   The bot is designed to operate as discreetly as possible. Feedback should be given to admins in a way that doesn't reveal the bot's presence (via DMs).
