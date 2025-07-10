# Acceptance Criteria

## Acceptance Criteria - Credentials
- [x] Credentials can be added using the /credentials add slash command.
- [x] Credentials can be removed using the /credentials remove slash command.
- [x] Credentials can be removed when guildDelete event is triggered and associatedGuilds array ends up empty (guild was removed from bot and the guild was the only associated guild).
- [x] Credentials can be removed when guildMemberRemove event is triggered and associatedGuilds array ends up empty (member was removed from only associated guild).
- [x] Credentials can be removed when ready event is triggered and associatedGuilds array ends up empty (guild was removed from bot and the guild was the only associated guild).

## Acceptance Criteria - GuildInstance
- [x] GuildInstance file can be added when ready event is triggered and the bot have joined a new guild.
- [x] GuildInstance file can be added when guildCreate event is triggered and the bot joined a new guild.
- [x] GuildInstance file can be removed when ready event is triggered and the bot have left a guild.
- [x] GuildInstance file can be removed when guildDelete event is triggered and the bot left a guild.
- [ ] If an old GuildInstance file is detected during startup, copy common attributes from the old to a new GuildInstance file.
