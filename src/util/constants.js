/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

module.exports = {
    DEFAULT_SERVER_URL: 'https://rust.facepunch.com',
    DEFAULT_SERVER_IMG: 'https://files.facepunch.com/lewis/1b2411b1/og-image.jpg',
    STEAM_PROFILES_URL: 'https://steamcommunity.com/profiles/',
    AFK_TIME_SECONDS: 5 * 60, /* 5 min */
    MAX_LENGTH_TEAM_MESSAGE: 128,

    /* Default timer times */
    DEFAULT_CARGO_SHIP_EGRESS_TIME_MS: 50 * 60 * 1000, /* 50 min */
    DEFAULT_BRADLEY_APC_RESPAWN_TIME_MS: 60 * 60 * 1000, /* 60 min */
    DEFAULT_LOCKED_CRATE_DESPAWN_TIME_MS: 2 * 60 * 60 * 1000, /* 120 min */
    DEFAULT_LOCKED_CRATE_DESPAWN_WARNING_TIME_MS: 20 * 60 * 1000, /* 20 min */
    DEFAULT_OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS: 15 * 60 * 1000, /* 15 min */

    /* Other constants */
    PATROL_HELI_DOWNED_RADIUS: 400,
    LOCKED_CRATE_CARGO_SHIP_RADIUS: 100,
    LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS: 5,
    OIL_RIG_CHINOOK_47_MAX_SPAWN_DISTANCE: 550,

    /* Emojis */
    ONLINE_EMOJI: ':green_circle:',
    OFFLINE_EMOJI: ':red_circle:',
    NOT_FOUND_EMOJI: ':x:',
    AFK_EMOJI: ':yellow_circle:',
    ALIVE_EMOJI: ':nerd:',
    SLEEPING_EMOJI: ':sleeping:',
    DEAD_EMOJI: ':skull:',
    LEADER_EMOJI: ':crown:',
    DAY_EMOJI: ':sunny:',
    NIGHT_EMOJI: ':crescent_moon:',
    PAIRED_EMOJI: ':parking:',

    /* Colors */
    COLOR_DEFAULT: '#ce412b',
    COLOR_CARGO_TRACER: '#ff0000',
    COLOR_PATROL_HELICOPTER_TRACER: '#00ff00',
    COLOR_ACTIVE: '#00ff40',
    COLOR_INACTIVE: '#ff0040',
    COLOR_SETTINGS: '#861c0c',
    COLOR_GREY: '#606060',
    COLOR_TEAMCHAT: null,
    COLOR_PATROL_HELICOPTER_TAKEN_DOWN: '#FFBF00',
    COLOR_BRADLEY_OR_HELI_DESTROYED: '#FF7F50',
    COLOR_BRADLEY_DESTROYED: '#CD5C5C',
    COLOR_NEW_VENDING_MACHINE: '#F08080',
    COLOR_HEAVY_SCIENTISTS_CALLED_SMALL: '#FFC0CB',
    COLOR_HEAVY_SCIENTISTS_CALLED_LARGE: '#DDA0DD',
    COLOR_CHINOOK47_ENTERS_MAP: '#1E90FF',
    COLOR_CHINOOK47_LOCATED: '#00FF00',
    COLOR_CARGO_SHIP_ENTERS_MAP: '#9932CC',
    COLOR_CARGO_SHIP_LOCATED: '#191970',
    COLOR_CARGO_SHIP_LEFT_MAP: '#8B008B',
    COLOR_LOCKED_CRATE_SPAWN_CARGO: '#FF6347',
    COLOR_LOCKED_CRATE_REFRESH_ON_SMALL: '#FF8C00',
    COLOR_LOCKED_CRATE_RESPAWNED_ON_SMALL: '#7B68EE',
    COLOR_LOCKED_CRATE_REFRESH_ON_LARGE: '#00CED1',
    COLOR_LOCKED_CRATE_RESPAWNED_ON_LARGE: '#8B4513',
    COLOR_LOCKED_CRATE_DROPPED_AT: '#8FBC8F',
    COLOR_LOCKED_CRATE_DROPPED_BY_CHINOOK47: '#F5DEB3',
    COLOR_LOCKED_CRATE_CARGO_SHIP_LOOTED: '#9370DB',
    COLOR_LOCKED_CRATE_CARGO_SHIP_LOOTED_OR_DESPAWNED: '#008B8B',
    COLOR_LOCKED_CRATE_SMALL_LOOTED: '#20B2AA',
    COLOR_LOCKED_CRATE_LARGE_LOOTED: '#FF1493',
    COLOR_LOCKED_CRATE_LOOTED: '#228B22',
    COLOR_LOCKED_CRATE_DESPAWNED: '#B0C4DE',
    COLOR_PATROL_HELICOPTER_ENTERS_MAP: '#DC143C',
    COLOR_PATROL_HELICOPTER_LOCATED_AT: '#4169E1',
    COLOR_PATROL_HELICOPTER_LEFT_MAP: '#FFD700',
    COLOR_CARGO_SHIP_ENTERS_EGRESS_STAGE: '#4B0082',
    COLOR_LOCKED_CRATE_SMALL_OILRIG_UNLOCKED: '#00FA9A',
    COLOR_LOCKED_CRATE_LARGE_OILRIG_UNLOCKED: '#FF69B4',
    COLOR_BRADLEY_APC_RESPAWN: '#FF4500',
    COLOR_LOCKED_CRATE_DESPAWNS_IN: '#6A5ACD'
}