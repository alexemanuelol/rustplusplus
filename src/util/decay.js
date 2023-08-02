/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

module.exports = {
    TwigWallMaxHp: 10,
    WoodWallMaxHp: 250,
    StoneWallMaxHp: 500,
    MetalWallMaxHp: 1000,
    ArmoredWallMaxHp: 2000,

    TwigWallDecayTimeSeconds: 1 * 60 * 60,
    WoodWallDecayTimeSeconds: 3 * 60 * 60,
    StoneWallDecayTimeSeconds: 5 * 60 * 60,
    MetalWallDecayTimeSeconds: 8 * 60 * 60,
    ArmoredWallDecayTimeSeconds: 12 * 60 * 60,

    getTimeLeftSeconds: function (client, type, hp) {
        if (isNaN(hp)) return null;

        switch (type.toLowerCase()) {
            case client.intlGet('en', 'commandSyntaxTwig'): {
                if (hp < 0 || hp > this.TwigWallMaxHp) return null;
                return Math.floor(this.TwigWallDecayTimeSeconds * (hp / this.TwigWallMaxHp));
            } break;

            case client.intlGet('en', 'commandSyntaxWood'): {
                if (hp < 0 || hp > this.WoodWallMaxHp) return null;
                return Math.floor(this.WoodWallDecayTimeSeconds * (hp / this.WoodWallMaxHp));
            } break;

            case client.intlGet('en', 'commandSyntaxStone'): {
                if (hp < 0 || hp > this.StoneWallMaxHp) return null;
                return Math.floor(this.StoneWallDecayTimeSeconds * (hp / this.StoneWallMaxHp));
            } break;

            case client.intlGet('en', 'commandSyntaxMetal'): {
                if (hp < 0 || hp > this.MetalWallMaxHp) return null;
                return Math.floor(this.MetalWallDecayTimeSeconds * (hp / this.MetalWallMaxHp));
            } break;

            case client.intlGet('en', 'commandSyntaxArmored'): {
                if (hp < 0 || hp > this.ArmoredWallMaxHp) return null;
                return Math.floor(this.ArmoredWallDecayTimeSeconds * (hp / this.ArmoredWallMaxHp));
            } break;

            default: {
                return undefined;
            } break;
        }

        return null;
    },
}