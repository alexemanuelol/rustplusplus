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

import * as fs from 'fs';
import * as path from 'path';

export interface HtmlSymbolMap {
    [key: string]: string;
}

export function parseArgs(str: string): string[] {
    return str.trim().split(/[ ]+/);
}

export function getArgs(str: string, n: number = 0): string[] {
    const args: string[] = parseArgs(str);

    if (n < 1) return args;
    const newArgs: string[] = [];

    let remain: string = str;
    let counter: number = 1;
    for (const arg of args) {
        if (counter === n) {
            newArgs.push(remain);
            break;
        }
        remain = remain.slice(arg.length).trim();
        newArgs.push(arg);
        counter += 1;
    }

    return newArgs;
}

export function decodeHtml(str: string): string {
    const filePath: string = path.join(__dirname, '..', 'staticFiles', 'htmlReservedSymbols.json');
    const fileContent: string = fs.readFileSync(filePath, 'utf8');
    const htmlReservedSymbols: HtmlSymbolMap = JSON.parse(fileContent);

    for (const [entity, character] of Object.entries(htmlReservedSymbols)) {
        const regex: RegExp = new RegExp(entity, 'g');
        str = str.replace(regex, character);
    }

    return str;
}

export function removeInvisibleCharacters(str: string): string {
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
    return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
}

export function findClosestString(target: string, candidates: string[], threshold: number = 2): string | null {
    let minDistance: number = Infinity;
    let closestString: string | null = null;

    for (const candidate of candidates) {
        const distance: number = levenshteinDistance(target, candidate);

        if (distance < minDistance) {
            minDistance = distance;
            closestString = candidate;
        }

        if (minDistance === 0) break;
    }

    return minDistance > threshold ? null : closestString;
}

/* Function to calculate Levenshtein distance between two strings */
function levenshteinDistance(s1: string, s2: string): number {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const m: number = s1.length;
    const n: number = s2.length;
    const dp: number[][] = [];

    for (let i: number = 0; i <= m; i++) {
        dp[i] = [i];
    }
    for (let j: number = 0; j <= n; j++) {
        dp[0][j] = j;
    }

    for (let i: number = 1; i <= m; i++) {
        for (let j: number = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            }
            else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j],
                    dp[i][j - 1],
                    dp[i - 1][j - 1]
                );
            }
        }
    }

    return dp[m][n];
}