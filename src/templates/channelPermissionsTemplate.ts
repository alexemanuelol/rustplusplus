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

import * as discordjs from 'discord.js';

export interface ChannelPermissions {
    category: RolePermissions;
    settings: RolePermissions;
    servers: RolePermissions;
    information: RolePermissions;
    events: RolePermissions;
    activity: RolePermissions;
    teamchat: RolePermissions;
    commands: RolePermissions;
    smartSwitches: RolePermissions;
    smartSwitchGroups: RolePermissions;
    smartAlarms: RolePermissions;
    storageMonitors: RolePermissions;
    trackers: RolePermissions;
}

export interface RolePermissions {
    everyone: AllowDeny;
    everyoneWhenRolesSet: AllowDeny;
    roles: AllowDeny;
    admins: AllowDeny;
}

export interface AllowDeny {
    allow: bigint[];
    deny: bigint[];
}

export const channelPermissions: ChannelPermissions = {
    category: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: []
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: []
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: []
        }
    },
    settings: {
        everyone: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    servers: {
        everyone: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    information: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    events: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    activity: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    teamchat: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages],
            deny: []
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages],
            deny: []
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages],
            deny: []
        }
    },
    commands: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages],
            deny: []
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages],
            deny: []
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages],
            deny: []
        }
    },
    smartSwitches: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    smartSwitchGroups: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    smartAlarms: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    storageMonitors: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    },
    trackers: {
        everyone: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        everyoneWhenRolesSet: {
            allow: [],
            deny: [discordjs.PermissionsBitField.Flags.ViewChannel, discordjs.PermissionsBitField.Flags.SendMessages]
        },
        roles: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        },
        admins: {
            allow: [discordjs.PermissionsBitField.Flags.ViewChannel],
            deny: [discordjs.PermissionsBitField.Flags.SendMessages]
        }
    }
}