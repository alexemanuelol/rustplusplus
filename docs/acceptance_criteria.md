# Acceptance Criteeria

## Acceptance Criteria - Credentials
- [x] Credentials can only be added through /credentials add slash command.
- [x] Credentials can be removed using the /credentials remove slash command.
- [x] Credentials can be removed when guildDelete event is triggered and associatedGuilds array ends up empty (guild was removed from bot and the guild was the only associated guild).
- [x] Credentials can be removed when guildMemberRemove event is triggered and associatedGuilds array ends up empty (member was removed from only associated guild).
- [x] Credentials can be removed when ready event is triggered and associatedGuilds array ends up empty (guild have been removed from bot and the guild was the only associated guild).
