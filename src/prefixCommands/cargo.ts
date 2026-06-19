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

    const unixTimestampNow = Math.floor(new Date().getTime() / 1000);
    const dateDespawned = rpInstance.rpMapMarkers.dateCargoShipDespawned;

    const response: string[] = [];
    if (rpInstance.rpMapMarkers.cargoShips.length === 0) {
        if (dateDespawned === null) {
            response.push(lm.getIntl(language, 'cargoShipNotOnMap'));
        }
        else {
            const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
            const secondsSinceDespawned = unixTimestampNow - unixTimestampDespawned;
            response.push(lm.getIntl(language, 'timeSinceCargoShipLeft', {
                time: secondsToFullScale(secondsSinceDespawned)
            }));
        }
    }

    for (const cargoShip of rpInstance.rpMapMarkers.cargoShips) {
        const metaData = rpInstance.rpMapMarkers.cargoShipMetaData[cargoShip.id];
        const dateSpawned = rpInstance.rpMapMarkers.dateCargoShipSpawned[cargoShip.id];

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

        if (dateSpawned) {
            const unixTimestampSpawned = Math.floor(dateSpawned.getTime() / 1000);
            const secondsSinceSpawned = unixTimestampNow - unixTimestampSpawned;
            str += ` ${lm.getIntl(language, 'cargoShipBeenOutFor', {
                time: secondsToFullScale(secondsSinceSpawned)
            })} `;
        }

        const numberOfHarborsDocked = `${metaData.harborsDocked.length}`;
        str += ` ${lm.getIntl(language, 'cargoShipDockedAtXHarbors', { num: numberOfHarborsDocked })} `;

        const numberOfLockedCratesSpawned = `${metaData.lockedCrateSpawnCounter}`;
        str += ` ${lm.getIntl(language, 'cargoShipNumberOfLockedCrates', { num: numberOfLockedCratesSpawned })} `;

        if (!metaData.isLeaving) {
            const timer0 = rpInstance.rpMapMarkers.cargoShipEgressTimeoutIds[cargoShip.id];
            const timer1 = rpInstance.rpMapMarkers.cargoShipEgressAfterHarbor1TimeoutIds[cargoShip.id];
            const timer2 = rpInstance.rpMapMarkers.cargoShipEgressAfterHarbor2TimeoutIds[cargoShip.id];

            let timeLeft0: string = '';
            let timeLeft1: string = '';
            if (timer0 && timer0.running && !timer1 && !timer2) {
                const secondsLeft0 = Math.floor(timer0.getTimeLeftMs() / 1000);
                timeLeft0 = secondsToFullScale(secondsLeft0, 'd', false);
            }
            else if (timer0 && timer0.running && timer2 && timer2.running) {
                const secondsLeft0 = Math.floor(timer0.getTimeLeftMs() / 1000);
                timeLeft0 = secondsToFullScale(secondsLeft0, 'd', false);
                const secondsLeft1 = Math.floor(timer2.getTimeLeftMs() / 1000);
                timeLeft1 = secondsToFullScale(secondsLeft1, 'd', false);
            }
            else if (timer1 && timer1.running && timer2 && timer2.running) {
                const secondsLeft0 = Math.floor(timer1.getTimeLeftMs() / 1000);
                timeLeft0 = secondsToFullScale(secondsLeft0, 'd', false);
                const secondsLeft1 = Math.floor(timer2.getTimeLeftMs() / 1000);
                timeLeft1 = secondsToFullScale(secondsLeft1, 'd', false);
            }
            else if (timer0 && !timer0.running && timer2 && timer2.running) {
                const secondsLeft0 = Math.floor(timer2.getTimeLeftMs() / 1000);
                timeLeft0 = secondsToFullScale(secondsLeft0, 'd', false);
            }
            else {
                /* Do nothing */
            }

            if (timeLeft0 !== '' && timeLeft1 !== '') {
                const timeLeftString = lm.getIntl(language, 'cargoShipLeavingInOr', {
                    time1: timeLeft0,
                    time2: timeLeft1
                });
                str += ` ${timeLeftString}`;
            }
            else if (timeLeft0 !== '') {
                const timeLeftString = lm.getIntl(language, 'cargoShipLeavingIn', {
                    time: timeLeft0
                });
                str += ` ${timeLeftString}`;
            }
        }

        response.push(str.trim());
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}