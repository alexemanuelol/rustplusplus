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

import * as rp from 'rustplus-ts';

import { guildInstanceManager as gim } from '../../index';
import { RustPlusInstance } from '../managers/rustPlusManager';
import * as types from '../utils/types';
import { RustPlusTeamInfoMember } from './rustPlusTeamInfoMember';
import { GuildInstance } from '../managers/guildInstanceManager';

export class RustPlusTeamInfo {
    public rpInstance: RustPlusInstance;
    public appTeamInfo: rp.AppTeamInfo;
    public members: Map<types.SteamId, RustPlusTeamInfoMember>;
    public allOnline: boolean;
    public allOffline: boolean;

    constructor(rpInstance: RustPlusInstance, appTeamInfo: rp.AppTeamInfo) {
        this.rpInstance = rpInstance;
        this.appTeamInfo = appTeamInfo;
        this.members = new Map<types.SteamId, RustPlusTeamInfoMember>();
        this.allOnline = false;
        this.allOffline = false;

        this.updateTeamInfo(appTeamInfo);
    }

    public updateTeamInfo(appTeamInfo: rp.AppTeamInfo) {
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;

        if (this.isLeaderSteamIdChanged(appTeamInfo)) {
            // TODO! Perhaps if leader is changed, only update all members but dont notify about new members 
            // or left members, since they are the same, just leader changed?
            // TODO! Notify about leader changed
        }

        let hasChanges = false;
        for (const member of this.getNewMembers(appTeamInfo)) {
            this.addMember(member);

            if (!Object.hasOwn(gInstance.teamMemberChatColorMap, member.steamId)) {
                const letters = '0123456789ABCDEF';
                let color = '#';
                for (let i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }

                gInstance.teamMemberChatColorMap[member.steamId] = color;
                hasChanges = true;
            }
        }
        if (hasChanges) {
            gim.updateGuildInstance(this.rpInstance.guildId);
        }

        for (const member of this.getLeftMembers(appTeamInfo)) {
            this.removeMember(member.steamId);
        }

        for (const member of this.getReminingMembers(appTeamInfo)) {
            const teamMember = this.getMember(member.steamId);
            if (teamMember) {
                teamMember.updateTeamInfoMember(member);
            }
        }

        /* Update variables */
        this.allOnline = true;
        this.allOffline = true;
        for (const member of this.members.values()) {
            this.allOnline = (this.allOnline && member.appTeamInfoMember.isOnline);
            this.allOffline = (this.allOffline && !member.appTeamInfoMember.isOnline);
        }

        this.appTeamInfo = appTeamInfo;
    }

    public isLeaderSteamIdChanged(appTeamInfo: rp.AppTeamInfo): boolean {
        return this.appTeamInfo.leaderSteamId !== appTeamInfo.leaderSteamId;
    }


    /**
     * Other methods
     */

    public addMember(appTeamInfoMember: rp.AppTeamInfo_Member) {
        if (this.members.has(appTeamInfoMember.steamId)) return;
        const member = new RustPlusTeamInfoMember(this.rpInstance, appTeamInfoMember);
        this.members.set(appTeamInfoMember.steamId, member);
    }

    public removeMember(steamId: types.SteamId) {
        this.members.delete(steamId);
    }

    public getMember(steamId: types.SteamId): RustPlusTeamInfoMember | null {
        return this.members.get(steamId) || null;
    }

    public isPlayerInTeam(steamId: types.SteamId): boolean {
        return this.members.has(steamId);
    }

    public getLongestAliveMember(): RustPlusTeamInfoMember | null {
        if (this.members.size === 0) return null;

        let longest: RustPlusTeamInfoMember | null = null;
        for (const member of this.members.values()) {
            if (longest === null || member.getAliveSeconds() > longest.getAliveSeconds()) {
                longest = member;
            }
        }
        return longest;
    }

    public getNewMembers(appTeamInfo: rp.AppTeamInfo): rp.AppTeamInfo_Member[] {
        const newMembers: rp.AppTeamInfo_Member[] = [];
        for (const appMember of appTeamInfo.members) {
            if (!this.isPlayerInTeam(appMember.steamId)) {
                newMembers.push(appMember);
            }
        }
        return newMembers;
    }

    public getLeftMembers(appTeamInfo: rp.AppTeamInfo): rp.AppTeamInfo_Member[] {
        const leftMembers: rp.AppTeamInfo_Member[] = [];
        for (const member of this.members.values()) {
            if (!appTeamInfo.members.find(m => m.steamId === member.appTeamInfoMember.steamId)) {
                leftMembers.push(member.appTeamInfoMember);
            }
        }
        return leftMembers;
    }

    public getReminingMembers(appTeamInfo: rp.AppTeamInfo): rp.AppTeamInfo_Member[] {
        const remainingMembers: rp.AppTeamInfo_Member[] = [];
        for (const member of this.members.values()) {
            const updatedMember = appTeamInfo.members.find(m => m.steamId === member.appTeamInfoMember.steamId);
            if (updatedMember) {
                remainingMembers.push(updatedMember);
            }
        }
        return remainingMembers;
    }
}