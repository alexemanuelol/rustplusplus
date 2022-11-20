# 명령어 설명서

> 명령은 디스코드 또는 게임 내 팀 채팅을 통해 실행할 수 있습니다. 디스코드에서 슬래시 명령을 실행할 수 있으려면 봇에 대해 지정된 디스코드 역할의 일부여야 합니다. 봇에 대한 역할이 설정되지 않은 경우 모든 사람이 기본적으로 슬래시 명령을 사용할 수 있어야 합니다. 게임 내 명령을 실행할 수 있으려면 FCM 자격 증명을 설정한 사람과 동일한 게임 내 팀에 있어야 합니다. 게임 내 명령은 글로벌 채팅이 아닌 팀 채팅에서만 실행할 수 있습니다.

- [Discord 슬래시 명령어](commands.md#discord-slash-commands)
- [게임 내 명령어](commands.md#in-game-commands)

# Discord 슬래시 명령어

슬래시 명령어 | 설명
------------- | -----------
[**/alarm**](commands.md#alarm) | 스마트 알람에 대한 작업.
[**/credentials**](commands.md#credentials) | 사용자 계정에 대한 FCM 자격 증명 설정/지우기.
[**/help**](commands.md#help) | 도움말 메시지를 표시합니다.
[**/leader**](commands.md#leader) | 팀 구성원에게 리더십을 제공하거나 가져옵니다.
[**/map**](commands.md#map) | 현재 연결된 서버 맵 이미지를 가져옵니다.
[**/market**](commands.md#market) | 게임 내 자판기 운영관련 명령어.
[**/players**](commands.md#players) | battlemetrics를 기반으로 플레이어/플레이어 정보를 가져옵니다.
[**/reset**](commands.md#reset) | Discord 채널을 재설정합니다.
[**/role**](commands.md#role) | rustPlusPlus 카테고리 콘텐츠를 볼 수 있는 특정 역할을 설정/해제합니다.
[**/storagemonitor**](commands.md#storagemonitors) | 보관 측정장치에 대한 작업.
[**/switch**](commands.md#switch) | 스마트 스위치에 대한 작업.


## **/alarm**

> **스마트 알람에 대한 작업.**

서브명령어 | 옵션 | 설명 | 필수체크
---------- | ------- | ----------- | --------
`edit` | &nbsp; | 스마트 알람의 속성을 편집합니다. | &nbsp;
&nbsp; | `id` | 스마트 알람의 ID. | `True`
&nbsp; | `image` | 스마트 알람을 나타내는 이미지를 설정하세요. | `True`

![Discord 슬래시 명령어 알람 이미지](images/alarms_edit.png)


## **/credentials**

> **사용자 계정에 대한 FCM 자격 증명을 추가/제거합니다.**

서브명령어 | 옵션 | 설명 | 필수체크
---------- | ------- | ----------- | --------
`add` | &nbsp; | FCM 자격 증명을 추가합니다. | &nbsp;
&nbsp; | `keys_private_key` | Keys Private Key. | `True`
&nbsp; | `keys_public_key` | Keys Public Key. | `True`
&nbsp; | `keys_auth_secret` | Keys Auth Secret. | `True`
&nbsp; | `fcm_token` | FCM Token. | `True`
&nbsp; | `fcm_push_set` | FCM Push Set. | `True`
&nbsp; | `gcm_token` | GCM Token. | `True`
&nbsp; | `gcm_android_id` | FCM Android ID. | `True`
&nbsp; | `gcm_security_token` | GCM Security Token. | `True`
&nbsp; | `gcm_app_id` | GCM App ID. | `True`
&nbsp; | `steam_id` | Steam ID. | `True`
&nbsp; | `hoster` | Should be hoster. | `False`
`remove` | &nbsp; | Remove FCM Credentials. | &nbsp;
&nbsp; | `steam_id` | Steam ID. | `False`
`show` | &nbsp; | Show all registered FCM Credentials. | &nbsp;
`set_hoster` | &nbsp; | Set the hoster. | &nbsp;
&nbsp; | `steam_id` | Steam ID. | `False`

![Discord 슬래시 명령어 자격 증명 이미지](images/credentials.png)


## **/help**

> 도움말 메시지를 표시합니다.

![Discord 슬래시 명령어 도움말 이미지](images/help.png)


## **/leader**

> **팀 구성원에게 리더를 제공하거나 가져옵니다.**

서브커맨드 | 옵션 | 설명 | 필수체크
---------- | ------- | ----------- | --------
&nbsp; | `member` | 팀원의 이름입니다. | `True`

![Discord 슬래시 명령어 리더 이미지](images/leader.png)


## **/map**

> **현재 연결된 서버 맵 이미지를 가져옵니다.**

서브커맨드 | 옵션 | 설명 | 필수체크
---------- | ------- | ----------- | --------
`all` | &nbsp; | 특정 지역 이름과 마커가 모두 포함된 지도를 가져옵니다. | &nbsp;
`clean` | &nbsp; | 깨끗한지도를 가져옵니다. | &nbsp;
`monuments`| &nbsp; | 특정 지역 이름이 포함된 지도를 가져옵니다. | &nbsp;
`markers` | &nbsp; | 마커가 포함된 지도를 가져옵니다. | &nbsp;

![Discord 슬래시 명령어 맵 이미지](images/map.png)


## **/market**

> **게임 내 자판기 운영.**. Item subscription is currently not implemented.

서브커맨드 | 옵션 | 설명 | 필수체크
---------- | ------- | ----------- | --------
`search` | &nbsp; | 자판기에서 아이템을 검색합니다. | &nbsp;
&nbsp; | `name` | 검색할 항목의 이름입니다. | `False`
&nbsp; | `id` | 검색할 항목의 ID입니다. | `False`
`subscribe` | &nbsp; | 자동 판매기에서 항목을 구독합니다. | &nbsp;
&nbsp; | `name` | 구독할 항목의 이름입니다. | `False`
&nbsp; | `id` | 구독할 항목의 ID입니다. | `False`
`unsubscribe` | &nbsp; | 자동 판매기에서 항목 구독을 취소합니다. | &nbsp;
&nbsp; | `name` | 구독을 취소할 항목의 이름입니다. | `False`
&nbsp; | `id` | 구독을 취소할 항목의 ID입니다. | `False`
`list` | &nbsp; | 구독 목록을 표시합니다. | &nbsp;

![Discord 슬래시 명령어 자동판매기 이미지](images/market.png)


## **/players**

> **Battlemetrics를 기반으로 플레이어/플레이어 정보 얻기.** Calling the Slash command without any options will return the entire list of players on the server.

Subcommand | Options | Description | Required
---------- | ------- | ----------- | --------
&nbsp; | `name` | The name or part of the name of the player. | `False`

![Discord Slash Command players Image](images/players.png)


## **/reset**

> **Reset Discord channels.**

Subcommand | Options | Description | Required
---------- | ------- | ----------- | --------
`discord` | &nbsp; | Reset discord channels. | &nbsp;
`information` | &nbsp; | Reset information channel. | &nbsp;
`servers` | &nbsp; | Reset servers channel. | &nbsp;
`settings` | &nbsp; | Reset settings channel. | &nbsp;
`switches` | &nbsp; | Reset switches channels. | &nbsp;
`alarms` | &nbsp; | Reset alarms channel. | &nbsp;
`storagemonitors` | &nbsp; | Reset storagemonitors channel. | &nbsp;
`trackers` | &nbsp; | Reset trackers channel. | &nbsp;

![Discord Slash Command reset Image](images/reset.png)


## **/role**

> **Set/Clear a specific role that will be able to see the rustPlusPlus category content.**

Subcommand | Options | Description | Required
---------- | ------- | ----------- | --------
`set` | &nbsp; | Set the role. | &nbsp;
&nbsp; | `role` | The role rustPlusPlus channels will be visible to. | `True`
`clear` | &nbsp; | Clear the role (to allow everyone to see the rustPlusPlus channels). | &nbsp;

![Discord Slash Command role Image](images/role.png)


## **/storagemonitors**

> **Operations on Storage Monitors.**

Subcommand | Options | Description | Required
---------- | ------- | ----------- | --------
`edit` | &nbsp; | Edit the properties of a Storage Monitor. | &nbsp;
&nbsp; | `id` | The ID of the Storage Monitor. | `True`
&nbsp; | `image` | Set the image that best represent the Storage Monitor. | `True`

![Discord Slash Command storagemonitor Image](images/storagemonitor.png)


## **/switch**

> **Operations on Smart Switches.**

Subcommand | Options | Description | Required
---------- | ------- | ----------- | --------
`edit` | &nbsp; | Edit the properties of a Smart Switch. | &nbsp;
&nbsp; | `id` | The ID of the Smart Switch. | `True`
&nbsp; | `image` | Set the image that best represent the Smart Switch. | `True`

![Discord Slash Command switch Image](images/switch.png)


# In-Game Commands

In-Game Command | Description
--------------- | -----------
[**afk**](commands.md#afk) | Get the currently afk players in your team.
[**alive**](commands.md#alive) | Get the player with the longest time alive.
[**bradley**](commands.md#bradley) | Get information about Bradley APC (Time till respawn, time since last destroyed).
[**cargo**](commands.md#cargo) | Get information about CargoShip (Location, time till enters egress stage, current crates, time since last on map).
[**chinook**](commands.md#chinook) | Get information about Chinook 47 (Location, time since last on map).
[**connection/connections**](commands.md#connectionconnections) | Get recent connection events.
[**crate**](commands.md#crate) | Get information about Locked Crate dropped by Chinook47 (Location, time till despawn, time since last dropped).
[**death/deaths**](commands.md#deathdeaths) | Get recent death events.
[**heli**](commands.md#heli) | Get information about Patrol Helicopter (Location, time since last downed, time since last on map).
[**large**](commands.md#large) | Get information about Large Oil Rig (Time till crate unlocks, time since last trigger).
[**leader**](commands.md#leader-1) | Give/Take the Team Leadership.
[**marker**](commands.md#marker) | Set custom markers anywhere on the map.
[**market**](commands.md#market-ingame) | Search for items in vending machines or subscribe/unsubscribe to items.
[**mute**](commands.md#mute) | Mute the bot from the In-Game Team Chat.
[**note/notes**](commands.md#notenotes) | Create notes about meaningful things.
[**offline**](commands.md#offline) | Get the currently offline players in your team.
[**online**](commands.md#online) | Get the currently online players in your team.
[**player/players**](commands.md#playerplayers) | Get the names and playtime of the currently online players on the server (Based on Battlemetrics).
[**pop**](commands.md#pop) | Get the current population of the server including queue size and max population.
[**prox**](commands.md#prox) | Get the distance to the three closest teammates.
[**send**](commands.md#send) | Send a message to a discord user.
[**small**](commands.md#small) | Get information about Small Oil Rig (Time till crate unlocks, time since last trigger).
[**time**](commands.md#time) | Get the current time In-Game and time till day/night.
[**timer**](commands.md#timer) | Set custom timers that will notify whenever the timer have expired.
[**tr**](commands.md#tr) | Translate a text to another language.
[**trf**](commands.md#trf) | Translate a text from one language to another.
[**tts**](commands.md#tts) | Send a Text-To-Speech message to the Discord teamchat channel.
[**unmute**](commands.md#unmute) | Unmute the bot from the In-Game Team Chat.
[**upkeep**](commands.md#upkeep) | Get the upkeep time of all connected tool cupboard monitors.
[**wipe**](commands.md#wipe) | Get the time since it was wiped.



## **afk**

> **Get the currently afk players in your team.** Definition of AFK for this command is inactivity (No change in XY-coordinate) for more than 5 minutes.
<br>Command: `!afk`

![In-Game Command afk Image](images/afk_ingame.png)


## **alive**

> **Get the player with the longest time alive or the alive time of a teammate.**
<br>Command: `!alive`
<br>Command: `!alive Alle`

![In-Game Command alive Image](images/alive_ingame.png)


## **bradley**

> **Get information about Bradley APC (Time till respawn, time since last destroyed).**
<br>Command: `!bradley`

![In-Game Command bradley Image](images/bradley_ingame.png)


## **cargo**

> **Get information about CargoShip (Location, time till enters egress stage, current crates, time since last on map).**
<br>Command: `!cargo`

![In-Game Command cargo Image](images/cargo_ingame.png)


## **chinook**

> **Get information about Chinook 47 (Location, time since last on map).**
<br>Command: `!chinook`

![In-Game Command chinook Image](images/chinook_ingame.png)


## **connection/connections**

> **Get recent connection events of the team or from a specific teammate.**
<br>Command: `!connections`
<br>Command: `!connection Alle`

![In-Game Command connection Image](images/connection_ingame.png)


## **crate**

> **Get information about Locked Crate dropped by Chinook47 (Location, time till despawn, time since last dropped).**
<br>Command: `!crate`

![In-Game Command crate Image](images/crate_ingame.png)


## **death/deaths**

> **Get recent death events of the team or from a specific teammate.**
<br>Command: `!deaths`
<br>Command: `!death Alle`

![In-Game Command death Image](images/death_ingame.png)


## **heli**

> **Get information about Patrol Helicopter (Location, time since last downed, time since last on map).**
<br>Command: `!heli`

![In-Game Command heli Image](images/heli_ingame.png)


## **large**

> **Get information about Large Oil Rig (Time till crate unlocks, time since last trigger).**
<br>Command: `!large`

![In-Game Command large Image](images/large_ingame.png)


## **leader**

> **Give/Take the Team Leadership.** Calling the leader command alone will give the caller leadership. You can also give the leadership to a team member by writing the name or part of the name after the command.
<br>`This command only works if the current leader is the person that setup the bot.`

Subcommand | Description | Required
---------- | ----------- | --------
`<team_member_name>` | The name or part of the name of a team member (`!leader <name>`). | `False`

![In-Game Command leader Image](images/leader_ingame.png)


## **marker**

> **Set custom markers anywhere on the map.** This command can be very useful for small stash locations. Place down a small stash, create a marker on that spot and be able to navigate back to that exact place at a later stage.

Subcommand | Description | Required
---------- | ----------- | --------
`add` | Add a custom marker (`!marker add <name>`). | `False`
`remove` | Remove a custom marker (`!marker remove <id>`). | `False`
`list` | List all registered custom markers for this server with respective ID (`!marker list`). | `False`
`<marker_name>` | Calling with the name of the marker will let you navigate to that marker (`!marker <name>`). | `False`

![In-Game Command marker Image](images/marker_ingame.png)


## **market ingame**

> **Search for items in vending machines or subscribe/unsubscribe to items.**

Subcommand | Description | Required
---------- | ----------- | --------
`search` | Search for an item in Vending Machines (`!market search thompson`). | `False`
`subscribe` | Subscribe to an item in Vending Machines (`!market sub thompson`). | `False`
`unsubscribe` | Unsubscribe to an item in Vending Machines (`!market unsub thompson`). | `False`
`list` | Display the subscription list (`!market list`). | `False`

![In-Game Command market Image](images/market_ingame.png)


## **mute**

> **Mute the bot from the In-Game Team Chat.** This will mute everything the bot would normally say in Team Chat such as command response, event notifications, timers, Smart Device notifications.
<br>Command: `!mute`

![In-Game Command mute Image](images/mute_ingame.png)


## **note/notes**

> **Create notes about meaningful things.** To list all registered notes run `!notes`, all note ids will be presented as well.

Subcommand | Description | Required
---------- | ----------- | --------
`add` | Add a note (`!note add <text>`). | `False`
`remove` | Remove a note (`!note remove <id>`). | `False`

![In-Game Command notes Image](images/notes_ingame.png)


## **offline**

> **Get the currently offline players in your team.**
<br>Command: `!offline`

![In-Game Command offline Image](images/offline_ingame.png)


## **online**

> **Get the currently online players in your team.**
<br>Command: `!online`

![In-Game Command online Image](images/online_ingame.png)


## **player/players**

> **Get the names and playtime of the currently online players on the server (Based on Battlemetrics).** To get all the currently online players on the server run `!players`. To get the information from a certain player run `!player <name or part of name>`.

![In-Game Command players Image](images/players_ingame.png)
![In-Game Command player Image](images/player_ingame.png)


## **pop**

> **Get the current population of the server including queue size and max population.**
<br>Command: `!pop`

![In-Game Command pop Image](images/pop_ingame.png)


## **prox**

> **Get the distance to the three closest teammates.** To get the three closest teammates run `!prox`. To get the distance to a team member run `!prox <name or part of name>`.

![In-Game Command prox Image](images/prox_ingame.png)


## **send**

> **Send a message to a discord user.**
<br>Command: `!send Alle Hello my friend!`

![In-Game Command send Image](images/send_ingame.png)


## **small**

> **Get information about Small Oil Rig (Time till crate unlocks, time since last trigger).**
<br>Command: `!small`

![In-Game Command small Image](images/small_ingame.png)


## **time**

> **Get the current time In-Game and time till day/night.**
<br>Command: `!time`

![In-Game Command time Image](images/time_ingame.png)


## **timer**

> **Set custom timers that will notify whenever the timer have expired.**
<br>`The argument <time> is used to set time in the format: 2h15m or 15m10s etc... (not space between d/h/m/s).`

Subcommand | Description | Required
---------- | ----------- | --------
`add` | Add a custom timer (`!timer add <time> <text>`). | `False`
`remove` | Remove a custom timer (`!timer remove <id>`). | `False`
`list` | List all registered custom timers (`!timer list`). | `False`

![In-Game Command timer Image](images/timer_ingame.png)


## **tr**

> **Translate a text from English to another language.**
<br>Command: `!tr <language-code> <Text>`

Subcommand | Description | Required
---------- | ----------- | --------
`language` | Get the language code (`!tr language <language>`). | `False`
`<language-code>` | Translate the text to this language (`!tr <language> <text>`). | `False`

![In-Game Command get language code Image](images/language_code_ingame.png)
![In-Game Command translateTo Image](images/translateTo_ingame.png)


## **trf**

> **Translate a text from a language to another language.**
<br>Command: `!trf <language-code-from> <language-code-to> <Text>`

![In-Game Command translateFrom Image](images/translateFrom_ingame.png)

## **tts**

> **Send a Text-To-Speech message to the Discord teamchat channel.** To execute a Text-To-Speech command run `!tts <text>`.
<br>Command: `!tts <text>`

![In-Game Command tts Image](images/tts_ingame.png)


## **unmute**

> **Unmute the bot from the In-Game Team Chat.**
<br>Command: `!unmute`

![In-Game Command unmute Image](images/unmute_ingame.png)


## **upkeep**

> **Get the upkeep time of all connected tool cupboard monitors.**
<br>Command: `!upkeep`

![In-Game Command upkeep Image](images/upkeep_ingame.png)


## **wipe**

> **Get the time since it was wiped.**
<br>Command: `!wipe`

![In-Game Command wipe Image](images/wipe_ingame.png)