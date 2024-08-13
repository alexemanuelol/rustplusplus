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

import { localeManager as lm } from '../..';
import * as guildInstance from '../util/guild-instance';
import { TeamMember, TeamMemberData } from './TeamMember';
const Config = require('../../config');
const { RustPlus } = require('./RustPlus');

export interface TeamInfoResponseData {
    leaderSteamId: number;
    members: TeamMemberData[];
    mapNotes?: Note[];
    leaderMapNotes?: Note[];
}

export interface Note {
    type: NoteType;
    x: number;
    y: number;
}

export enum NoteType {
    DeathMarker = 0,
    MapMarker = 1
}

export class TeamInfo {
    private _leaderSteamId: string;
    private _members: TeamMemberData[];
    private _mapNotes: Note[] | undefined;
    private _leaderMapNotes: Note[] | undefined;

    private _rustplus: typeof RustPlus;

    private _teamMemberObjects: TeamMember[];
    private _teamSize: number;
    private _isAllOnline: boolean;
    private _isAllOffline: boolean;

    private _firstUpdate: boolean;

    constructor(rustplus: typeof RustPlus, teamInfo: TeamInfoResponseData) {
        this._leaderSteamId = teamInfo.leaderSteamId.toString();
        this._members = teamInfo.members;
        this._mapNotes = teamInfo.mapNotes;
        this._leaderMapNotes = teamInfo.leaderMapNotes;

        this._rustplus = rustplus;

        this._teamMemberObjects = [];
        this._teamSize = this._members.length;
        this._isAllOnline = false;
        this._isAllOffline = false;

        this._firstUpdate = true;

        this.updateTeamInfo(teamInfo);
        this._firstUpdate = false;
    }

    /* Getters and Setters */
    get leaderSteamId(): string { return this._leaderSteamId; }
    set leaderSteamId(leaderSteamId: string) { this._leaderSteamId = leaderSteamId; }
    get members(): TeamMemberData[] { return this._members; }
    set members(members: TeamMemberData[]) { this._members = members; }
    get mapNotes(): Note[] | undefined { return this._mapNotes; }
    set mapNotes(mapNotes: Note[] | undefined) { this._mapNotes = mapNotes; }
    get leaderMapNotes(): Note[] | undefined { return this._leaderMapNotes; }
    set leaderMapNotes(leaderMapNotes: Note[] | undefined) { this._leaderMapNotes = leaderMapNotes; }
    get rustplus(): typeof RustPlus { return this._rustplus; }
    set rustplus(rustplus: typeof RustPlus) { this._rustplus = rustplus; }
    get teamMemberObjects(): TeamMember[] { return this._teamMemberObjects; }
    set teamMemberObjects(teamMemberObjects: TeamMember[]) { this._teamMemberObjects = teamMemberObjects; }
    get teamSize(): number { return this._teamSize; }
    set teamSize(teamSize: number) { this._teamSize = teamSize; }
    get isAllOnline(): boolean { return this._isAllOnline; }
    set isAllOnline(isAllOnline: boolean) { this._isAllOnline = isAllOnline; }
    get isAllOffline(): boolean { return this._isAllOffline; }
    set isAllOffline(isAllOffline: boolean) { this._isAllOffline = isAllOffline; }

    /* Change checkers */
    isLeaderSteamIdChanged(teamInfo: TeamInfoResponseData): boolean {
        return this.leaderSteamId !== teamInfo.leaderSteamId.toString();
    }

