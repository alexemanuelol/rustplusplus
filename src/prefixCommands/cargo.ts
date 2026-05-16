/*
    Copyright (C) 2026 Alexander Emanuelsson (alexemanuelol)

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

// TODO! Extend command: See variables available on rustPlusMapMarkers.ts
// - !cargo
//       - Just shows default info about cargo ship(s) on the map (Current implementation).
// - !cargo crates
//       - Show how many crates spawned
// - !cargo harbors
//       - Show how many harbors docked
// - !cargo dock
//       - Time until undocking if currently docked.
// - !cargo time
//       - Time that cargos been out
// - !cargo leave
//      - Time until leaving.
// - !cargo location
//      - Show current location of cargo ship(s).

import * as rp from 'rustplus-ts';
import * as discordjs from 'discord.js';

import { log, guildInstanceManager as gim, localeManager as lm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { secondsToFullScale } from '../utils/timer';
import { getPos, getPosString } from '../utils/map';
import { DockingStatus } from '../structures/rustPlusMapMarkers';

export const name = 'cargo';

export async function execute(rpInstance: RustPlusInstance, args: string[],
    message: rp.AppTeamMessage | discordjs.Message):
    Promise<boolean> {
    const fn = `[prefixCommand: ${name}]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    const inGame = Object.hasOwn(message, 'steamId') ? true : false;
    const guildId = rpInstance.guildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    if (rpInstance.rpMapMarkers === null) return false;

    if (rpInstance.rpMapMarkers.cargoShips.length === 0) {
        let response: string;
        if (rpInstance.rpMapMarkers.dateCargoShipLeftMap === null) {
            response = lm.getIntl(language, 'cargoShipNotOnMap');
        }
        else {
            const timeSinceLeft = (new Date().getTime() -
                rpInstance.rpMapMarkers.dateCargoShipLeftMap.getTime()) / 1000;
            response = lm.getIntl(language, 'timeSinceCargoShipLeft', {
                time: secondsToFullScale(timeSinceLeft, '', true)
            });
        }
        rpInstance.sendPrefixCommandResponse(response, inGame);
        log.info(`${fn} ${response}`, logParam);
        return true;
    }

    const response: string[] = [];
    for (const cargoShip of rpInstance.rpMapMarkers.cargoShips) {
        const metaData = rpInstance.rpMapMarkers.cargoShipMetaData[cargoShip.id];
        const pos = getPos(cargoShip.x, cargoShip.y, rpInstance);
        const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
            lm.getIntl(language, 'unknown');

        let str: string;
        if (metaData.isLeaving) {
            str = lm.getIntl(language, 'cargoShipLeavingAt', { pos: posString });
        }
        else if (metaData.dockingStatus !== null && metaData.dockingStatus === DockingStatus.DOCKING) {
            str = lm.getIntl(language, 'cargoShipDockingAt', { pos: posString });
        }
        else if (metaData.dockingStatus !== null && metaData.dockingStatus === DockingStatus.DOCKED) {
            str = lm.getIntl(language, 'cargoShipDockedAt', { pos: posString });
        }
        else if (metaData.dockingStatus !== null && metaData.dockingStatus === DockingStatus.UNDOCKING) {
            str = lm.getIntl(language, 'cargoShipUndockingAt', { pos: posString });
        }
        else {
            str = lm.getIntl(language, 'cargoShipLocatedAt', { pos: posString });
        }

        const timeSinceSpawnSeconds = (new Date().getTime() - metaData.spawnTime.getTime()) / 1000;
        const timeSinceSpawnString = secondsToFullScale(timeSinceSpawnSeconds, '', false);
        str += ` ${lm.getIntl(language, 'cargoShipBeenOutFor', { time: timeSinceSpawnString })} `;

        const numberOfHarborsDocked = `${metaData.harborsDocked.length}`;
        str += ` ${lm.getIntl(language, 'cargoShipDockedAtXHarbors', { num: numberOfHarborsDocked })} `;

        const numberOfLockedCratesSpawned = `${metaData.lockedCrateSpawnCounter}`;
        str += ` ${lm.getIntl(language, 'cargoShipNumberOfLockedCrates', { num: numberOfLockedCratesSpawned })} `;

        if (!metaData.isLeaving) {
            const timer0 = rpInstance.rpMapMarkers.cargoShipEgressTimeoutIds[cargoShip.id];
            const timer1 = rpInstance.rpMapMarkers.cargoShipEgressAfterHarbor1TimeoutIds[cargoShip.id];
            const timer2 = rpInstance.rpMapMarkers.cargoShipEgressAfterHarbor2TimeoutIds[cargoShip.id];

            let timeLeftString0: string = '';
            let timeLeftString1: string = '';
            if (timer0 && timer0.running && !timer1 && !timer2) {
                const timeLeftSeconds = timer0.getTimeLeftMs() / 1000;
                timeLeftString0 = secondsToFullScale(timeLeftSeconds, 'd', false);
            }
            else if (timer0 && timer0.running && timer2 && timer2.running) {
                const timeLeftSeconds0 = timer0.getTimeLeftMs() / 1000;
                timeLeftString0 = secondsToFullScale(timeLeftSeconds0, 'd', false);
                const timeLeftSeconds1 = timer2.getTimeLeftMs() / 1000;
                timeLeftString1 = secondsToFullScale(timeLeftSeconds1, 'd', false);
            }
            else if (timer1 && timer1.running && timer2 && timer2.running) {
                const timeLeftSeconds0 = timer1.getTimeLeftMs() / 1000;
                timeLeftString0 = secondsToFullScale(timeLeftSeconds0, 'd', false);
                const timeLeftSeconds1 = timer2.getTimeLeftMs() / 1000;
                timeLeftString1 = secondsToFullScale(timeLeftSeconds1, 'd', false);
            }
            else if (timer0 && !timer0.running && timer2 && timer2.running) {
                const timeLeftSeconds = timer2.getTimeLeftMs() / 1000;
                timeLeftString0 = secondsToFullScale(timeLeftSeconds, 'd', false);
            }

            if (timeLeftString0 !== '' && timeLeftString1 !== '') {
                const timeLeftString = lm.getIntl(language, 'cargoShipLeavingInOr', {
                    time1: timeLeftString0,
                    time2: timeLeftString1
                });
                str += ` ${timeLeftString}`;
            }
            else {
                const timeLeftString = lm.getIntl(language, 'cargoShipLeavingIn', {
                    time: timeLeftString0
                });
                str += ` ${timeLeftString}`;
            }
        }

        response.push(str);
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}