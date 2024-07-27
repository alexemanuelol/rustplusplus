/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

export const DEFAULT_SERVER_URL: string = 'https://rust.facepunch.com';
export const DEFAULT_SERVER_IMAGE: string = 'https://files.facepunch.com/lewis/1b2411b1/og-image.jpg';
export const STEAM_PROFILES_URL: string = 'https://steamcommunity.com/profiles/';
export const BATTLEMETRICS_PROFILE_URL: string = 'https://www.battlemetrics.com/players/';
export const BATTLEMETRICS_SERVER_URL: string = 'https://www.battlemetrics.com/servers/rust/';
export const AFK_TIME_SECONDS: number = 5 * 60; /* 5 min */
export const MAX_LENGTH_TEAM_MESSAGE: number = 128;
export const STEAMID64_LENGTH: number = 17;
export const STEAM_PROFILE_NAME_MAX_LENGTH: number = 32;
export const BOT_MESSAGE_HISTORY_LIMIT: number = 16;
export const BOT_LEAVE_VOICE_CHAT_TIMEOUT_MS: number = 10000;

/* Embeds */
export const EMBED_MAX_TOTAL_CHARACTERS: number = 6000;
export const EMBED_MAX_TITLE_CHARACTERS: number = 256;
export const EMBED_MAX_DESCRIPTION_CHARACTERS: number = 4096;
export const EMBED_MAX_FIELDS: number = 25;
export const EMBED_MAX_FIELD_NAME_CHARACTERS: number = 256;
export const EMBED_MAX_FIELD_VALUE_CHARACTERS: number = 1024;
export const EMBED_MAX_FOOTER_CHARACTERS: number = 2048;
export const EMBED_MAX_AUTHOR_NAME_CHARACTERS: number = 256;
export const EMBED_MAX_EMBEDS_IN_MESSAGE: number = 10;

export const EMBED_FIELD_MAX_WIDTH_LENGTH_1: number = 54;
export const EMBED_FIELD_MAX_WIDTH_LENGTH_2: number = 26;
export const EMBED_FIELD_MAX_WIDTH_LENGTH_3: number = 20;

/* Select menus */
export const SELECT_MENU_MAX_DESCRIPTION_CHARACTERS: number = 100;

/* Modals */
export const MODAL_MAX_TITLE_CHARACTERS: number = 45;

export const STORAGE_MONITOR_TOOL_CUPBOARD_CAPACITY: number = 29;
export const STORAGE_MONITOR_VENDING_MACHINE_CAPACITY: number = 30;
export const STORAGE_MONITOR_LARGE_WOOD_BOX_CAPACITY: number = 48;

/* Default timer times */
export const DEFAULT_CARGO_SHIP_EGRESS_TIME_MS: number = 50 * 60 * 1000; /* 50 min */
export const DEFAULT_OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS: number = 15 * 60 * 1000; /* 15 min */

/* Other constants */
export const PATROL_HELI_DOWNED_RADIUS: number = 400;
export const OIL_RIG_CHINOOK_47_MAX_SPAWN_DISTANCE: number = 550;
export const PROXIMITY_SETTING_DEFAULT_METERS: number = 500;
export const HARBOR_DOCK_DISTANCE: number = 100;

/* Emojis */
export const ONLINE_EMOJI: string = ':green_circle:';
export const OFFLINE_EMOJI: string = ':red_circle:';
export const NOT_FOUND_EMOJI: string = ':x:';
export const AFK_EMOJI: string = ':yellow_circle:';
export const ALIVE_EMOJI: string = ':nerd:';
export const SLEEPING_EMOJI: string = ':sleeping:';
export const DEAD_EMOJI: string = ':skull:';
export const LEADER_EMOJI: string = ':crown:';
export const DAY_EMOJI: string = ':sunny:';
export const NIGHT_EMOJI: string = ':crescent_moon:';
export const PAIRED_EMOJI: string = ':parking:';

/* Colors */
export const COLOR_ACTIVE: string = '#00FF40';
export const COLOR_CARGO_SHIP_ENTERS_EGRESS_STAGE: string = '#4B0082';
export const COLOR_CARGO_SHIP_ENTERS_MAP: string = '#9932CC';
export const COLOR_CARGO_SHIP_DOCKED: string = '#4444C7';
export const COLOR_CARGO_SHIP_LEFT_MAP: string = '#8B008B';
export const COLOR_CARGO_SHIP_LOCATED: string = '#191970';
export const COLOR_CARGO_TRACER: string = '#FF0000';
export const COLOR_CHINOOK47_ENTERS_MAP: string = '#1E90FF';
export const COLOR_CHINOOK47_LOCATED: string = '#00FF00';
export const COLOR_DEFAULT: string = '#CE412B';
export const COLOR_GREY: string = '#606060';
export const COLOR_HEAVY_SCIENTISTS_CALLED_LARGE: string = '#DDA0DD';
export const COLOR_HEAVY_SCIENTISTS_CALLED_SMALL: string = '#FFC0CB';
export const COLOR_INACTIVE: string = '#FF0040';
export const COLOR_LOCKED_CRATE_LARGE_OILRIG_UNLOCKED: string = '#FF69B4';
export const COLOR_LOCKED_CRATE_SMALL_OILRIG_UNLOCKED: string = '#00FA9A';
export const COLOR_NEW_VENDING_MACHINE: string = '#F08080';
export const COLOR_PATROL_HELICOPTER_ENTERS_MAP: string = '#DC143C';
export const COLOR_PATROL_HELICOPTER_LEFT_MAP: string = '#FFD700';
export const COLOR_PATROL_HELICOPTER_LOCATED_AT: string = '#4169E1';
export const COLOR_PATROL_HELICOPTER_TAKEN_DOWN: string = '#FFBF00';
export const COLOR_PATROL_HELICOPTER_TRACER: string = '#00FF00';
export const COLOR_SETTINGS: string = '#861C0C';
export const COLOR_TEAMCHAT_DEFAULT: string = '#CE412B';

export function GET_STEAM_PROFILE_LINK(steamId: string): string {
    return `[${steamId}](${STEAM_PROFILES_URL}${steamId})`;
}

export function GET_BATTLEMETRICS_PROFILE_LINK(playerId: string): string {
    return `[${playerId}](${BATTLEMETRICS_PROFILE_URL}${playerId})`;
}