    updateTeamInfo(teamInfo: TeamInfoResponseData) {
        const guildId = this.rustplus.guildId;
        const instance = guildInstance.readGuildInstanceFile(guildId);

        if (this.isLeaderSteamIdChanged(teamInfo)) {
            const member = teamInfo.members.find(
                m => m.steamId.toString() === teamInfo.leaderSteamId.toString()) as TeamMemberData;
            this.rustplus.info(`${lm.getIntl(Config.general.language, 'commandCap')}: ` +
                lm.getIntl(Config.general.language, 'leaderTransferred', {
                    name: `${member.name}:${member.steamId}`
                }));
        }

        let membersThatLeft = this._firstUpdate ? [] : this.members.slice();
        /* Add new players and update existing players */
        for (const member of teamInfo.members) {
            if (this.members.some(m => m.steamId.toString() === member.steamId.toString()) && !this._firstUpdate) {
                (this.getTeamMember(member.steamId.toString()) as TeamMember).updateTeamMember(member);
                membersThatLeft = membersThatLeft.filter(m => m.steamId.toString() !== member.steamId.toString());
            }
            else {
                this.addTeamMember(member);
            }

            if (!instance.teamChatColors.hasOwnProperty(member.steamId.toString())) {
                const letters = '0123456789ABCDEF';
                let color = '#';
                for (let i = 0; i < 6; i++) {
                    color += letters[Math.floor(Math.random() * 16)];
                }

                instance.teamChatColors[member.steamId.toString()] = color;
            }
        }
        guildInstance.writeGuildInstanceFile(guildId, instance);

        /* Remove players that have left */
        for (const member of membersThatLeft) {
            this.removeTeamMember(member.steamId.toString());
        }

        // TODO fix mapNotes and leaderMapNotes

        /* Update variables */
        this.leaderSteamId = teamInfo.leaderSteamId.toString();
        this.members = teamInfo.members;
        this.mapNotes = teamInfo.mapNotes;
        this.leaderMapNotes = teamInfo.leaderMapNotes;

        this.teamSize = this.teamMemberObjects.length;

        this.isAllOnline = true;
        this.isAllOffline = true;
        for (const teamMember of this.teamMemberObjects) {
            this.isAllOnline = (this.isAllOnline && teamMember.isOnline);
            this.isAllOffline = (this.isAllOffline && !teamMember.isOnline);
        }
    }

    getTeamMember(steamId: string): TeamMember | undefined {
        return this.teamMemberObjects.find(m => m.steamId === steamId);
    }

    addTeamMember(member: TeamMemberData): boolean {
        if (!this.teamMemberObjects.some(m => m.steamId === member.steamId.toString())) {
            this.teamMemberObjects.push(new TeamMember(this.rustplus, member));
            return true;
        }
        return false;
    }

    removeTeamMember(steamId: string): boolean {
        if (this.teamMemberObjects.some(m => m.steamId === steamId)) {
            this.teamMemberObjects = this.teamMemberObjects.filter(m => m.steamId !== steamId);
            return true;
        }
        return false;
    }

    isMemberInTeam(steamId: string): boolean {
        return this.teamMemberObjects.some(m => m.steamId === steamId);
    }

    getTeamMemberLongestAlive(): TeamMember {
        return this.teamMemberObjects.reduce(function (prev, current) {
            return (prev.getAliveSeconds() > current.getAliveSeconds()) ? prev : current;
        })
    }

    async promoteTeamMemberToLeader(steamId: string): Promise<boolean> {
        if (this.isMemberInTeam(steamId)) {
            await this.rustplus.promoteToLeaderAsync(steamId);
            return true;
        }
        return false;
    }

    getNewTeamMembers(teamInfo: TeamInfoResponseData): string[] {
        const newMembers = [];
        for (const member of teamInfo.members) {
            if (!this.isMemberInTeam(member.steamId.toString())) {
                newMembers.push(member.steamId.toString());
            }
        }
        return newMembers;
    }

    getLeftTeamMembers(teamInfo: TeamInfoResponseData): string[] {
        const leftMembers = [];
        for (const teamMember of this.teamMemberObjects) {
            if (!teamInfo.members.some(n => n.steamId.toString() === teamMember.steamId)) {
                leftMembers.push(teamMember.steamId);
            }
        }
        return leftMembers;
    }
}