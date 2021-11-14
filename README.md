<p align="center">
<img src="./rustplusplus.png" width="500"></a>
</p>

<p align="center">
<a href="https://discord.gg/vcrKbKVAbc"><img src="https://img.shields.io/badge/Discord-Alexemanuelol%238259-%237289DA?style=flat&logo=discord" alt="discord"/></a>
<a href="https://www.reddit.com/user/Alexemanuelol"><img src="https://img.shields.io/badge/Reddit-Alexemanuelol-FF4500?style=flat&logo=reddit" alt="reddit"/></a>
<a href="https://ko-fi.com/alexemanuelol"><img src="https://img.shields.io/badge/Donate%20a%20Coffee-alexemanuelol-yellow?style=flat&logo=buy-me-a-coffee" alt="donate on ko-fi"/></a>

<h1 align="center"><em><b>rustPlusPlus</b> ~~~ A Rust+ Discord Bot</em></h1>
</p>

Version 2 of the previous RustPlus-Discord-Bot. A NodeJS Discord Bot that uses the rustplus.js library.

## TODO

### Discord commands
- [x] /setup command to setup a rustplus instance for the guild
- [x] /help command to display a help message
- [ ] /reset command to reset rustplus instance for the guild
- [ ] /start command to start the configured rustplus instance
- [ ] /stop command to stop the configured rustplus instance
- [ ] /settings command to get a settings interface to change settings (?)
- [ ] /resetchannels command to reset channels (Add missing channels etc...)
- [ ] /setnotification command with all notifications as sub commands, boolean to set on or off
- [ ] /switch command with subcommands: add, remove, removeall, on, off. Set auto-ON, custom name.
- [ ] /prefix command to set the in-game command prefix


### In-Game commands
- [ ] pop, to get the current population of the server, max players and size of queue.
- [ ] time, to get the current time of the server.
- [ ] wipe, to get the time since the wipe.
- [ ] alarm, set a custom alarm
- [ ] bradley, time before bradley should respawn
- [ ] leader, give team leadership


### Information Text Channel
- [ ] Display things like Server name, ip and port, players, current time, time since wipe, etc...


### Events Discord Text Channel
- [x] Cargo Ship detected notification
- [x] Cargo Ship left notification
- [x] Cargo Ship entered egress stage notification
- [x] Bradley APC got destroyed notification
- [x] Bradley APC should respawn notification
- [x] Patrol Helicopter got downed notification
- [x] Locked Crate spawned on Cargo Ship notification
- [x] Locked Crate respawned on Oil Rig notification
- [x] Locked Crate got dropped at a monument notification
- [x] Locked Crate got looted or despawned on Cargo Ship notification
- [x] Locked Crate got looted at Oil Rig notification
- [x] Locked Crate got looted or despawned on monument notification
- [x] Locked Crate at monunment despawn warning notification
- [x] Locked Crate at Oil Rig unlocked notification
- [x] Heavy Scientists called at Oil Rig notification
- [x] Chinook 47 detected notification
- [x] New Vending Machine detected notification


### Alerts Discord Text Channel
- [ ] Smart Alarms
- [ ] Tool Cupboard decay Alert
- [ ] Vending Machine item detected


### Switches Discord Text Channel
- [ ] Interface of Smart Switches to turn then on or off
- [ ] Clear all messages on restart


### Storage Monitor Text Channel
- [ ] Interface of Storage Monitors that display time left, content, etc...
- [ ] Clear all messages on restart


### General Discord Text Channel