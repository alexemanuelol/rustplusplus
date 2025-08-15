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

import { createCanvas, loadImage, GlobalFonts, SKRSContext2D } from '@napi-rs/canvas';
import * as rp from 'rustplus-ts';
import * as fs from 'fs';
import * as path from 'path';

import { guildInstanceManager as gim, localeManager as lm } from '../../index';
import { RustPlusInstance } from '../managers/rustPlusManager';
import { getGridPos, getMonumentsInfo, getDistance } from '../utils/map';
import * as constants from '../utils/constants';
import { GuildInstance } from '../managers/guildInstanceManager';

export interface Point {
    x: number;
    y: number;
}

export class RustPlusMap {
    public rpInstance: RustPlusInstance;
    public appMap: rp.AppMap;

    public invalidClosestMonuments: string[];

    private static fontsRegistered = false;

    constructor(rpInstance: RustPlusInstance, appMap: rp.AppMap) {
        this.rpInstance = rpInstance;
        this.appMap = appMap;

        this.invalidClosestMonuments = [
            'DungeonBase', 'train_tunnel_display_name', 'train_tunnel_link_display_name'
        ];
    }

    public updateMap(appMap: rp.AppMap) {
        this.appMap = appMap;
    }

    public isWidthChanged(appMap: rp.AppMap): boolean {
        return this.appMap.width !== appMap.width;
    }

    public isHeightChanged(appMap: rp.AppMap): boolean {
        return this.appMap.height !== appMap.height;
    }

    public isJpgImageChanged(appMap: rp.AppMap): boolean {
        return JSON.stringify(this.appMap.jpgImage) !== JSON.stringify(appMap.jpgImage);
    }

    public isOceanMarginChanged(appMap: rp.AppMap): boolean {
        return this.appMap.oceanMargin !== appMap.oceanMargin;
    }

    public isMonumentsChanged(appMap: rp.AppMap): boolean {
        return JSON.stringify(this.appMap.monuments) !== JSON.stringify(appMap.monuments);
    }

    public isBackgroundChanged(appMap: rp.AppMap): boolean {
        return this.appMap.background !== appMap.background;
    }

    private static registerFonts() {
        if (!this.fontsRegistered) {
            const fonts: [string, string][] = [
                [path.join(__dirname, '..', 'resources', 'fonts', 'PermanentMarker.ttf'), 'Permanent Marker'],
                [path.join(__dirname, '..', 'resources', 'fonts', 'NotoSans.ttf'), 'Noto Sans']
            ];

            for (const [fontPath, name] of fonts) {
                GlobalFonts.registerFromPath(fontPath, name);
            }
            this.fontsRegistered = true;
        }
    }

    public async writeImage(grids: boolean = false, monuments: boolean = false, markers: boolean = false):
        Promise<string> {
        RustPlusMap.registerFonts();

        const cleanImage = grids === false && monuments === false;
        const imageName = `${this.rpInstance.guildId}_${this.rpInstance.serverId}` +
            `${cleanImage ? '' : '_enhanced'}.png`;

        const image = await loadImage(Buffer.from(this.appMap.jpgImage));
        const canvas = createCanvas(this.appMap.width, this.appMap.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        if (grids) this.drawGridSystem(ctx);
        if (monuments) await this.drawMonuments(ctx);
        if (markers) await this.drawMarkers(ctx);
        // TODO! tracer for cargoship, patrol helicopter, travelling vendor, chinook 47

        const outBuffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`maps/${imageName}`, outBuffer);

        return imageName;
    }

