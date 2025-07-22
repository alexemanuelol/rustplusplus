/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import { getVoiceConnection, createAudioPlayer, createAudioResource } from "@discordjs/voice";
import { Readable } from "stream";
import * as fs from 'fs';
import * as path from 'path';

import { guildInstanceManager as gim, log } from '../../index';
import * as types from '../utils/types';
import { GuildInstance } from "../managers/guildInstanceManager";

interface Actors {
    [language: string]: ActorNames;
}

interface ActorNames {
    male: string | null;
    female: string | null;
}

export async function sendDiscordVoiceMessage(guildId: types.GuildId, text: string) {
    const fName = `[sendDiscordVoiceMessage]`;
    const logParam = { guildId: guildId };

    const connection = getVoiceConnection(guildId);
    const voice = getVoice(guildId);
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;

    if (connection) {
        const stream = (await (await fetch(url)).blob()).stream() as unknown as Readable;
        const resource = createAudioResource(stream);
        const player = createAudioPlayer();

        connection.subscribe(player);
        player.play(resource);

        log.debug(`${fName} Playing message '${text}' in voice '${voice}'.`, logParam)
    }
}

function getVoice(guildId: types.GuildId) {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const gender = gInstance.generalSettings.voiceGender;
    const language = gInstance.generalSettings.language;
    const actors = getActors();

    if (actors[language]?.[gender] === null || actors[language]?.[gender] === undefined) {
        return actors[language]?.[gender === 'male' ? 'female' : 'male'];
    }
    else {
        return actors[language]?.[gender];
    }
}

function getActors(): Actors {
    const filePath = path.join(__dirname, "../staticFiles/voiceActors.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(fileContent);

    return parsed as Actors;
}