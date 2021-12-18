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

## Setup (Temporarily shitty guide, just because I kinda forgot that I had promised that I would do it today and the current time is 23:51 ;D)

### Required Software
- NodeJS (Since the bot is using discordjs v13, NodeJS version needs to be 16.6 or higher)
    - https://nodejs.org/en/download/
- Git
    - https://git-scm.com/downloads

### Setup of the bot
Run the following commands to setup the environment:
    $ git clone https://github.com/alexemanuelol/rustPlusPlus.git
    $ cd rustPlusPlus
    $ npm install

Setup a discord bot:
- Got to this website: https://discord.com/developers/docs/intro
- Click on 'Application' in the top left corner
- Click on 'New Application' in the top right corner
- Give it a name and click 'Create'
- You should now be able to see the 'Application Id' or 'Client Id', add that ID to the config.json file under the clientId property
- Click on the 'Bot' tab on the website
- Click on 'Add Bot'
- Click 'Yes, Do it!'
- Click on the 'Copy' button to copy the bot token, then paste it to the config.json file under the token property
- Click on 'OAuth2' tab on the website
- Scroll down to 'OAuth2 URL Generator
- Check the following boxes: bot and applications.commands
- Scroll down to Bot permissions and select the following: Administrator
- Copy the URL (This is used to invite you discord bot to discord servers (guilds))

To setup a rustplus instance in the discord server, you run the /setup commands with the arguments serverIp, appPort, steamId and playerToken. These can be gained by either running the following:

    $ npx @liamcottle/rustplus.js fcm-register
    $ npx @liamcottle/rustplus.js fcm-listen

or if you've used my previous bot, you can run the script located in that repository:

    $ cd RustPlus-Discord-Bot/tools/external
    $ node copy_server_details_to_config.js

Voila!


## TODO

### Discord commands
- [x] /setup command to setup a rustplus instance for the guild
- [x] /help command to display a help message
- [ ] /reset command to reset rustplus instance for the guild
- [x] /start command to start the configured rustplus instance
- [x] /stop command to stop the configured rustplus instance
- [ ] /resetchannels command to reset channels (Add missing channels etc...)
- [ ] /setnotification command with all notifications as sub commands, boolean to set on or off
- [ ] /switch command with subcommands: add, remove, removeall, on, off. Set auto-ON, custom name.
- [ ] /prefix command to set the in-game command prefix


### In-Game commands
- [x] bradley, time before bradley should respawn
- [x] cargo, time before cargo enters egress stage
- [x] leader, give team leadership
- [x] pop, to get the current population of the server, max players and size of queue.
- [x] time, to get the current time of the server.
- [x] timer, set a custom timer
- [x] wipe, to get the time since the wipe.
- [ ] small, to get the time left before crate on small oilrig unlocks.
- [ ] large, to get the time left before crate on large oilrig unlocks.


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
- [ ] Patrol Helicopter enters the map


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