    private drawGridSystem(ctx: SKRSContext2D) {
        const mapSize = this.rpInstance.rpInfo?.appInfo.mapSize;
        if (!mapSize) return;

        const width = this.appMap.width;
        const height = this.appMap.height;
        const oceanMargin = this.appMap.oceanMargin;
        const numberOfGrids = Math.floor(mapSize / constants.GRID_DIAMETER);
        const gridDiameter = mapSize / numberOfGrids;
        const labelPadding = 4;

        const mapWidthInPixels = width - 2 * oceanMargin;
        const mapHeightInPixels = height - 2 * oceanMargin;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;

        ctx.font = '14px "Noto Sans"';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        /* Draw the grid lines */
        ctx.beginPath();
        for (let gridX = 0, x = 0; gridX <= numberOfGrids; gridX += 1, x += gridDiameter) {
            const pixelX = x * (mapWidthInPixels / mapSize) + oceanMargin;

            ctx.moveTo(pixelX, oceanMargin);
            ctx.lineTo(pixelX, height - oceanMargin);
        }
        for (let gridY = 0, y = mapSize; gridY <= numberOfGrids; gridY += 1, y -= gridDiameter) {
            const pixelY = oceanMargin + (mapSize - y) * (mapHeightInPixels / mapSize);

            ctx.moveTo(oceanMargin, pixelY);
            ctx.lineTo(width - oceanMargin, pixelY);
        }
        ctx.stroke();

        /* Write the grid labels */
        for (let gridX = 0, x = 0; gridX < numberOfGrids; gridX += 1, x += gridDiameter) {
            for (let gridY = 0, y = mapSize; gridY < numberOfGrids; gridY += 1, y -= gridDiameter) {
                const pixelX = x * (mapWidthInPixels / mapSize) + oceanMargin;
                const pixelY = height - (y * (mapHeightInPixels / mapSize) + oceanMargin);

                const label = getGridPos(x, y, mapSize) as string;
                ctx.fillText(label, pixelX + labelPadding, pixelY + labelPadding);
            }
        }
    }

    private async drawMonuments(ctx: SKRSContext2D) {
        const mapSize = this.rpInstance.rpInfo?.appInfo.mapSize;
        if (!mapSize) return;

        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;
        const width = this.appMap.width;
        const height = this.appMap.height;
        const oceanMargin = this.appMap.oceanMargin;
        const monuments = this.appMap.monuments;

        const monumentsInfo = getMonumentsInfo().monuments;
        const monumentsWithoutText = [
            'DungeonBase', 'train_tunnel_display_name', 'train_tunnel_link_display_name'
        ];

        ctx.fillStyle = '#000000';
        ctx.font = '16px "Permanent Marker"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const trainTunnel = await loadImage(path.join(__dirname, '..',
            'resources/images/monuments/train_tunnel.png'));
        const trainTunnelLink = await loadImage(path.join(__dirname, '..',
            'resources/images/monuments/train_tunnel_link.png'));
        const sizeOfMonumentIcons = 40;

        for (const monument of monuments) {
            const x = monument.x * ((width - 2 * oceanMargin) / mapSize) + oceanMargin;
            const n = height - 2 * oceanMargin;
            const y = height - (monument.y * (n / mapSize) + oceanMargin);

            if (monumentsWithoutText.includes(monument.token)) {
                if (monument.token === 'train_tunnel_display_name') {
                    ctx.drawImage(trainTunnel, x, y, sizeOfMonumentIcons, sizeOfMonumentIcons);
                }
                else if (monument.token === 'train_tunnel_link_display_name') {
                    ctx.drawImage(trainTunnelLink, x, y, sizeOfMonumentIcons, sizeOfMonumentIcons);
                }
            }
            else {
                const name = Object.keys(monumentsInfo).includes(monument.token) ?
                    lm.getIntl(language, `monumentName-${monument.token}`) : monument.token;
                ctx.fillText(name, x, y);
            }
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private async drawMarkers(ctx: SKRSContext2D) {
        // TODO! TBD
    }

    public getMonumentPointIfInside(point: Point, monumentName: string, radius: number): Point | null {
        const monument = this.appMap.monuments.find(e => monumentName === e.token &&
            getDistance(point.x, point.y, e.x, e.y) <= radius);

        return monument ? { x: monument.x, y: monument.y } : null;
    }

    public getClosestMonument(point: Point): rp.AppMap_Monument {
        const validMonuments = this.appMap.monuments.filter(e => !this.invalidClosestMonuments.includes(e.token));
        return validMonuments.reduce((closest, monument) => {
            const currentDistance = getDistance(point.x, point.y, monument.x, monument.y);
            const closestDistance = getDistance(point.x, point.y, closest.x, closest.y);
            return currentDistance < closestDistance ? monument : closest;
        });
    }
}