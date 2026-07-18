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

import axios from 'axios';

import { log } from '../../index';

export async function fetchUrl<T>(url: string): Promise<T> {
    try {
        const { data } = await axios.get<T>(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/xml,text/xml,*/*'
            }
        });
        return data;
    }
    catch (err) {
        if (axios.isAxiosError(err)) {
            log.error(`GET ${url} failed (${err.response?.status ?? 'no response'})`);
        }
        throw err;
    }
}

export async function tryFetchUrl<T>(url: string): Promise<T | null> {
    try {
        return await fetchUrl<T>(url);
    }
    catch {
        return null;
    }
}