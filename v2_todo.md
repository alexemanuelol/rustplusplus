# rustplusplus v2 TODO

## Slash commands
- [x] smartalarm
- [x] alias
- [x] blacklist
- [x] cctvcodes
- [ ] craft         Requires rustlabs data
- [x] credentials
- [ ] decay         Requires rustlabs data
- [ ] despawn       Requires rustlabs data
- [x] help
- [ ] item
- [ ] leader
- [x] map
- [ ] market
- [ ] players
- [ ] recycle       Requires rustlabs data
- [ ] research      Requires rustlabs data
- [x] reset
- [x] role
- [ ] stack         Requires rustlabs data
- [x] storagemonitor
- [x] smartswitch
- [ ] upkeep
- [ ] uptime
- [x] voice

## In-Game commands
- [x] afk
- [x] alive
- [x] cargo
- [x] chinook
- [x] connection
- [ ] craft         Requires rustlabs data
- [x] death
- [ ] decay         Requires rustlabs data
- [x] deepsea
- [ ] despawn       Requires rustlabs data
- [ ] events
- [x] heli
- [x] large
- [ ] leader
- [x] marker
- [ ] market
- [x] mute
- [x] note
- [x] offline
- [x] online
- [ ] player
- [x] pop
- [x] prox
- [ ] recycle       Requires rustlabs data
- [ ] research      Requires rustlabs data
- [x] send
- [x] small
- [ ] stack         Requires rustlabs data
- [ ] steamid
- [x] team
- [x] time
- [ ] timer
- [ ] translate
- [ ] travellingvendor
- [ ] tts
- [x] unmute
- [ ] upkeep        Requires rustlabs data
- [ ] uptime
- [x] wipe

## Other not prioritised new commands
- [ ] monument (which monument is the closest and distance to it).

## Setup functions
- [ ] Smart switches
- [ ] Smart alarms
- [ ] Storage monitors
- [ ] Smart switch groups
- [ ] Guild category
- [ ] Guild channels
- [ ] Server list
- [x] Settings menu
- [ ] Trackers

## Battlemetrics
- [ ] Class
- [ ] handler

## Modules
- [ ] Rustlabs
- [x] CCTV
- [ ] Items

## RustPlus

### Classes
- [x] Time
- [ ] Team
- [ ] TeamMember
- [x] Info
- [x] MapMarkers
- [x] Map

### Handlers
- [ ] Smart switch
- [ ] Smart alarm
- [ ] Storage monitor
- [ ] Smart switch groups
- [x] inGame command handler
- [x] discord command handler
- [ ] information channel
- [x] inGame chat handler
- [x] team chat handler
- [x] team handler
- [x] time handler
- [ ] vending machine handler

### RustPlus events
- [x] Vending Machine spawned
- [x] Vending Machine despawned
- [x] CH47 spawned
- [x] CH47 despawned
- [x] CH47 destroyed
- [x] Locked crate dropped
- [x] Heavy scientists called to oil rig
- [x] Locked crate unlocked at oil rig
- [x] cargoship spawned
- [x] cargoship despawned
- [x] cargoship leaving
- [x] cargoship docking
- [x] cargoship docked
- [x] cargoship undocking
- [x] cargoship locked crate spawned
- [x] patrol helicopter spawned
- [x] patrol helicopter despawned
- [x] patrol helicopter destroyed
- [x] patrol helicopter leaving
- [x] travelling vendor spawned
- [x] travelling vendor despawned

## Trackers
- [ ] Class
- [ ] Handler


## Other todo:
- gInstance.newsReceiver:
    - Decide when this should be set. Perhaps set as soon as the first credentials are added?
    - Perhaps in the future this could be set automatically based on which credentials are not expired etc
    - Make it possible to set this from a slash command?
