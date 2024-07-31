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

import * as discordjs from 'discord.js';

import * as guildInstance from '../util/guild-instance';
import { localeManager as lm } from '../../index';
import * as constants from '../util/constants';
import { getTextInput } from "./discord-text-inputs";

export function getModal(options: discordjs.ModalComponentData): discordjs.ModalBuilder {
    const modal = new discordjs.ModalBuilder();

    if (options.hasOwnProperty('customId') && options.customId !== undefined) {
        modal.setCustomId(options.customId);
    }

    if (options.hasOwnProperty('title') && options.title !== undefined) {
        modal.setTitle(options.title.slice(0, constants.MODAL_MAX_TITLE_CHARACTERS));
    }

    if (options.hasOwnProperty('components') && Array.isArray(options.components) && options.components.length !== 0) {
        modal.addComponents(...options.components as discordjs.ActionRowBuilder<discordjs.TextInputBuilder>[]);
    }

    return modal;
}

export function getServerEditModal(guildId: string, serverId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    const identifier = JSON.stringify({ "serverId": serverId });

    const modal = getModal({
        customId: `ServerEdit${identifier}`,
        title: lm.getIntl(language, 'editing'),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'ServerBattlemetricsId',
                label: lm.getIntl(language, 'battlemetricsId'),
                value: server.battlemetricsId === null ? '' : server.battlemetricsId,
                style: discordjs.TextInputStyle.Short,
                required: false,
                minLength: 0,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getCustomTimersEditModal(guildId: string, serverId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    const identifier = JSON.stringify({ "serverId": serverId });

    const modal = getModal({
        customId: `CustomTimersEdit${identifier}`,
        title: lm.getIntl(language, 'customTimerEditDesc'),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'CargoShipEgressTime',
                label: lm.getIntl(language, 'customTimerEditCargoShipEgressLabel'),
                value: `${server.cargoShipEgressTimeMs / 1000}`,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'OilRigCrateUnlockTime',
                label: lm.getIntl(language, 'customTimerEditCrateOilRigUnlockLabel'),
                value: `${server.oilRigLockedCrateUnlockTimeMs / 1000}`,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getSmartSwitchEditModal(guildId: string, serverId: string, entityId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].switches[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    const modal = getModal({
        customId: `SmartSwitchEdit${identifier}`,
        title: lm.getIntl(language, 'editingOf', {
            entity: entity.name.length > 18 ? `${entity.name.slice(0, 18)}..` : entity.name
        }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'SmartSwitchName',
                label: lm.getIntl(language, 'name'),
                value: entity.name,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'SmartSwitchCommand',
                label: lm.getIntl(language, 'customCommand'),
                value: entity.command,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))
        ]
    });

    if (entity.autoDayNightOnOff === 5 || entity.autoDayNightOnOff === 6) {
        modal.addComponents(
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'SmartSwitchProximity',
                label: lm.getIntl(language, 'smartSwitchEditProximityLabel'),
                value: `${entity.proximity}`,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))
        );
    }

    return modal;
}

export function getGroupEditModal(guildId: string, serverId: string, groupId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const group = instance.serverList[serverId].switchGroups[groupId];
    const identifier = JSON.stringify({ "serverId": serverId, "groupId": groupId });

    const modal = getModal({
        customId: `GroupEdit${identifier}`,
        title: lm.getIntl(language, 'editingOf', {
            entity: group.name.length > 18 ? `${group.name.slice(0, 18)}..` : group.name
        }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'GroupName',
                label: lm.getIntl(language, 'name'),
                value: group.name,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'GroupCommand',
                label: lm.getIntl(language, 'customCommand'),
                value: group.command,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getGroupAddSwitchModal(guildId: string, serverId: string, groupId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const group = instance.serverList[serverId].switchGroups[groupId];
    const identifier = JSON.stringify({ "serverId": serverId, "groupId": groupId });

    const modal = getModal({
        customId: `GroupAddSwitch${identifier}`,
        title: lm.getIntl(language, 'groupAddSwitchDesc', { group: group.name }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'GroupAddSwitchId',
                label: lm.getIntl(language, 'entityId'),
                value: '',
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getGroupRemoveSwitchModal(guildId: string, serverId: string, groupId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const group = instance.serverList[serverId].switchGroups[groupId];
    const identifier = JSON.stringify({ "serverId": serverId, "groupId": groupId });

    const modal = getModal({
        customId: `GroupRemoveSwitch${identifier}`,
        title: lm.getIntl(language, 'groupRemoveSwitchDesc', { group: group.name }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'GroupRemoveSwitchId',
                label: lm.getIntl(language, 'entityId'),
                value: '',
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getSmartAlarmEditModal(guildId: string, serverId: string, entityId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].alarms[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    const modal = getModal({
        customId: `SmartAlarmEdit${identifier}`,
        title: lm.getIntl(language, 'editingOf', {
            entity: entity.name.length > 18 ? `${entity.name.slice(0, 18)}..` : entity.name
        }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'SmartAlarmName',
                label: lm.getIntl(language, 'name'),
                value: entity.name,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'SmartAlarmMessage',
                label: lm.getIntl(language, 'message'),
                value: entity.message,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'SmartAlarmCommand',
                label: lm.getIntl(language, 'customCommand'),
                value: entity.command,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getStorageMonitorEditModal(guildId: string, serverId: string, entityId: string):
    discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const identifier = JSON.stringify({ "serverId": serverId, "entityId": entityId });

    const modal = getModal({
        customId: `StorageMonitorEdit${identifier}`,
        title: lm.getIntl(language, 'editingOf', {
            entity: entity.name.length > 18 ? `${entity.name.slice(0, 18)}..` : entity.name
        }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'StorageMonitorName',
                label: lm.getIntl(language, 'name'),
                value: entity.name,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getTrackerEditModal(guildId: string, trackerId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const tracker = instance.trackers[trackerId];
    const identifier = JSON.stringify({ "trackerId": trackerId });

    const modal = getModal({
        customId: `TrackerEdit${identifier}`,
        title: lm.getIntl(language, 'editingOf', {
            entity: tracker.name.length > 18 ? `${tracker.name.slice(0, 18)}..` : tracker.name
        }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'TrackerName',
                label: lm.getIntl(language, 'name'),
                value: tracker.name,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'TrackerBattlemetricsId',
                label: lm.getIntl(language, 'battlemetricsId'),
                value: tracker.battlemetricsId,
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            })),
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'TrackerClanTag',
                label: lm.getIntl(language, 'clanTag'),
                value: tracker.clanTag,
                style: discordjs.TextInputStyle.Short,
                required: false,
                minLength: 0,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getTrackerAddPlayerModal(guildId: string, trackerId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const tracker = instance.trackers[trackerId];
    const identifier = JSON.stringify({ "trackerId": trackerId });

    const modal = getModal({
        customId: `TrackerAddPlayer${identifier}`,
        title: lm.getIntl(language, 'trackerAddPlayerDesc', { tracker: tracker.name }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'TrackerAddPlayerId',
                label: `${lm.getIntl(language, 'steamId')} / ` +
                    `${lm.getIntl(language, 'battlemetricsId')}`,
                value: '',
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}

export function getTrackerRemovePlayerModal(guildId: string, trackerId: string): discordjs.ModalBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const tracker = instance.trackers[trackerId];
    const identifier = JSON.stringify({ "trackerId": trackerId });

    const modal = getModal({
        customId: `TrackerRemovePlayer${identifier}`,
        title: lm.getIntl(language, 'trackerRemovePlayerDesc', { tracker: tracker.name }),
        components: [
            new discordjs.ActionRowBuilder<discordjs.TextInputBuilder>().addComponents(getTextInput({
                customId: 'TrackerRemovePlayerId',
                label: `${lm.getIntl(language, 'steamId')} / ` +
                    `${lm.getIntl(language, 'battlemetricsId')}`,
                value: '',
                style: discordjs.TextInputStyle.Short,
                type: discordjs.ComponentType.TextInput
            }))]
    });

    return modal;
}