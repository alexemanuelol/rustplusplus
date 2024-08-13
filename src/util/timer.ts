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

interface TimerCallback {
    (...args: any[]): void;
}

export class Timer {
    private callback: TimerCallback;
    private timeout: number;
    private args: any[];

    private timeoutId: NodeJS.Timeout | null;
    private startDate: Date | null;
    private remaining: number;
    public running: boolean;

    constructor(callback: TimerCallback, timeoutMs: number, ...args: any[]) {
        this.callback = callback;
        this.timeout = timeoutMs;
        this.args = args;

        this.timeoutId = null;
        this.startDate = null;
        this.remaining = this.timeout;
        this.running = false;
    }

    start(): void {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.startDate = new Date();
        this.remaining = this.timeout;
        this.running = true;
        this.timeoutId = setTimeout(this.callback, this.remaining, this.args)
    }

    stop(): void {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.startDate = null;
        this.remaining = 0;
        this.running = false;
    }

    pause(): void {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (!this.startDate || !this.running) return;

        this.running = false;
        const currentDate: Date = new Date();
        const elapsedTime: number = currentDate.getTime() - this.startDate.getTime();
        this.remaining = Math.max(0, Math.floor(this.remaining - elapsedTime));
    }

    resume(): void {
        if (!this.startDate || this.running) return;

        this.startDate = new Date();
        this.running = true;
        this.timeoutId = setTimeout(this.callback, this.remaining, this.args);
    }

    getTimeLeft(): number {
        if (!this.startDate) return 0;

        const currentDate: Date = new Date();
        const elapsedTime: number = currentDate.getTime() - this.startDate.getTime();
        return Math.max(0, Math.floor((this.remaining - elapsedTime) / 1000));
    }
}

export function secondsToFullScale(totSeconds: number, ignore: string = '', longAbbr: boolean = false): string {
    totSeconds = Math.floor(totSeconds);

    const day: number = 86400;
    const hour: number = 3600;
    const minute: number = 60;
    const second: number = 1;

    const originalDays: number = Math.floor(totSeconds / day);
    const originalHours: number = Math.floor((totSeconds - originalDays * day) / hour);
    const originalMinutes: number = Math.floor((totSeconds - originalDays * day - originalHours * hour) / minute);
    const originalSeconds: number = totSeconds - originalDays * day - originalHours * hour - originalMinutes * minute;

    let days: number = 0;
    let hours: number = 0;
    let minutes: number = 0;
    let seconds: number = 0;

    let time: string = '';

    days += originalDays;
    if (days > 0 && !ignore.includes('d')) {
        time += longAbbr ? `${days} days ` : `${days}d `;
    }
    else if (days > 0 && ignore.includes('d')) {
        hours += (day / hour) * days;
    }

    hours += originalHours;
    if (hours > 0 && !ignore.includes('h')) {
        time += longAbbr ? `${hours} hours ` : `${hours}h `;
    }
    else if (hours > 0 && ignore.includes('h')) {
        minutes += (hour / minute) * hours;
    }

    minutes += originalMinutes;
    if (minutes > 0 && !ignore.includes('m')) {
        time += longAbbr ? `${minutes} min ` : `${minutes}m `;
    }
    else if (minutes > 0 && ignore.includes('m')) {
        seconds += (minute / second) * minutes;
    }

    seconds += originalSeconds;
    if (seconds > 0 && !ignore.includes('s')) {
        time += longAbbr ? `${seconds} sec ` : `${seconds}s`;
    }

    time = time.trim();

    if (time === '') {
        if (!ignore.includes('s')) {
            time = longAbbr ? '0 sec' : '0s';
        }
        else if (!ignore.includes('m')) {
            time = longAbbr ? '0 min' : '0m';
        }
        else if (!ignore.includes('h')) {
            time = longAbbr ? '0 hours' : '0h';
        }
        else if (!ignore.includes('d')) {
            time = longAbbr ? '0 days' : '0d';
        }
        else {
            time = longAbbr ? '0 sec' : '0s';
        }
    }
    return time;
}

export function convertDecimalToHoursMinutes(time: number): string {
    const hours: number = Math.floor(time);
    const minutes: number = Math.floor((time - hours) * 60);

    const hoursString: string = (hours < 10) ? `0${hours}`.toString() : hours.toString();
    const minutesString: string = (minutes < 10) ? `0${minutes}`.toString() : minutes.toString();

    return `${hoursString}:${minutesString}`;
}

export function getSecondsFromStringTime(str: string): number | null {
    const matches: string[] | null = str.match(/\d+[dhms]/g);
    let totSeconds: number = 0;

    if (matches === null) {
        return null;
    }

    for (const match of matches) {
        let value: number = parseInt(match.slice(0, -1));
        switch (match[match.length - 1]) {
            case 'd': { /* Days */
                totSeconds += value * 24 * 60 * 60;
            } break;

            case 'h': { /* Hours */
                totSeconds += value * 60 * 60;
            } break;

            case 'm': { /* Minutes */
                totSeconds += value * 60;
            } break;

            case 's': { /* Seconds */
                totSeconds += value;
            } break;

            default: {
            } break;
        }
    }

    return totSeconds;
}

export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function getCurrentDateTime(): string {
    const newDate: Date = new Date();

    const date: string = ('0' + newDate.getDate()).slice(-2);
    const month: string = ('0' + (newDate.getMonth() + 1)).slice(-2);
    const year: number = newDate.getFullYear();
    const hours: number = newDate.getHours();
    const minutes: number = newDate.getMinutes();
    const seconds: number = newDate.getSeconds();

    return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
}

export function getTimeSince(time: Date): number {
    return ((new Date()).getTime() - time.getTime()) / 1000;
}