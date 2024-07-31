/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2023 FaiThiX

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

import * as discordjsVoice from '@discordjs/voice';
import { Readable } from 'stream';

import actors from '../staticFiles/actors.json';
import * as guildInstance from '../util/guild-instance';

export interface GenderNames {
    male: string | null;
    female: string | null;
}

export interface LanguageNames {
    [languageCode: string]: GenderNames;
}

const languageNames: LanguageNames = actors;
const defaultLanguage = 'en';
const defaultGender: keyof GenderNames = 'male';

function getVoice(guildId: string): string {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language as keyof LanguageNames;
    const gender = instance.generalSettings.voiceGender as keyof GenderNames;

    let actorName = null;
    if (languageNames.hasOwnProperty(language)) {
        const names = languageNames[language];
        if (gender in names && languageNames[language][gender] !== null) {
            return languageNames[language][gender] as string;
        }
    }

    /* If you got here, then go for default voice, English - male. */
    return languageNames[defaultLanguage][defaultGender] as string;
}

export async function sendDiscordVoiceMessage(guildId: string, text: string) {
    const connection = discordjsVoice.getVoiceConnection(guildId);
    const voiceName = getVoice(guildId);
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voiceName}&text=${encodeURIComponent(text)}`;

    if (connection) {
        const response = await fetch(url);
        if (response.body !== null) {
            const reader = response.body.getReader();
            if (!reader) return;

            /* Convert ReadableStream<Uint8Array> to Node.js Readable stream. */
            const stream = new Readable({
                async read(size) {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) {
                                this.push(null);
                                break;
                            }
                            else {
                                this.push(value);
                            }
                        }
                    }
                    catch (e) { return; }
                }
            });

            const resource = discordjsVoice.createAudioResource(stream);
            const player = discordjsVoice.createAudioPlayer();
            connection.subscribe(player);
            player.play(resource);
        }
    }
}