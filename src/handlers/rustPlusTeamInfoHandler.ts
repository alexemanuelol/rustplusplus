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

import * as rp from 'rustplus-ts';

import { log, localeManager as lm, guildInstanceManager as gim, discordManager as dm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import * as discordMessages from '../discordUtils/discordMessages';
import { RustPlusTeamInfo } from '../structures/rustPlusTeamInfo';
import { RustPlusTeamInfoMember } from '../structures/rustPlusTeamInfoMember';
import { GuildInstance } from '../managers/guildInstanceManager';
import * as constants from '../utils/constants';
import { getPos, getPosString } from '../utils/map';

export async function handler(rpInstance: RustPlusInstance, teamInfo: rp.AppTeamInfo) {
    const fn = '[rustPlusTeamInfoHandler: handler]';
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId
    };
    const rpTeamInfo = rpInstance.rpTeamInfo as RustPlusTeamInfo;
    const gInstance = gim.getGuildInstance(rpInstance.guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    if (rpTeamInfo.isLeaderSteamIdChanged(teamInfo)) {
        /* If leader is changed, only update all members but dont notify about new members
         * or left members, since they are the same, just leader changed.
         */
        return;
    }

    const newMembers = rpTeamInfo.getNewMembers(teamInfo);
    const leftMembers = rpTeamInfo.getLeftMembers(teamInfo);

    for (const leftMember of leftMembers) {
        const member = rpTeamInfo.getMember(leftMember.steamId) as RustPlusTeamInfoMember;
        const str = lm.getIntl(language, 'memberLeftTheTeam', { name: member.appTeamInfoMember.name });
        await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
            constants.COLOR_INACTIVE, leftMember.steamId);
        if (gInstance.generalSettings.inGameChatNotifyConnection) {
            rpInstance.inGameTeamChatQueueMessage(str);
        }
        log.info(`${fn} ${member.appTeamInfoMember.name} left the team.`, logParam);
    }

    for (const newMember of newMembers) {
        const str = lm.getIntl(language, 'memberJoinedTheTeam', { name: newMember.name });
        await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
            constants.COLOR_ACTIVE, newMember.steamId);
        if (gInstance.generalSettings.inGameChatNotifyConnection) {
            rpInstance.inGameTeamChatQueueMessage(str);
        }
        log.info(`${fn} ${newMember.name} joined the team.`, logParam);
    }

    for (const member of rpTeamInfo.members.values()) {
        if (leftMembers.find(m => m.steamId === member.appTeamInfoMember.steamId)) continue;

        const updatedMemberInfo = teamInfo.members.find(m => m.steamId === member.appTeamInfoMember.steamId) as
            rp.AppTeamInfo_Member;

        if (member.isGoneDead(updatedMemberInfo)) {
            const pos = getPos(member.appTeamInfoMember.x, member.appTeamInfoMember.y, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, true) :
                lm.getIntl(language, 'unknown');
            const str = lm.getIntl(language, 'memberJustDied', {
                name: updatedMemberInfo.name,
                pos: posString
            });
            await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
                constants.COLOR_INACTIVE, updatedMemberInfo.steamId);
            if (gInstance.generalSettings.inGameChatNotifyDeath) {
                rpInstance.inGameTeamChatQueueMessage(str);
            }
            log.info(`${fn} ${updatedMemberInfo.name} just died at ${posString}.`, logParam);
        }

        if (member.isGoneAfk(updatedMemberInfo)) {
            const pos = getPos(member.appTeamInfoMember.x, member.appTeamInfoMember.y, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, true) :
                lm.getIntl(language, 'unknown');
            const str = lm.getIntl(language, 'memberJustWentAfk', {
                name: updatedMemberInfo.name,
                pos: posString
            });
            await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
                constants.COLOR_AFK, updatedMemberInfo.steamId);
            if (gInstance.generalSettings.inGameChatNotifyAfk) {
                rpInstance.inGameTeamChatQueueMessage(str);
            }
            log.info(`${fn} ${updatedMemberInfo.name} just went AFK at ${posString}.`, logParam);
        }

        if (member.isAfk() && member.isMoved(updatedMemberInfo)) {
            const afkTime = member.getAfkTime();
            const str = lm.getIntl(language, 'memberJustReturned', {
                name: updatedMemberInfo.name,
                time: afkTime
            });
            await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
                constants.COLOR_ACTIVE, updatedMemberInfo.steamId);
            if (gInstance.generalSettings.inGameChatNotifyAfk) {
                rpInstance.inGameTeamChatQueueMessage(str);
            }
            log.info(`${fn} ${updatedMemberInfo.name} just returned from AFK after ${afkTime}.`, logParam);
        }

        if (member.isGoneOnline(updatedMemberInfo)) {
            const str = lm.getIntl(language, 'memberJustConnected', { name: updatedMemberInfo.name });
            await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
                constants.COLOR_ACTIVE, updatedMemberInfo.steamId);
            if (gInstance.generalSettings.inGameChatNotifyConnection) {
                rpInstance.inGameTeamChatQueueMessage(str);
            }
            log.info(`${fn} ${updatedMemberInfo.name} just connected.`, logParam);
        }

        if (member.isGoneOffline(updatedMemberInfo)) {
            const str = lm.getIntl(language, 'memberJustDisconnected', { name: updatedMemberInfo.name });
            await discordMessages.sendActivityNotificationMessage(dm, rpInstance.guildId, rpInstance.serverId, str,
                constants.COLOR_INACTIVE, updatedMemberInfo.steamId);
            if (gInstance.generalSettings.inGameChatNotifyConnection) {
                rpInstance.inGameTeamChatQueueMessage(str);
            }
            log.info(`${fn} ${updatedMemberInfo.name} just disconnected.`, logParam);
        }
    }
}