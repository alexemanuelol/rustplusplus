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

    https://github.com/alexemanuelol/rustPlusPlus

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
    COLOR_ACTIVE: '#00ff40',
    COLOR_INACTIVE: '#ff0040',
    COLOR_SETTINGS: '#861c0c',
    COLOR_GREY: '#606060',
    COLOR_TEAMCHAT: '#AD1457',
    COLOR_HELI_DOWNED: '#ce412b',
    COLOR_BRADLEY_OR_HELI_DESTROYED: '#ce412b',
    COLOR_BRADLEY_DESTROYED: '#ce412b',
    COLOR_NEW_VENDING: '#ce412b',
    COLOR_SMALL_RIG: '#ce412b',
    COLOR_LARGE_RIG: '#ce412b',
    COLOR_CH47_ENTER: '#ce412b',
    COLOR_CH47_LOCATED: '#ce412b',
    COLOR_CARGO_SHIP_ENTER: '#ce412b',
    COLOR_CARGO_SHIP_LOCATED: '#ce412b',
    COLOR_CARGO_SHIP_LEFT: '#ce412b',
    COLOR_CREATE_SPAWNED_CARGO: '#ce412b',
    COLOR_SMALL_OILRIG_CREATE_REFRESH: '#ce412b',
    COLOR_LOCKED_CREATE_RESPAWNED_ON_SMALL: '#ce412b',
    COLOR_LARGE_OILRIG_CREATE_REFRESH: '#ce412b',
    COLOR_LOCKED_CREATE_RESPAWNED_ON_LARGE: '#ce412b',
    COLOR_LOCKED_CREATE_DROPPED_AT: '#ce412b',
    COLOR_LOCKED_CREATE_DROPPED_BY_CH47: '#ce412b',
    COLOR_LOCKED_CREATE_CARGOSHIP_LOOTED: '#ce412b',
    COLOR_LOCKED_CREATE_CARGOSHIP_LOOTED_OR_DESPAWNED: '#ce412b',
    COLOR_LOCKED_CREATE_SMALL_LOOTED: '#ce412b',
    COLOR_LOCKED_CREATE_LARGE_LOOTED: '#ce412b',
    COLOR_LOCKED_CREATE_LOOTED: '#ce412b',
    COLOR_LOCKED_CREATE_DESPAWNED: '#ce412b',
    COLOR_PATROL_HELICOPER_ENTERS_MAP: '#ce412b',
    COLOR_PATROL_HELICOPER_LOCATED_AT: '#ce412b',
    COLOR_PATROL_HELICOPER_LEFT_MAP: '#ce412b',
    CARGO_SHIP_ENTERS_EGRESS_STAGE: '#ce412b',
    COLOR_LOCKED_CREATE_SMALL_OILRIG_UNLOCKED: '#ce412b',
    COLOR_LOCKED_CREATE_LARGE_OILRIG_UNLOCKED: '#ce412b',
    COLOR_BREADLEY_APC_RESPAWN: '#ce412b',
    COLOR_LOCKED_CREATE_DESPAWN_IN: '#ce412b'
}