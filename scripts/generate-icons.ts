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

import { createCanvas, loadImage, Canvas } from '@napi-rs/canvas';
import * as fs from 'fs';
import * as path from 'path';

const TEMPLATES_PATH = 'src/resources/images/icon_templates/';
const OUTPUT_PATH_NOTE_MARKERS = 'src/resources/images/note_markers/';
const OUTPUT_PATH_MARKERS = 'src/resources/images/markers/';

const OTHER_COLORS = {
    Active: '#9CDB2E',
    Inactive: '#DA6816',
    Black: '#000000'
}

const COLORS = {
    Yellow: '#D0D356',
    Blue: '#3074CA',
    Green: '#76A738',
    Red: '#BB3837',
    Purple: '#B15ABE',
    Cyan: '#07E8BE'
}

const ICONS = {
    Pin: 'icon-pin-bg.png',
    Dollar: 'icon-dollar.png',
    Home: 'icon-home.png',
    Parachute: 'icon-parachute.png',
    Scope: 'icon-scope.png',
    Shield: 'icon-shield.png',
    Skull: 'icon-skull.png',
    Sleep: 'icon-sleep.png',
    Zzz: 'icon-zzz.png',
    Gun: 'icon-gun.png',
    Rock: 'icon-rock.png',
    Loot: 'icon-loot.png'
}

async function generateIcon(basePath: string, maskPath: string, color: string, iconPath: string | null = null):
    Promise<Buffer> {
    const baseImage = await loadImage(basePath);
    const maskImage = await loadImage(maskPath);
    const iconImage = iconPath ? await loadImage(iconPath) : null;

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    /* Draw base image */
    ctx.drawImage(baseImage, 0, 0);

    /* Apply color to base */
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, baseImage.width, baseImage.height);
    ctx.globalCompositeOperation = 'source-over';

    /* Draw mask image */
    ctx.drawImage(maskImage, 0, 0);

    if (iconImage) {
        const iconCanvas = createCanvas(iconImage.width, iconImage.height);
        const iconCtx = iconCanvas.getContext('2d');

        /* Draw icon iamge */
        iconCtx.drawImage(iconImage, 0, 0);

        /* Apply color to icon */
        iconCtx.globalCompositeOperation = 'source-atop';
        iconCtx.fillStyle = color;
        iconCtx.fillRect(0, 0, iconImage.width, iconImage.height);
        iconCtx.globalCompositeOperation = 'source-over';

        /* Center the icon on the base */
        const x = (baseImage.width - iconImage.width) / 2;
        const y = (baseImage.height - iconImage.height) / 2;

        /* Draw icon on base */
        ctx.drawImage(iconCanvas as Canvas, x, y);
    }

    return canvas.toBuffer('image/png');
}

async function generateOther(color: string, iconPath: string | null = null) {
    const baseImage = await loadImage(path.join(TEMPLATES_PATH, 'icon-bg.png'));
    const maskImage = await loadImage(path.join(TEMPLATES_PATH, 'icon-bg.png'));
    const iconImage = iconPath ? await loadImage(iconPath) : null;

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext('2d');

    /* Draw base image */
    ctx.drawImage(baseImage, 0, 0);

    /* Apply color to base */
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = OTHER_COLORS.Black;
    ctx.fillRect(0, 0, baseImage.width, baseImage.height);
    ctx.globalCompositeOperation = 'source-over';

    const borderSize = 15;
    const innerWidth = baseImage.width - borderSize * 2;
    const innerHeight = baseImage.height - borderSize * 2;

    /* Position so it stays centered */
    const x = borderSize;
    const y = borderSize;

    ctx.save();
    ctx.beginPath();
    ctx.arc(baseImage.width / 2, baseImage.height / 2, innerWidth / 2, 0, Math.PI * 2);
    ctx.clip();

    /* Draw the inner image scaled down */
    ctx.drawImage(maskImage, x, y, innerWidth, innerHeight);

    /* Apply color to the mask */
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = color;
    ctx.fillRect(x, y, innerWidth, innerHeight);
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();

    if (iconImage) {
        const maxIconWidth = baseImage.width * 0.5;
        const maxIconHeight = baseImage.height * 0.5;

        /* Scale icon while preserving aspect ratio */
        let iconWidth = iconImage.width;
        let iconHeight = iconImage.height;

        const widthRatio = maxIconWidth / iconWidth;
        const heightRatio = maxIconHeight / iconHeight;
        const scale = Math.min(widthRatio, heightRatio, 1); // don't upscale

        iconWidth *= scale;
        iconHeight *= scale;

        /* Center the icon */
        const x = (baseImage.width - iconWidth) / 2;
        const y = (baseImage.height - iconHeight) / 2;

        ctx.drawImage(iconImage, x, y, iconWidth, iconHeight);
    }

    return canvas.toBuffer('image/png');
}

(async () => {
    for (const [colorName, colorValue] of Object.entries(COLORS)) {
        for (const [iconName, iconFile] of Object.entries(ICONS)) {
            for (const item of ['', '-leader']) {
                const base = path.join(TEMPLATES_PATH, iconName === 'Pin' ? 'icon-pin-bg.png' : 'icon-bg.png');
                const mask = path.join(TEMPLATES_PATH,
                    iconName === 'Pin' ? `icon-pin-mask${item}.png` : `icon-bg-mask${item}.png`);
                const icon = iconName === 'Pin' ? null : path.join(TEMPLATES_PATH, iconFile);

                const buffer = await generateIcon(base, mask, colorValue, icon);

                const fileName = `${iconName}${colorName}${item}.png`;
                fs.writeFileSync(path.join(OUTPUT_PATH_NOTE_MARKERS, fileName), buffer);
            }
        }
    }

    let buffer = await generateOther(OTHER_COLORS.Active, null);
    fs.writeFileSync(path.join(OUTPUT_PATH_MARKERS, `player.png`), buffer);

    buffer = await generateOther(OTHER_COLORS.Active, path.join(TEMPLATES_PATH, 'icon-store.png'));
    fs.writeFileSync(path.join(OUTPUT_PATH_MARKERS, `vending_machine_active.png`), buffer);

    buffer = await generateOther(OTHER_COLORS.Inactive, path.join(TEMPLATES_PATH, 'icon-store.png'));
    fs.writeFileSync(path.join(OUTPUT_PATH_MARKERS, `vending_machine_inactive.png`), buffer);
})();